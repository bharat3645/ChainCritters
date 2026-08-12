'use client'
import React from 'react';
import { FaEthereum, FaShieldAlt, FaBolt, FaUsers, FaWallet, FaStar, FaFire, FaWater, FaLeaf, FaWind, FaSun, FaMoon } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

const App: React.FC = () => {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Navigation
      <nav className="fixed w-full z-50 bg-gray-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">ChainCritters</h1>
          <div className="flex items-center gap-8">
            <a href="#marketplace" className="hover:text-purple-400 transition-colors">Marketplace</a>
            <a href="#about" className="hover:text-purple-400 transition-colors">About</a>
            <a href="#contact" className="hover:text-purple-400 transition-colors">Contact</a>
          </div>
        </div>
      </nav> */}

      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Epic Trading Card Game
          </h1>
          <p className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            on the Blockchain
          </p>
          <p className="text-gray-400 text-xl mb-8 max-w-2xl mx-auto">
            Collect, train, and trade powerful cards with unique elements and abilities.
            Level up your cards, stake them for rewards, and become the ultimate card master.
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => router.push('/shop')} className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-lg text-lg transition-all">
              Start Trading
            </button>
            <button className="border border-purple-600 text-purple-400 hover:bg-purple-600/10 px-8 py-3 rounded-lg text-lg transition-all">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <StatCard icon={<FaUsers />} value="10,000+" label="Active Players" />
            <StatCard icon={<FaEthereum />} value="50K ETH" label="Trading Volume" />
            <StatCard icon={<FaBolt />} value="500K+" label="Cards Traded" />
            <StatCard icon={<FaShieldAlt />} value="100%" label="Secure Trading" />
          </div>
        </div>
      </section>

      {/* Featured Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">Featured Cards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <CardPreview key={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Elements Section */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">Card Elements</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            <ElementCard icon={<FaFire />} name="Fire" multiplier="120%" />
            <ElementCard icon={<FaWater />} name="Water" multiplier="110%" />
            <ElementCard icon={<FaLeaf />} name="Earth" multiplier="100%" />
            <ElementCard icon={<FaWind />} name="Air" multiplier="115%" />
            <ElementCard icon={<FaSun />} name="Light" multiplier="130%" />
            <ElementCard icon={<FaMoon />} name="Dark" multiplier="125%" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard 
              number="01"
              title="Collect Cards"
              description="Get unique cards with different elements, powers, and abilities."
            />
            <StepCard 
              number="02"
              title="Train & Level Up"
              description="Stake your cards to earn experience and level them up for more power."
            />
            <StepCard 
              number="03"
              title="Trade & Battle"
              description="Trade cards with other players or use them in epic battles."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-400">
          <p>© 2024 Epic Trading Card Game. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label }) => (
  <div className="bg-gray-800/50 p-6 rounded-xl text-center hover:transform hover:scale-105 transition-all">
    <div className="text-purple-400 text-3xl mb-4 flex justify-center">
      {icon}
    </div>
    <h3 className="text-2xl font-bold mb-2">{value}</h3>
    <p className="text-gray-400">{label}</p>
  </div>
);

const CardPreview: React.FC = () => (
  <div className="bg-gray-800 rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all">
    <div className="aspect-auto flex justify-center items-center bg-gradient-to-br from-purple-500 to-pink-500">
      <div className="p-4">
        <div className="bg-white rounded-lg p-4 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xl font-bold">Dragon Knight</span>
            <FaStar className="text-yellow-400" />
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Level 5</span>
            <span className="text-red-500">Fire</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-500">Power: 120</span>
            <span className="text-green-500">Def: 80</span>
          </div>
        </div>
      </div>
    </div>
    <div className="p-6">
      <h3 className="text-xl font-bold mb-2">Dragon Knight #123</h3>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-purple-400">
          <FaEthereum />
          <span>2.5 ETH</span>
        </div>
        <span className="text-gray-400">Legendary</span>
      </div>
    </div>
  </div>
);

interface ElementCardProps {
  icon: React.ReactNode;
  name: string;
  multiplier: string;
}

const ElementCard: React.FC<ElementCardProps> = ({ icon, name, multiplier }) => (
  <div className="bg-gray-800/50 p-6 rounded-xl text-center hover:transform hover:scale-105 transition-all">
    <div className="text-3xl mb-4 flex justify-center">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2">{name}</h3>
    <p className="text-purple-400">{multiplier} Power</p>
  </div>
);

interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

const StepCard: React.FC<StepCardProps> = ({ number, title, description }) => (
  <div className="bg-gray-800/50 p-6 rounded-xl hover:transform hover:scale-105 transition-all">
    <div className="text-purple-400 text-5xl font-bold mb-4">{number}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

export default App;

