'use client'; // Ensure this is at the top of your file

import React, { Suspense, useEffect, useState } from 'react';
import { FaEthereum, FaPaperPlane, FaHeart, FaShare, FaFire, FaWater, FaLeaf, FaWind, FaSun, FaMoon, FaStar, FaShieldAlt, FaBolt, FaLevelUpAlt } from 'react-icons/fa';
import { useSearchParams } from 'next/navigation';
import { ethers } from 'ethers';
import abi from '../../abi/abi.json';
import { useAccount } from 'wagmi';

interface Message {
  id: number;
  sender: string;
  text: string;
  timestamp: string;
}

interface Card {
  id: number;
  uri: any;
  amount: any;
  level?: number;
  power?: number;
  defense?: number;
  element?: string;
  experience?: number;
}

const TradingPage: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'Seller', text: "Hi, I'm interested in trading this card.", timestamp: '10:30 AM' },
    { id: 2, sender: 'You', text: "What's your offer?", timestamp: '10:31 AM' },
  ]);
  const [contract, setContract] = useState<any>(null);
  const {address} = useAccount();

  const searchParams = useSearchParams();
  const detailsParam = searchParams.get('details');
  const details = detailsParam ? JSON.parse(decodeURIComponent(detailsParam)) : null;
  const tradeTokenA = details?.tokenIdF;
  const tradeTokenB = details?.tokenIdI;
  const contractAddress = "0x14c03AE4342aa2ed24235B3ABFDd0C0aAc118815";

  useEffect(() => {
    const setupContract = async () => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractInstance = new ethers.Contract(contractAddress, abi.abi, signer);
      setContract(contractInstance);
    };
    setupContract();
  }, []);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      setMessages([...messages, {
        id: messages.length + 1,
        sender: 'You',
        text: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setMessage('');
    }
  };

  const approveTrade = async (tokenId: number) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi.abi, signer);
    const baddress = await contract.tokenOwner(tradeTokenB);
    const aaddress = await contract.tokenOwner(tradeTokenA);
    const tx = await contract.transferNFT(address, aaddress, tradeTokenB);
    await tx.wait();
    alert(`Trade approved for ${tradeTokenB}`)
  }

  const getElementColor = (element: string) => {
    switch(element) {
      case 'Fire': return 'text-red-500';
      case 'Water': return 'text-blue-500';
      case 'Earth': return 'text-green-500';
      case 'Air': return 'text-gray-400';
      case 'Light': return 'text-yellow-500';
      case 'Dark': return 'text-purple-500';
      default: return 'text-gray-400';
    }
  };

  const getElementIcon = (element: string) => {
    switch(element) {
      case 'Fire': return <FaFire />;
      case 'Water': return <FaWater />;
      case 'Earth': return <FaLeaf />;
      case 'Air': return <FaWind />;
      case 'Light': return <FaSun />;
      case 'Dark': return <FaMoon />;
      default: return <FaStar />;
    }
  };

  return (
    <div className="min-h-screen mt-2 bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className='flex justify-center gap-4 p-4'>
        <button className='bg-green-600 hover:bg-green-700 p-3 rounded-lg transition-all' onClick={() => approveTrade(1)}>
          Approve Trade
        </button>
        <button className='bg-red-600 hover:bg-red-700 p-3 rounded-lg transition-all'>
          Reject Trade
        </button>
      </div>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {details ? (
          <>
            {/* Offered Card */}
            <div className='col-span-4 flex flex-col items-center'>
              <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform transform hover:scale-105">
                <div className="aspect-auto flex justify-center items-center bg-gradient-to-br from-purple-500 to-pink-500">
                  <div className="p-4">
                    <div className="bg-white rounded-lg p-4 shadow-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xl font-bold">{details.uriOffered.name}</span>
                        <div className={`${getElementColor(details.uriOffered.element || '')}`}>
                          {getElementIcon(details.uriOffered.element || '')}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Level {details.uriOffered.level}</span>
                        <span className={`${getElementColor(details.uriOffered.element || '')}`}>
                          {details.uriOffered.element}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-500">Power: {details.uriOffered.power}</span>
                        <span className="text-green-500">Def: {details.uriOffered.defense}</span>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        XP: {details.uriOffered.experience}/1000
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-lg font-bold">{details.uriOffered.name}</h3>
                  <p className="text-gray-400">Offered by: {details.senderAddress}</p>
                </div>
              </div>
            </div>

            {/* Chat Section */}
            <div className="relative col-span-4">
              <div className="sticky top-20 bg-gray-800/50 rounded-2xl p-6 flex flex-col h-[720px] shadow-lg">
                <div className="border-b border-gray-700 pb-4 mb-4">
                  <h2 className="text-xl font-bold">Trade Discussion</h2>
                  <p className="text-gray-400">with @CardMaster</p>
                </div>

                <div className="flex-grow overflow-y-auto mb-4 space-y-4">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-400">{msg.sender}</span>
                        <span className="text-xs text-gray-500">{msg.timestamp}</span>
                      </div>
                      <div className={`px-4 py-2 rounded-xl max-w-[80%] ${
                        msg.sender === 'You' 
                          ? 'bg-purple-600' 
                          : 'bg-gray-700'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={sendMessage} className="flex gap-4">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <button 
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 p-3 rounded-lg transition-all"
                  >
                    <FaPaperPlane />
                  </button>
                </form>
              </div>
            </div>

            {/* Interested Card */}
            <div className='col-span-4 flex flex-col items-center'>
              <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform transform hover:scale-105">
                <div className="aspect-auto flex justify-center items-center bg-gradient-to-br from-purple-500 to-pink-500">
                  <div className="p-4">
                    <div className="bg-white rounded-lg p-4 shadow-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xl font-bold">{details.uriInterested.name}</span>
                        <div className={`${getElementColor(details.uriInterested.element || '')}`}>
                          {getElementIcon(details.uriInterested.element || '')}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Level {details.uriInterested.level}</span>
                        <span className={`${getElementColor(details.uriInterested.element || '')}`}>
                          {details.uriInterested.element}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-500">Power: {details.uriInterested.power}</span>
                        <span className="text-green-500">Def: {details.uriInterested.defense}</span>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        XP: {details.uriInterested.experience}/1000
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-lg font-bold">{details.uriInterested.name}</h3>
                  <p className="text-gray-400">Interested by: {details.personAaddress}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="col-span-12 text-center text-gray-400">No trade details available.</p>
        )}
      </div>
    </div>
  );
};

export default function TradePage() {
  return (
    <Suspense fallback={null}>
      <TradingPage />
    </Suspense>
  );
}