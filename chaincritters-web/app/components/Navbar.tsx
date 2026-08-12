'use client'

import Link from 'next/link'
import WalletConnect from './WalletConnect'

export default function Navbar() {
  return (
      <nav className="fixed w-full z-50 text-white bg-gray-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">ChainCritters</h1>
          <div className="flex items-center gap-8">
            <Link href="/shop" className="hover:text-purple-400 transition-colors">Store</Link>
            <Link href="/profile" className="hover:text-purple-400 transition-colors">profile</Link>
            <Link href="/" className="hover:text-purple-400 transition-colors">Home</Link>
            <WalletConnect />
          </div>
        </div>
      </nav>
  )
}