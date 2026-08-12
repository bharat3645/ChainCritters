'use client';
import { useEffect, useState } from 'react';
import { FaEthereum, FaEdit, FaTwitter, FaDiscord, FaExchangeAlt, FaFire, FaWater, FaLeaf, FaWind, FaSun, FaMoon, FaStar } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import {useAccount} from 'wagmi'
import {ethers} from 'ethers'
import abi from "../../abi/abi.json"
import { useRouter } from 'next/navigation';
import { API_URL } from '../../lib/api';

interface Card {
  id: number,
  uri: any,
  amount: any,
  level?: number,
  power?: number,
  defense?: number,
  element?: string,
  experience?: number
}

const ShopPage = () => {
  const [activeTab, setActiveTab] = useState('Available');
  const [cards, setCards] = useState<Card[]>([]);
  const {address} = useAccount()
  const contractAddress = "0x14c03AE4342aa2ed24235B3ABFDd0C0aAc118815";
  const [requested, setRequested] = useState<Card[]>([]);
  const [offered, setOffered] = useState<Card[]>([]);

  const router = useRouter();

  useEffect(() => {
    async function getRequested() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi.abi, provider);

        const response = await fetch(`${API_URL}/request?address=${address}`);
        const { requests } = await response.json();

        const requested = await Promise.all(
          requests.map(async (request: any) => {
            const uriInterested = await contract.tokenURI(request.intrestedNFT);
            const uriInterestedData = await fetch(`https://ipfs.io/ipfs/bafybeide72hl3dkhv2e5ibzrigb7ciqri4klzq2jp3gizcaecc3zheyxuy/${uriInterested.split("/").pop()}`);
            if (!uriInterestedData.ok) throw new Error("Failed to fetch token URI");
            const uriInterestedJson = await uriInterestedData.json();

            const uriOffered = await contract.tokenURI(request.offeredNFT);
            const uriOfferedData = await fetch(`https://ipfs.io/ipfs/bafybeide72hl3dkhv2e5ibzrigb7ciqri4klzq2jp3gizcaecc3zheyxuy/${uriOffered.split("/").pop()}`);
            if (!uriOfferedData.ok) throw new Error("Failed to fetch token URI");
            const uriOfferedJson = await uriOfferedData.json();

            return {
              ...request,
              uriInterested: uriInterestedJson,
              uriOffered: uriOfferedJson,
              tokenIdF: request.offeredNFT,
              tokenIdI: request.intrestedNFT,
            };
          })
        );

        const res = await fetch(`${API_URL}/offer?address=${address}`);
        if(!res.ok) throw new Error('Failed to fetch offered cards');
        const {offers} = await res.json();

        const offered = await Promise.all(
          offers.map(async (offer:any)=>{
            const uriOffered = await contract.tokenURI(offer.offeredNFT);
            const uriOfferedData = await fetch(`https://ipfs.io/ipfs/bafybeide72hl3dkhv2e5ibzrigb7ciqri4klzq2jp3gizcaecc3zheyxuy/${uriOffered.split("/").pop()}`);
            if(!uriOfferedData.ok) throw new Error('Failed to fetch token URI');
            const uriOfferedJson = await uriOfferedData.json();

            const uriInterested = await contract.tokenURI(offer.intrestedNFT);
            const uriInterestedData = await fetch(`https://ipfs.io/ipfs/bafybeide72hl3dkhv2e5ibzrigb7ciqri4klzq2jp3gizcaecc3zheyxuy/${uriInterested.split("/").pop()}`);
            if(!uriInterestedData.ok) throw new Error('Failed to fetch token URI');
            const uriInterestedJson = await uriInterestedData.json();
            
            return {
              ...offer,
              uriOffered: uriOfferedJson,
              uriInterested: uriInterestedJson,
              tokenIdF: offer.offeredNFT,
              tokenIdI: offer.intrestedNFT,
            }
          })
        )

        setRequested(requested);
        setOffered(offered);
      } catch (error) {
        console.error("Error fetching requested cards:", error);
      }
    }

    getRequested();
  }, [address]);

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
          setCards((prev:Card[])=>{
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
  },[address])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Card Shop</h1>
          <div className="flex gap-4">
            <button className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition-all">
              Mint New Card
            </button>
            <button className="border border-purple-600 text-purple-400 hover:bg-purple-600/10 px-6 py-2 rounded-lg transition-all">
              My Collection
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 p-4 rounded-xl mb-8">
          <div className="flex flex-wrap gap-4">
            <select className="bg-gray-700 text-white px-4 py-2 rounded-lg">
              <option value="">All Elements</option>
              <option value="fire">Fire</option>
              <option value="water">Water</option>
              <option value="earth">Earth</option>
              <option value="air">Air</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <select className="bg-gray-700 text-white px-4 py-2 rounded-lg">
              <option value="">All Rarities</option>
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>
            <select className="bg-gray-700 text-white px-4 py-2 rounded-lg">
              <option value="">Sort By</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="power">Power</option>
              <option value="level">Level</option>
            </select>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {cards.length > 0 ? (
            cards.map((card: Card) => (
              <CardPreview key={card.id} data={card} />
            ))
          ) : (
            <div className='col-span-full h-[400px] flex flex-col justify-center items-center'>
              <div className='animate-bounce mb-4'>
                <FaStar className="text-6xl text-purple-400" />
              </div>
              <p className="text-gray-400">No cards available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CardPreview = ({data}:{data:Card}) => {
  const router = useRouter();
  
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
    <div className="bg-gray-800 rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all">
      <div className="aspect-auto flex justify-center items-center bg-gradient-to-br from-purple-500 to-pink-500">
        <div className="p-4">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xl font-bold">{data.uri.name}</span>
              <div className={`${getElementColor(data.element || '')}`}>
                {getElementIcon(data.element || '')}
              </div>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Level {data.level}</span>
              <span className={`${getElementColor(data.element || '')}`}>{data.element}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-500">Power: {data.power}</span>
              <span className="text-green-500">Def: {data.defense}</span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              XP: {data.experience}/1000
            </div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-2 flex justify-between items-center">
          <span className="text-lg font-bold">{data.uri.name}</span>
          <button onClick={()=>router.push(`/details/${data.id}`)} className="bg-purple-500 hover:bg-purple-600 text-white text-sm px-3 py-1 rounded-md transition-all">
            Details
          </button>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-purple-400">
            <FaEthereum />
            <span>{data.amount} ETH</span>
          </div>
          <span className="text-gray-400">Legendary</span>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
