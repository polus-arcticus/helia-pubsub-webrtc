import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useAuctionRoom } from './hooks/useAuctionRoom'
import {useHelia } from './hooks/useHelia'
function App() {
  const { libp2p} =  useHelia()
  const [count, setCount] = useState(0)
  const {room, peerCount, peers} = useAuctionRoom()
  return (
    <div>
      {libp2p && (<p>Libp2p Peer id: {libp2p.peerId.toString()}</p>)}
      <p>Auction Room</p>
      <p>peerCount: {peerCount}</p>
    </div>
  )
}

export default App
