/* eslint-disable no-console */
import { unixfs } from '@helia/unixfs'
import { createHelia } from 'helia'
import { createLibp2p } from 'libp2p'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { webTransport } from '@libp2p/webtransport'
import { mplex } from '@libp2p/mplex'
import { yamux } from '@chainsafe/libp2p-yamux'
import { noise } from '@chainsafe/libp2p-noise'
import * as filters from "@libp2p/websockets/filters"
import { webSockets } from '@libp2p/websockets'
import { webRTC, webRTCDirect } from '@libp2p/webrtc'
import PropTypes from 'prop-types'
import { sha256 } from 'multiformats/hashes/sha2'
import { bootstrap } from '@libp2p/bootstrap'
import { kadDHT } from '@libp2p/kad-dht'
import { identifyService } from 'libp2p/identify'
import { circuitRelayTransport } from 'libp2p/circuit-relay'


import { CHAT_TOPIC, CIRCUIT_RELAY_CODE, WEBRTC_BOOTSTRAP_NODE, WEBTRANSPORT_BOOTSTRAP_NODE } from './constants'

import {
  //React,
  useEffect,
  useState,
  useCallback,
  createContext
} from 'react'

export const HeliaContext = createContext({
  helia: null,
  libp2p: null,
  fs: null,
  error: false,
  starting: true
})

export const HeliaProvider = ({ children }) => {
  const [helia, setHelia] = useState(null)
  const [libp2p, setLibp2p] = useState(null)
  const [fs, setFs] = useState(null)
  const [starting, setStarting] = useState(true)
  const [error, setError] = useState(null)
  const startHelia = useCallback(async () => {
    if (helia) {
      console.info('helia already started')
    } else if (window.helia) {
      console.info('found a windowed instance of helia, populating ...')
      setHelia(window.helia)
      setFs(unixfs(helia))
      setStarting(false)
    } else {
      try {
        const libp2p = await createLibp2p({
          start: true,
          addresses: {
            listen: ['/webrtc']
          },
          transports: [
            webTransport(),
            webSockets({
              filter: filters.all
            }),
            webRTC({
              rtcConfiguration: {
                iceServers: [{
                  urls: [
                    'stun:stun.l.google.com:19302',
                    'stun:global.stun.twilio.com:3478'
                  ]
                }]
              }
            }),
            webRTCDirect(),
            circuitRelayTransport({
              discoverRelay: 1
            })
          ],
          connectionManager: {
            maxConnections: 10,
            minConnections: 5
          },
          streamMuxers: [yamux(), mplex()],
          connectionGater: {
            denyDialMultiaddr: async () => false,
          },
          connectionEncryption: [noise()],
          peerDiscovery: [
            bootstrap({
              list: [
                WEBRTC_BOOTSTRAP_NODE,
                WEBTRANSPORT_BOOTSTRAP_NODE,
              ],
            }),
          ],
          services: {
            pubsub: gossipsub({
              allowPublishToZeroPeers: true,
              msgIdFn: msgIdFnStrictNoSign,
              ignoreDuplicatePublishError: true
            })
          },
          dht: kadDHT({
            protocolPrefix: "/open-outcry",
            maxInboundStreams: 5000,
            maxOutboundStreams: 5000,
            clientMode: true,
          }),
          identify: identifyService()
        })
        libp2p.addEventListener('self:peer:update', ({ detail: { peer } }) => {
          console.log("peer", peer)
          const multiaddrs = peer.addresses.map(({ multiaddr }) => multiaddr)

          console.log(`changed multiaddrs: peer ${peer.id.toString()} multiaddrs: ${multiaddrs}`)
        })
        console.info('Starting Helia')

        const helia = await createHelia({
          libp2p
        })
        setLibp2p(libp2p)
        setHelia(helia)
        setFs(unixfs(helia))
        setStarting(false)
      } catch (e) {
        console.error(e)
        setError(true)
      }
    }
  }, [])

  useEffect(() => {
    startHelia()
  }, [])

  return (
    <HeliaContext.Provider
      value={{
        helia,
        libp2p,
        fs,
        error,
        starting
      }}
    >{children}</HeliaContext.Provider>
  )
}

// message IDs are used to dedupe inbound messages
// every agent in network should use the same message id function
// messages could be perceived as duplicate if this isnt added (as opposed to rust peer which has unique message ids)
export async function msgIdFnStrictNoSign(msg) {
  let enc = new TextEncoder();

  const signedMessage = msg
  const encodedSeqNum = enc.encode(signedMessage.sequenceNumber.toString());
  return await sha256.encode(encodedSeqNum)
}
HeliaProvider.propTypes = {
  children: PropTypes.any
}
