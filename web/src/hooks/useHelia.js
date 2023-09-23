import { useContext } from 'react'
import { HeliaContext } from '@/provider/HeliaProvider'

export const useHelia = () => {
  const { helia, libp2p, fs, error, starting } = useContext(HeliaContext)
  return { helia, libp2p, fs, error, starting }
}
