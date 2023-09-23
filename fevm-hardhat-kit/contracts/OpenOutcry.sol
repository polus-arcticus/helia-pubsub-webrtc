pragma solidity 0.8.20;
import 'hardhat/console.sol';

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract OpenOutcry {
  event AuctionConsumed(address indexed nft, address indexed token, uint256 nftid, uint256 amount, address indexed auctioneer, address winner);
  uint256 chainId;
  bytes32 DOMAIN_SEPARATOR;
  bytes BID_TYPE = "Bid(address bidder,uint256 amount,uint256 bidderNonce,bytes32 auctionSigHash)";
  bytes AUCTION_TYPE = abi.encodePacked("Auction(address auctioneer,uint256 auctioneerNonce,address nft,uint256 nftId,address token,uint256 bidStart,uint256 deadline,bytes32 auctionSigHash,Bid[] bids,bytes[] bidSigs)", BID_TYPE);
  bytes32 BID_TYPE_HASH = keccak256(BID_TYPE);
  bytes32 AUCTION_TYPE_HASH = keccak256(AUCTION_TYPE);


  struct Bid {
    address bidder;
    uint256 amount;
    uint256 bidderNonce;
    bytes32 auctionSigHash;
  }

  struct Auction {
    address auctioneer;
    uint256 auctioneerNonce;
    address nft;
    uint256 nftId;
    address token;
    uint256 bidStart;
    uint256 deadline;
    bytes32 auctionSigHash;
    Bid[] bids;
    bytes[] bidSigs;
  }

  mapping (address => uint256) public usedNonces;

  constructor() {
    uint256 ch;
    assembly {
      ch := chainid()
    }
    DOMAIN_SEPARATOR = keccak256(
      abi.encode(
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
        keccak256(bytes("EnglishAuction")),
        keccak256(bytes("1")),
        ch,
        address(this)
    )
    );
    chainId = ch;
  }

  function consumeAuction(
    uint8 v,
    bytes32 r,
    bytes32 s,
    Auction memory auction
  ) external {
    bytes32 hashStruct = keccak256(
      abi.encode(
        AUCTION_TYPE_HASH,
        auction.auctioneer,
        auction.auctioneerNonce,
        auction.nft,
        auction.nftId,
        auction.token,
        auction.bidStart,
        auction.deadline,
        auction.auctionSigHash,
        hashBids(auction.bids),
        hashBidSigs(auction.bidSigs)
    )
    );
    bytes32 hash = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, hashStruct));
    require(ecrecover(hash, v, r, s) == msg.sender, "auction can only be consumed by auctioneer");

    // enforce bid ordering in contract in attempt to save gas
    uint256 lastBid = type(uint256).max;
    for (uint i=0;i < auction.bids.length; i++) {
      require(auction.bids[i].amount <= lastBid, "Please order the bids from highest to smallest prior to consuming, this saves gas");
      lastBid = auction.bids[i].amount;
    }
    uint256 iter = 0;
    bool swapMade = false;
    uint256 highBid;
    address highBidder;
    while (!swapMade) {
      if (
        auction.bids[iter].bidderNonce == usedNonces[auction.bids[iter].bidder] &&
        IERC20(auction.token).allowance(auction.bids[iter].bidder, address(this)) >= auction.bids[iter].amount
      ) {
        bytes32 hashStruct = keccak256(
          abi.encode(
            BID_TYPE_HASH,
            auction.bids[iter].bidder,
            auction.bids[iter].amount,
            auction.bids[iter].bidderNonce,
            auction.bids[iter].auctionSigHash
        )
        );
        address signer = recoverSigner(
          keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, hashStruct)),
          auction.bidSigs[iter]
        );
        if (signer == auction.bids[iter].bidder) {
          IERC1155(auction.nft).safeTransferFrom(auction.auctioneer, auction.bids[iter].bidder, auction.nftId, 1, abi.encode('data'));
          IERC20(auction.token).transferFrom(auction.bids[iter].bidder, auction.auctioneer, auction.bids[iter].amount);
          usedNonces[auction.bids[iter].bidder] += 1;
          usedNonces[auction.auctioneer] += 1;
          swapMade = true;
          highBid = auction.bids[iter].amount;
          highBidder = auction.bids[iter].bidder;
        } else {
        console.log("bidder didn't seem to actually sign bid");
          iter++;
        }
      } else {
        console.log('bidder either didnt use nonce or didnt provide allowance');
        iter++;
      }
    }

  emit AuctionConsumed(auction.nft, auction.token, auction.nftId, highBid, msg.sender, highBidder );
}


function hashBidSigs(bytes[] memory bidSigs) internal returns (bytes32) {
  bytes memory packed;
  for (uint i =0; i < bidSigs.length ; i++) {
    packed = abi.encodePacked(packed, keccak256(bidSigs[i])); 
  }
  return keccak256(packed);
}

function hashBids(Bid[] memory bids) internal returns (bytes32) {
  bytes memory packed;
  for (uint i =0; i < bids.length ; i++) {
    bytes32 hashStruct = keccak256(
      abi.encode(
        BID_TYPE_HASH,
        bids[i].bidder,
        bids[i].amount,
        bids[i].bidderNonce,
        bids[i].auctionSigHash
    )
    );
    //type no supported in packed mode
    packed = abi.encodePacked(packed, hashStruct); 
  }
  return keccak256(packed);
}

/// signature methods.
function splitSignature(bytes memory sig)
internal
pure
returns (uint8 v, bytes32 r, bytes32 s)
{
  require(sig.length == 65);

  assembly {
    // first 32 bytes, after the length prefix.
    r := mload(add(sig, 32))
    // second 32 bytes.
    s := mload(add(sig, 64))
    // final byte (first byte of the next 32 bytes).
    v := byte(0, mload(add(sig, 96)))
  }

  return (v, r, s);
}

function recoverSigner(bytes32 message, bytes memory sig)
internal
pure
returns (address)
{
  (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);

  return ecrecover(message, v, r, s);
}
/// builds a prefixed hash to mimic the behavior of eth_sign.
function prefixed(bytes32 hash) internal pure returns (bytes32) {
  return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
}
}

