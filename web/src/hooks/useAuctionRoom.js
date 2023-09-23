import { useHelia } from "./useHelia";
import { useState, useEffect, useCallback } from 'react'

import Room from '@/pubsub/index'



export const useAuctionRoom = () => {
    const { helia, libp2p, fs, error, starting } = useHelia()
    const [room, setRoom] = useState(null)
    const [peers, setPeers] = useState({})
    const [peerCount, setPeerCount] = useState(0)
    const [roomStatus, setRoomStatus] = useState(false)
    const fetchAuctionRoom = useCallback(async () => {
        console.log('fetch libp2p', libp2p)
        const roomInstance = new Room(libp2p, 'active-auctions-room')
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
      
    }, [helia, libp2p, starting, error])

    useEffect(() => {
        console.log('starting', starting)
        console.log('error', error)
        console.log('libp2p', libp2p)
        if (!starting && !error) {
            fetchAuctionRoom()
        } else {
            console.log('ipfs not yet started')
        }
    }, [helia, libp2p, starting, error])

    return {
        fetchAuctionRoom,
        room,
        peerCount,
        peers
    }
}



