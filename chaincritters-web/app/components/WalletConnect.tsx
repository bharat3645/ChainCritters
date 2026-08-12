'use client'

import { useConnect, useAccount, useDisconnect } from 'wagmi'
import { FaWallet } from "react-icons/fa"
import { useState } from 'react'

export default function WalletConnect() {
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { isConnected, address } = useAccount()
  const [isOpen, setIsOpen] = useState(false)

  if (isConnected) {
    return (
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg transition-all"
        >
          <FaWallet />
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </button>
        {isOpen && (
          <button 
            onClick={() => disconnect()} 
            className="absolute top-full right-0 mt-2 bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg transition-all w-full"
          >
            Disconnect
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition-all"
      >
        <FaWallet /> Connect
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-gray-800 rounded-lg overflow-hidden w-48">
          {connectors.map((connector) => (
            <button 
              key={connector.uid} 
              onClick={() => {
                connect({ connector })
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors"
            >
              {connector.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 