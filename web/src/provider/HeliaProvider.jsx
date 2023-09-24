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
import {tcp} from "@libp2p/tcp"
import { webSockets } from '@libp2p/websockets'
import { webRTC, webRTCDirect } from '@libp2p/webrtc'
import PropTypes from 'prop-types'
import { sha256 } from 'multiformats/hashes/sha2'
import { bootstrap } from '@libp2p/bootstrap'
import { kadDHT } from '@libp2p/kad-dht'
import { identifyService } from 'libp2p/identify'
import { circuitRelayTransport } from 'libp2p/circuit-relay'
import {mdns} from '@libp2p/mdns'

import { CHAT_TOPIC, CIRCUIT_RELAY_CODE, WEBRTC_BOOTSTRAP_NODE, WEBTRANSPORT_BOOTSTRAP_NODE } from './constants'

import { Circuit, IP, DNS } from '@multiformats/multiaddr-matcher'
import isPrivate from 'private-ip'

/**
 *
 * @param {import('@multiformats/multiaddr').Multiaddr} ma
 *
 * @returns {boolean}
 */
export function isPublicAndDialable(ma) {
  // circuit addresses are probably public
  if (Circuit.matches(ma)) {
    return true
  }

  // dns addresses are probably public?
  if (DNS.matches(ma)) {
    return true
  }

  // ensure we have only IPv4/IPv6 addresses
  if (!IP.matches(ma)) {
    return false
  }

  const options = ma.toOptions()

  return isPrivate(options.host) === false
}
import {
  //React,
  useEffect,
  useState,
  useCallback,
  createContext
} from 'react'

export const HeliaContext = createContext({
  helia: null,
  fs: null,
  error: false,
  starting: true
})

export const HeliaProvider = ({ children }) => {
  const [helia, setHelia] = useState(null)
  const [fs, setFs] = useState(null)
  const [starting, setStarting] = useState(true)
  const [error, setError] = useState(null)
  const [multipleAddresses, setMultipleAddresses ] = useState(null)
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
            circuitRelayTransport({
              discoverRelay: 1
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
            webTransport(),
            webSockets({
              filter: filters.all
            }),
            tcp()
          ],
          connectionManager: {
            maxConnections: 10,
            minConnections: 2
          },
          streamMuxers: [yamux(), mplex()],
          connectionGater: {
            denyDialMultiaddr: async () => false,
          },
          connectionEncryption: [noise()],
          peerDiscovery: [
            bootstrap({
              list: [
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
                '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
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
            }),
            identify: identifyService()
          },
          dht: kadDHT({
            protocolPrefix: "/open-outcry",
            maxInboundStreams: 5000,
            maxOutboundStreams: 5000,
            clientMode: true,
          }),
        })
        console.info('Starting Helia')

        const helia = await createHelia({
          libp2p
        })
        console.log('multiaddr', helia.libp2p.getMultiaddrs())
        helia.libp2p.services.pubsub.subscribe('open-outcry')
        helia.libp2p.addEventListener('self:peer:update', ({ detail: { peer } }) => {
          console.log("peer", peer)
          const multiaddrs = peer.addresses.map(({ multiaddr }) => multiaddr)
          console.log('multiaddrs', multiaddrs)
          console.log(`changed multiaddrs: peer ${peer.id.toString()} multiaddrs: ${multiaddrs}`)
        })
        setHelia(helia)
        setFs(unixfs(helia))
        setStarting(false)
      } catch (e) {
        console.error(e)
        setError(true)
      }
    }
  }, [])

  const waitForDialableNode = useCallback(async () => {
    return new Promise((resolve, reject) => {
      const id = setInterval(() => {
        console.log('checking for multiaddr')
        const publicMultiaddrs = helia.libp2p.getMultiaddrs().filter(isPublicAndDialable)
        if (publicMultiaddrs.length > 0) {
          setMultipleAddresses(publicMultiaddrs)
          clearInterval(id)
          resolve()
        }
      }, 1000)
    })
  }, [helia])

  useEffect(() => {
    startHelia()
  }, [])
  useEffect(() => {
    if (!starting && !error) {
      waitForDialableNode()
    }
  }, [starting, error])

  return (
    <HeliaContext.Provider
      value={{
        helia,
        multipleAddresses,
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
  console.log('msgIdFnStrictNoSign')
  let enc = new TextEncoder();

  const signedMessage = msg
  const encodedSeqNum = enc.encode(signedMessage.sequenceNumber.toString());
  return await sha256.encode(encodedSeqNum)
}
HeliaProvider.propTypes = {
  children: PropTypes.any
}
export const connectToMultiaddr =
  (libp2p) => async (multiaddr) => {
    console.log(`dialling: ${multiaddr.toString()}`)
    try {
      const conn = await libp2p.dial(multiaddr)
      console.info('connected to', conn.remotePeer, 'on', conn.remoteAddr)
      return conn
    } catch (e) {
      console.error(e)
      throw e
    }
  }