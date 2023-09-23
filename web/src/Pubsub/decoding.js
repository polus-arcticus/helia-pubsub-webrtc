import { toString as stringFromUint8Array  } from 'uint8arrays/to-string'

export default (message) => {
  if (!(message instanceof String)) {
        return stringFromUint8Array(message)
      
  }

    return message
  
}


