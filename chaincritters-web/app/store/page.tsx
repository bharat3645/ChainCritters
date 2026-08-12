'use client';
import { useEffect, useState } from 'react';
import { FaEthereum, FaWallet } from 'react-icons/fa';
import { MdCollections } from 'react-icons/md';
import { BiTransfer } from 'react-icons/bi';
import abi from '../../abi/abi.json';
import {ethers} from 'ethers';

interface NFT {
  id: number;
  uri: any;
  amount: any;
}

const Page = () => {
  const [connected, setConnected] = useState(false);
  const [nft, setNft] = useState<NFT[]>([]);
  const [nftId, setNftId] = useState<number>(0);
  const contractAddress = "0x14c03AE4342aa2ed24235B3ABFDd0C0aAc118815";

useEffect(() => {
  async function setupContract() {
    try {
      // Clear the NFT state at the start of each fetch
      setNft([]);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi.abi, provider);
      const currentTokenId = await contract.tokenId();
      console.log(currentTokenId);

      
      for (let i = 1; i <= currentTokenId; i++) {
        try {
          const uri = await contract.tokenURI(i);
          const response = await fetch(`https://ipfs.io/ipfs/bafybeide72hl3dkhv2e5ibzrigb7ciqri4klzq2jp3gizcaecc3zheyxuy/${uri.split("/").pop()}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          const amount = await contract.getTokenAmount(i);
          // Update state with new token, using functional update to prevent race conditions
          setNft((prev:NFT[]) => {
            // Check if token already exists to prevent duplicates
            if (prev.some((token:NFT) => token.id === i)) {
              return prev;
            }
            return [...prev, { id: i, uri: data, amount: ethers.formatEther(amount) }];
          });
        } catch (err) {
          console.log(`Token ${i} not found`);
        }
      }
    } catch (err) {
      console.error("Error fetching NFTs:", err);
    }
  }

  setupContract();
}, []);



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatsCard 
          title="Total NFTs"
          value="24"
          icon={<MdCollections className="text-purple-400 text-3xl" />}
        />
        <StatsCard 
          title="Trading Volume"
          value="45.3 ETH"
          icon={<FaEthereum className="text-purple-400 text-3xl" />}
        />
        <StatsCard 
          title="Trades"
          value="156"
          icon={<BiTransfer className="text-purple-400 text-3xl" />}
        />
      </div>

      {/* NFT Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Store</h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
          {nft.length > 0 ?
          nft.map((i:NFT) => (
            <NFTCard key={i.id} data={i} />
          ))
          :
          <div className='col-span-full h-[400px] flex flex-col justify-center items-center'>
            <div className='animate-bounce mb-4'>
              <div className='w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg' aria-label="Loading" />
            </div>
          </div>
        }
        </div>
      </div>

      {/* Recent Trades */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Recent Trades</h2>
        <div className="bg-gray-800 rounded-xl p-6">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 text-sm">
                <th className="text-left pb-4">Critter</th>
                <th className="text-left pb-4">Price</th>
                <th className="text-left pb-4">From</th>
                <th className="text-left pb-4">To</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-t border-gray-700">
                  <td className="py-4">Cinderfang #{i}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-1">
                      <FaEthereum />
                      2.5
                    </div>
                  </td>
                  <td className="py-4 text-gray-400">0x1234...5678</td>
                  <td className="py-4 text-gray-400">0x8765...4321</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
  <div className="bg-gray-800 p-6 rounded-xl">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      {icon}
    </div>
    <div className="text-green-400 text-sm">↑ 12.5% from last month</div>
  </div>
);

const NFTCard = ({data}:{data:NFT}) => (
  <div className="bg-gray-800  overflow-hidden hover:transform hover:scale-105 transition-all">
    <div className="aspect-auto  flex justify-center items-center bg-gradient-to-br ">
    <img className='p-3 py-5 ' src={data.uri.image} alt="" />
    </div>
    <div className="p-6">
      <div className=" mb-2 flex justify-between items-center">
        <span className='text-lg font-bold'>{data.uri.name}</span>
        <button className='bg-purple-500 text-white tx-sm px-2 py-1 rounded-md'>Interested</button>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-purple-400">
          <FaEthereum />
          <span>{data.amount} ETH</span>
        </div>
        <span className="text-gray-400">Rare</span>
      </div>
    </div>
  </div>
);

export default Page;
