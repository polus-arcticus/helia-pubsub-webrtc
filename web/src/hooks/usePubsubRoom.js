import { useHelia } from "./useHelia";
import { useState, useEffect, useCallback } from 'react'

import { multiaddr } from '@multiformats/multiaddr'
import Room from '@/pubsub/index'
import { peerIdFromString } from '@libp2p/peer-id'



export const usePubsubRoom = () => {
    const { helia, fs, error, starting } = useHelia()

    const [ peerToConnect, setPeerToConnect] = useState("")
    const [room, setRoom] = useState(null)
    const [peers, setPeers] = useState({})
    const [peerCount, setPeerCount] = useState(0)
    const [roomStatus, setRoomStatus] = useState(false)
    const fetchAuctionRoom = useCallback(async () => {
        const roomInstance = new Room(helia, 'available-auctions')
        roomInstance.on('peer joined', (peer) => {
            console.log('a peer joined the room')
            console.log('peer: ', peer)
            if (!peers[peer]) {
                peers[peer] = true
                setPeers(old => {
                    old[peer] = true
                    return old
                })
                setPeerCount(old => old + 1)
            } else {
                console.log('peer join oversent')
                console.log('test')
            }

        })

        roomInstance.on('subscribed', async () => {
            console.log('Now connected!')
            try {
              const localKeyMap = getAuctionsKeyMap()
              const localAuctions = getAuctions(localKeyMap).filter((auction) => auction.completed == false)
              console.log('localAuctions', localAuc)
              if (localAuctions) {
                await roomInstance.broadcast(JSON.stringify({message: 'new-peer-auctions', auctions: localAuctions, keyMap:localKeyMap }))
              }
      
            } catch (e) {
              console.log(e)
            }
          })
          console.log('setting room instance')
          setRoom(roomInstance)
          setRoomStatus(true)
      
    }, [helia, starting, error])

    const addPeer = useCallback(async () => {
    try {
        await helia.libp2p.peerStore.patch(peerIdFromString(peerToConnect), {

        })
        await helia.libp2p.dial(peerToConnect)
      console.log('peer', peerToConnect)
      const rest = helia.libp2p.addPeer(peerToConnect)
      console.log('rest', rest)
    } catch (e) {
      console.error(e)
      throw e
    }
    }, [peerToConnect])

    useEffect(() => {
        console.log('starting', starting)
        console.log('error', error)
        if (!starting && !error) {
            fetchAuctionRoom()
        } else {
            console.log('ipfs not yet started')
        }
    }, [helia, starting, error])

    return {
        fetchAuctionRoom,
        room,
        peerCount,
        peers,
        peerToConnect,
        setPeerToConnect,
        addPeer
    }
}



