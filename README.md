# Helia Pubsub Webrtc
Ironing out prestine Developer Experience for Browser to Browser Ipfs Pubsub

## The Goal
The depreciation and archiving of [js-libp2p-webrtc-star](https://github.com/libp2p/js-libp2p-webrtc-star) has left a hole in the developer experience for creating browser to browser webtc based ipfs pubsub applications locally.  It used to be as easy as a [docker-compose](https://gitlab.com/polusarcticus/ipfs-pubsub-webrtc/-/blob/master/docker-compose.yaml?ref_type=heads) like this-  Whereas we got a signalling server, TLS, and a reverse proxy out out of the box to be composed with docker, the current state with [universal-connectivity](https://github.com/libp2p/universal-connectivity/tree/main) relies on the developers constantly refreshing the certhashes on the [Webtransport-bootstrap-node](https://github.com/libp2p/universal-connectivity/blob/8d470ac992c2c5864823fd9ffb1ba37714c008f8/js-peer/src/lib/constants.ts#L6) lest one receives 

```
Failed to establish a connection to https://3.125.128.80:9095/.well-known/libp2p-webtransport?type=noise: net::ERR_QUIC_PROTOCOL_ERROR.QUIC_TLS_CERTIFICATE_UNKNOWN (TLS handshake failure (ENCRYPTION_HANDSHAKE) 46: certificate unknown).
common.js:113 libp2p:webtransport:error caught wt session err +0ms WebTransportError: Opening handshake failed.
common.js:113 libp2p:connection-manager:dial-queue:error error during dial of /ip4/3.125.128.80/udp/9095/quic-v1/webtransport/certhash/uEiAGIlVdiajNz0k1RHjrxlNXN5bb7W4dLPvMJYUrGJ9ZUQ/certhash/uEiDYZsZoO8vuTKlPhxvVR5SFwOkbXfjlsmTLUHNlnG24bg/p2p/12D3KooWEymoJRHaxizLrrKgJ9MhEYpG85fQ7HReRMJuEMLqmNMg +134ms WebTransportError: Opening handshake failed.
common.js:113 libp2p:connection-manager:dial-queue:error dial failed to /ip4/3.125.128.80/udp/9095/quic-v1/webtransport/certhash/uEiAGIlVdiajNz0k1RHjrxlNXN5bb7W4dLPvMJYUrGJ9ZUQ/certhash/uEiDYZsZoO8vuTKlPhxvVR5SFwOkbXfjlsmTLUHNlnG24bg/p2p/12D3KooWEymoJRHaxizLrrKgJ9MhEYpG85fQ7HReRMJuEMLqmNMg +1ms WebTransportError: Opening handshake failed.
```
There doesn't appear to be signalling implicit to Universal-connectivity, so one has to manually copy paste the peer id and its multiaddr into the other client in order to establish a connection.  In most apps one will not be able to exchange this information with other peers.  So This project looks to provide a boiler plate for a signalling server.

[ipfs-pubsub-room](https://github.com/ipfs-shipyard/ipfs-pubsub-room) is currently build with ipfs-js and requires a port over to helia.  This project makes those updates.

This project builds into [react-vite](https://github.com/ipfs-examples/helia-examples/tree/main/examples/helia-vite) and utilizes hooks and providers to serve helia and coordinate pubsub rooms

## Running
```docker compose up```
Will spin up the TLS certificate creator, a webtransport bootstrapping node, and two instances of the react-vite front end.

vite should allocate two ip addresses for each instance, if you navigate to those addresses and proceed through the chrome warning for unsafe tls you can see the beginning of the front end.

Outstanding questions

in 
```
export const WEBTRANSPORT_BOOTSTRAP_NODE = "/ip4/3.125.128.80/udp/9095/quic-v1/webtransport/certhash/uEiAGIlVdiajNz0k1RHjrxlNXN5bb7W4dLPvMJYUrGJ9ZUQ/certhash/uEiDYZsZoO8vuTKlPhxvVR5SFwOkbXfjlsmTLUHNlnG24bg/p2p/12D3KooWEymoJRHaxizLrrKgJ9MhEYpG85fQ7HReRMJuEMLqmNMg"
```
where does the come from
```/p2p/12D3KooWEymoJRHaxizLrrKgJ9MhEYpG85fQ7HReRMJuEMLqmNMg```

Why is the multiaddrs not appearing to make the helia nodes aware of each other

Whats a good way to implement a signalling server if libp2p-js can hit stun servers directly, is it possible to avoid a signalling server.

Will it be possible to avoid webtransport for pure webrtc to query such signalling server through peers by climbing the dht without it



## Future Plans

Once the bugs are sorted, it will be great to create a storage market for filecoin that looks like an open outcry stock exchange, where auctioneers post [EIP-712](https://eips.ethereum.org/EIPS/eip-712) to a pubsub room, and bidders can offer buy offers by sending signatures back