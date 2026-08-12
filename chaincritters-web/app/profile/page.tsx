'use client';
import { useCallback, useEffect, useState } from 'react';
import { FaEthereum, FaEdit, FaTwitter, FaDiscord, FaExchangeAlt, FaFire, FaWater, FaLeaf, FaWind, FaSun, FaMoon, FaStar, FaShieldAlt, FaBolt, FaLevelUpAlt } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import {useAccount} from 'wagmi'
import {ethers} from 'ethers'
import abi from "../../abi/abi.json"
import { useRouter } from 'next/navigation';
import { API_URL } from '../../lib/api';
import { useTradeSocket } from '../hooks/useTradeSocket';

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

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('Collected');
  const [cards, setCards] = useState<Card[]>([]);
  const {address} = useAccount()
  const contractAddress = "0x14c03AE4342aa2ed24235B3ABFDd0C0aAc118815";
  const [requested, setRequested] = useState<Card[]>([]);
  const [offered, setOffered] = useState<Card[]>([]);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    if (!address) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
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
  }, [address]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // Live push from the WebSockets service: when the counterparty creates an
  // offer to/from this address, or responds to one of ours, refresh the
  // lists instead of leaving the page stale until a manual reload.
  useTradeSocket((event) => {
    if (event.type !== 'OFFER_CREATED' && event.type !== 'OFFER_UPDATED') return;
    const offer = event.offer as { senderAddress?: string; personAId?: string; personBId?: string };
    if (![offer.senderAddress, offer.personAId, offer.personBId].includes(address)) return;

    setNotice(event.type === 'OFFER_CREATED' ? 'New trade offer received' : 'A trade offer was updated');
    fetchOffers();
  });

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const respondToOffer = async (offerId: number, status: 'ACCEPTED' | 'REJECTED') => {
    setRespondingId(offerId);
    try {
      const res = await fetch(`${API_URL}/offer/${offerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Failed to update offer');
      }
      setRequested((prev) => prev.filter((r: any) => r.id !== offerId));
      setNotice(`Offer ${status.toLowerCase()}`);
    } catch (error) {
      console.error('Error responding to offer:', error);
      setNotice((error as Error).message ?? 'Failed to update offer');
    } finally {
      setRespondingId(null);
    }
  };

  useEffect(()=>{
    async function getCards() {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi.abi, provider);
      const tokenId = await contract.tokenId();
      
      for(let i=0; i<tokenId; i++){
        const owner = await contract.tokenOwner(i);
        if(owner===address){
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
            return [...prev, {id:i, uri:data, amount:ethers.formatEther(amount)}]
          })
        }
      }
    }
    getCards()
  },[])

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
      {notice && (
        <div className="fixed top-4 right-4 z-50 bg-purple-600 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse">
          {notice}
        </div>
      )}
      {/* Profile Header */}
      <div className="relative mb-20">
        {/* Cover Image */}
        <div className="h-64 rounded-xl overflow-hidden">
          <img className='w-full h-full object-cover' src="https://images.unsplash.com/photo-1613771404784-3a8dd2e7e0b9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80" alt="" />
        </div>
        
        {/* Profile Picture & Info */}
        <div className="absolute -bottom-16 left-8 flex items-end">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-gray-800 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1031&q=80" alt="" className='w-full h-full object-cover' />
            </div>
            <button className="absolute bottom-0 right-0 bg-gray-800 p-2 rounded-full hover:bg-gray-700">
              <FaEdit />
            </button>
          </div>
          
          <div className="ml-6 mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">CardMaster</h1>
              <MdVerified className="text-blue-500 text-2xl" />
            </div>
            <p className="text-gray-400">Legendary Card Collector • Joined May 2024</p>
          </div>
        </div>

        {/* Stats & Social */}
        <div className="absolute right-8 bottom-4 flex items-center gap-6">
          <div className="flex gap-4">
            <SocialButton icon={<FaTwitter />} username="@cardmaster" />
            <SocialButton icon={<FaDiscord />} username="cardmaster#1234" />
          </div>
          <button className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition-all">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Stats */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        <StatBox label="Cards Collected" value={cards.length.toString()} />
        <StatBox label="Total Value" value="45.3 ETH" />
        <StatBox label="Trades" value="156" />
        <StatBox label="Legendary Cards" value="23" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700 mb-8">
        <div className="flex gap-8">
          <TabButton 
            active={activeTab === 'Collected'} 
            onClick={() => setActiveTab('Collected')}
            label="Collected"
            count={cards.length.toString()}
          />
          <TabButton 
            active={activeTab === 'Requested'} 
            onClick={() => setActiveTab('Requested')}
            label="Requested"
            count={requested.length.toString()}
          />
          <TabButton 
            active={activeTab === 'Offered'} 
            onClick={() => setActiveTab('Offered')}
            label="Offered"
            count={offered.length.toString()}
          />
        </div>
      </div>

      {activeTab === 'Collected' ? (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Your Card Collection</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {cards.length > 0 ? (
              cards.map((card: Card) => (
                <CardPreview key={card.id} data={card} />
              ))
            ) : (
              <div className='col-span-full h-[400px] flex flex-col justify-center items-center'>
                <div className='animate-bounce mb-4'>
                  <FaStar className="w-16 h-16 text-yellow-500" />
                </div>
                <p className="text-gray-400">No cards collected yet</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === 'Requested' ? (
        <div>
          {requested.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {requested.map((request: any) => (
                <div key={request.id} className='bg-gray-800 rounded-lg overflow-hidden shadow-lg'>
                  <div className="p-4">
                    <div className="bg-white rounded-lg p-4 shadow-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xl font-bold">{request.uriOffered.name}</span>
                        <div className={`${getElementColor(request.uriOffered.element || '')}`}>
                          {getElementIcon(request.uriOffered.element || '')}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Level {request.uriOffered.level}</span>
                        <span className={`${getElementColor(request.uriOffered.element || '')}`}>
                          {request.uriOffered.element}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-500">Power: {request.uriOffered.power}</span>
                        <span className="text-green-500">Def: {request.uriOffered.defense}</span>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        XP: {request.uriOffered.experience}/1000
                      </div>
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="text-lg font-bold">{request.uriOffered.name}</h3>
                    <p className="text-gray-400">Requested by: {request.senderAddress}</p>
                    <div className="flex gap-3 mt-3">
                      <button
                        disabled={respondingId === request.id}
                        onClick={() => respondToOffer(request.id, 'ACCEPTED')}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-lg transition-all"
                      >
                        {respondingId === request.id ? '...' : 'Accept'}
                      </button>
                      <button
                        disabled={respondingId === request.id}
                        onClick={() => respondToOffer(request.id, 'REJECTED')}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-lg transition-all"
                      >
                        {respondingId === request.id ? '...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400">No trade requests</div>
          )}
        </div>
      ) : null}

      {activeTab === 'Offered' ? (
        <div>
          {offered.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {offered.map((offer: any) => (
                <div key={offer.id} className='bg-gray-800 rounded-lg overflow-hidden shadow-lg'>
                  <div className="p-4">
                    <div className="bg-white rounded-lg p-4 shadow-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xl font-bold">{offer.uriOffered.name}</span>
                        <div className={`${getElementColor(offer.uriOffered.element || '')}`}>
                          {getElementIcon(offer.uriOffered.element || '')}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Level {offer.uriOffered.level}</span>
                        <span className={`${getElementColor(offer.uriOffered.element || '')}`}>
                          {offer.uriOffered.element}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-500">Power: {offer.uriOffered.power}</span>
                        <span className="text-green-500">Def: {offer.uriOffered.defense}</span>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        XP: {offer.uriOffered.experience}/1000
                      </div>
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="text-lg font-bold">{offer.uriOffered.name}</h3>
                    <p className="text-gray-400">Offered to: {offer.personAaddress}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400">No trade offers</div>
          )}
        </div>
      ) : null}
    </div>
  );
};

const SocialButton = ({ icon, username }: { icon: React.ReactNode, username: string }) => (
  <button className="flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-lg hover:bg-gray-700/50 transition-all">
    {icon}
    <span>{username}</span>
  </button>
);

const StatBox = ({ label, value }: { label: string, value: string }) => (
  <div className="bg-gray-800/50 rounded-xl p-6 text-center">
    <h3 className="text-gray-400 mb-2">{label}</h3>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const TabButton = ({ active, onClick, label, count }: { active: boolean, onClick: () => void, label: string, count: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
      active ? 'bg-purple-600' : 'hover:bg-gray-800/50'
    }`}
  >
    <span>{label}</span>
    <span className="bg-gray-800/50 px-2 py-1 rounded-full text-sm">{count}</span>
  </button>
);

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
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform transform hover:scale-105 cursor-pointer" onClick={() => router.push(`/details/${data.id}`)}>
      <div className="aspect-auto flex justify-center items-center bg-gradient-to-br from-purple-500 to-pink-500">
        <div className="p-4">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xl font-bold">{data.uri.name}</span>
              <div className={`${getElementColor(data.uri.element || '')}`}>
                {getElementIcon(data.uri.element || '')}
              </div>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Level {data.uri.level}</span>
              <span className={`${getElementColor(data.uri.element || '')}`}>
                {data.uri.element}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-500">Power: {data.uri.power}</span>
              <span className="text-green-500">Def: {data.uri.defense}</span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              XP: {data.uri.experience}/1000
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 text-center">
        <h3 className="text-lg font-bold">{data.uri.name}</h3>
        <p className="text-gray-400">Amount: {data.amount}</p>
      </div>
    </div>
  );
};

export default ProfilePage;
