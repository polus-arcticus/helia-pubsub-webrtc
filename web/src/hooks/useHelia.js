import { useContext } from 'react'
import { HeliaContext } from '@/provider/HeliaProvider'

export const useHelia = () => {
  const { helia, multipleAddresses, fs, error, starting } = useContext(HeliaContext)
  return { helia, multipleAddresses, fs, error, starting }
}
