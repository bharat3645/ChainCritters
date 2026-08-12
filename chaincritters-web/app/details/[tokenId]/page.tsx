'use client';

import { useEffect, useState, use } from 'react';
import { FaEthereum, FaHeart, FaFire, FaWater, FaLeaf, FaWind, FaSun, FaMoon, FaStar, FaShieldAlt, FaBolt, FaLevelUpAlt } from 'react-icons/fa';
import { ethers } from 'ethers';
import abi from '../../../abi/abi.json';
import { useAccount } from 'wagmi';
import { API_URL } from '../../../lib/api';

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

export default function CardDetails({ params }: { params: Promise<{ tokenId: string }> }) {
  const resolvedParams = use(params);
  const [card, setCard] = useState<Card | null>(null);
  const [tradeTokenA, setTradeTokenA] = useState<number | null>(Number(resolvedParams.tokenId));
  const [tradeTokenB, setTradeTokenB] = useState<number | null>(null);
  const contractAddress = "0x14c03AE4342aa2ed24235B3ABFDd0C0aAc118815";
  const [userCards, setUserCards] = useState<Card[]>([]);
  const [showDropDown, setShowDropDown] = useState(false);
  const {address} = useAccount();

  useEffect(()=>{
    async function getCards() {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi.abi, provider);
      const tokenId = await contract.tokenId();
      
      for(let i=0; i<tokenId; i++){
        const owner = await contract.tokenOwner(i);
        if(owner === address){
          const uri = await contract.tokenURI(i);
          const response = await fetch(`https://ipfs.io/ipfs/bafybeide72hl3dkhv2e5ibzrigb7ciqri4klzq2jp3gizcaecc3zheyxuy/${uri.split("/").pop()}`)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          const amount = await contract.getTokenAmount(i);
          setUserCards((prev:Card[])=>{
            if(prev.some((x:Card)=>x.id===i)){
              return prev;
            }
            return [...prev, {
              id: i, 
              uri: data, 
              amount: ethers.formatEther(amount),
              level: Math.floor(Math.random() * 10) + 1,
              power: Math.floor(Math.random() * 100) + 50,
              defense: Math.floor(Math.random() * 100) + 50,
              element: ['Fire', 'Water', 'Earth', 'Air', 'Light', 'Dark'][Math.floor(Math.random() * 6)],
              experience: Math.floor(Math.random() * 1000)
            }]
          })
        }
      }
    }
    getCards()
  },[resolvedParams.tokenId, address])

  const proposeTrade = async () => {
    if(tradeTokenA && tradeTokenB){
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi.abi, signer);
      const partyB = await contract.ownerOf(tradeTokenA);

      try {
        const response = await fetch(`${API_URL}/offer`,{
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            senderAddress: address, 
            intrestedNFT: tradeTokenA, 
            offeredNFT: tradeTokenB, 
            personBaddress: partyB, 
            personAaddress: address
          })
        })
        if(!response.ok){
          throw new Error("Failed to propose trade");
        }
        const data = await response.json();
        console.log(data);
      } catch (error) {
        console.error("Error proposing trade:", error);
      }
    }
  }

  useEffect(() => {
    async function getCardDetails() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, abi.abi, provider);
        
        const uri = await contract.tokenURI(resolvedParams.tokenId);
        const response = await fetch(`https://ipfs.io/ipfs/bafybeide72hl3dkhv2e5ibzrigb7ciqri4klzq2jp3gizcaecc3zheyxuy/${uri.split("/").pop()}`);
        const data = await response.json();
        const amount = await contract.getTokenAmount(resolvedParams.tokenId);
        
        setCard({
          id: Number(resolvedParams.tokenId),
          uri: data,
          amount: ethers.formatEther(amount),
          level: Math.floor(Math.random() * 10) + 1,
          power: Math.floor(Math.random() * 100) + 50,
          defense: Math.floor(Math.random() * 100) + 50,
          element: ['Fire', 'Water', 'Earth', 'Air', 'Light', 'Dark'][Math.floor(Math.random() * 6)],
          experience: Math.floor(Math.random() * 1000)
        });
      } catch (err) {
        console.error("Error fetching card:", err);
      }
    }

    getCardDetails();
  }, [resolvedParams.tokenId]);

  if (!card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 flex justify-center items-center">
        <div className="animate-bounce">
          <FaStar className="text-6xl text-purple-400" />
        </div>
      </div>
    );
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card Display */}
        <div className='relative'>
          <div className="sticky top-20 bg-gray-800 rounded-2xl overflow-hidden">
            <div className="aspect-square flex justify-center items-center bg-gradient-to-br from-purple-500 to-pink-500">
              <div className="p-4">
                <div className="bg-white rounded-lg p-4 shadow-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl font-bold">{card.uri.name}</span>
                    <div className={`${getElementColor(card.element || '')}`}>
                      {getElementIcon(card.element || '')}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Level {card.level}</span>
                    <span className={`${getElementColor(card.element || '')}`}>{card.element}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-500">Power: {card.power}</span>
                    <span className="text-green-500">Def: {card.defense}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    XP: {card.experience}/1000
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{card.uri.name}</h1>
            <p className="text-gray-400">{card.uri.description}</p>
          </div>

          {/* Card Stats */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Card Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <FaLevelUpAlt className="text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Level</p>
                  <p className="font-bold">{card.level}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FaBolt className="text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Power</p>
                  <p className="font-bold">{card.power}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FaShieldAlt className="text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Defense</p>
                  <p className="font-bold">{card.defense}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FaStar className="text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">Experience</p>
                  <p className="font-bold">{card.experience}/1000</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trading Section */}
          <div className="bg-gray-800/50 rounded-xl p-6 relative">
            <div className="flex justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">Current Price</p>
                <div className="flex items-center gap-2 text-xl font-bold">
                  <FaEthereum />
                  <span>{card.amount} ETH</span>
                </div>
              </div>
              <button className="flex items-center gap-2 bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 transition-all">
                <FaHeart className="text-red-500" />
                <span>Add to Favorites</span>
              </button>
            </div>
            <button 
              onClick={() => setShowDropDown(prev => !prev)} 
              className="w-full mb-3 bg-purple-600 hover:bg-purple-700 py-3 rounded-lg transition-all"
            >
              Choose Card to Trade
            </button>
            {showDropDown && <DropDown userCards={userCards} setTradeTokenB={setTradeTokenB} />}

            <button 
              onClick={proposeTrade} 
              className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg transition-all"
            >
              Make Offer
            </button>
          </div>

          {/* Card Properties */}
          <div>
            <h2 className="text-xl font-bold mb-4">Card Properties</h2>
            <div className="grid grid-cols-3 gap-4">
              {card.uri.attributes?.map((attr: any, index: number) => (
                <div key={index} className="bg-gray-800/50 p-4 rounded-lg">
                  <p className="text-purple-400 text-sm mb-1">{attr.trait_type}</p>
                  <p className="font-bold">{attr.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trading History */}
          <div>
            <h2 className="text-xl font-bold mb-4">Trading History</h2>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm">
                    <th className="text-left py-2">Event</th>
                    <th className="text-left py-2">Price</th>
                    <th className="text-left py-2">From</th>
                    <th className="text-left py-2">To</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-700">
                    <td className="py-3">Listed</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <FaEthereum />
                        {card.amount}
                      </div>
                    </td>
                    <td className="py-3 text-gray-400">0x1234...5678</td>
                    <td className="py-3 text-gray-400">--</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DropDown({userCards, setTradeTokenB}:{userCards:Card[], setTradeTokenB:any}) {
  return (
    <div className='absolute z-10 left-0 right-0 mt-4 bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-xl'>
      <h3 className="text-lg font-bold mb-4">Select Card to Trade</h3>
      <div className='grid grid-cols-4 gap-4 h-96 overflow-y-auto'>
        {userCards.map((card:Card) => (
          <button 
            key={card.id}
            onClick={()=>setTradeTokenB(card.id)}
            className='bg-gray-700 rounded-lg p-2 hover:bg-gray-600 cursor-pointer transition-all'
          >
            <div className="bg-white rounded-lg p-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold">{card.uri.name}</span>
                <FaStar className="text-yellow-400 text-sm" />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Lvl {card.level}</span>
                <span className="text-blue-500">P: {card.power}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}