import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { usePubsubRoom } from './hooks/useAuctionRoom'
import {useHelia } from './hooks/useHelia'

function App() {
  const { helia, starting, multipleAddresses} =  useHelia()
  const [count, setCount] = useState(0)
  const {
    room,
    peerCount,
    peers,
    peerToConnect, 
    setPeerToConnect,
    addPeer
  } = usePubsubRoom()
  return (
    <div>
      <p>helia is: {starting ? "loading": "ready"}</p>
      {helia && (<p>Libp2p Peer id: {helia.libp2p.peerId.toString()}</p>)}
      {helia && (<p>Libp2p Multiaddrs: { multipleAddresses }</p>)}
      <p>Auction Room</p>
      <input
       type="text"
       name="peerToConnect"
       value={peerToConnect}
       onChange={(evt)=> {setPeerToConnect(evt.target.value)}}
      />
      <p>peerCount: {peerCount}</p>
      <button onClick={async () => {
        addPeer()
        /*
        console.log('subscribers', libp2p.services.pubsub.getSubscribers('open-outcry').toString()) 
        const res = await libp2p.services.pubsub.publish(
          'open-outcry',
          new TextEncoder().encode('hello'),
        )
        console.log(res)
        */
      }}>Click me</button>
    </div>
  )
}

export default App
