import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, metaMask } from '@wagmi/connectors'

export const config = createConfig({ 
  chains: [sepolia],
	  transports: {
	    [sepolia.id]: http(),
  },connectors: [
    injected(),
    metaMask(),
  ],
})