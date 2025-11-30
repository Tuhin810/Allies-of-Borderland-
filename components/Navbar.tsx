
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icons } from './Icons';
import { SolanaProfile } from '../services/solana';

interface NavbarProps {
  solanaProfile: SolanaProfile | null;
  onConnectWallet: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ solanaProfile, onConnectWallet }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
  const isActive = (path: string) => normalizedPath === path;

  return (
    <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-md transition-all duration-300">
      <div 
        className="flex items-center gap-2 cursor-pointer group" 
        onClick={() => navigate('/')}
      >
        <div className="w-8 h-8 bg-[#9945FF] rounded flex items-center justify-center font-black text-black shadow-[0_0_15px_#9945FF] group-hover:scale-110 transition-transform">J</div>
        <span className="font-bold tracking-widest text-sm md:text-base text-white group-hover:text-[#9945FF] transition-colors">
            BORDERLAND<span className="text-[#9945FF]">.PROTOCOL</span>
        </span>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-widest text-gray-400">
        <button onClick={() => navigate('/')} className={`hover:text-[#14F195] transition-colors ${isActive('/') ? 'text-white' : ''}`}>Home</button>
        <button onClick={() => navigate('/features')} className={`hover:text-[#14F195] transition-colors ${isActive('/features') ? 'text-white' : ''}`}>Features</button>
        <button onClick={() => navigate('/leaderboard')} className={`hover:text-[#14F195] transition-colors ${isActive('/leaderboard') ? 'text-white' : ''}`}>Leaderboard</button>
        <button onClick={() => navigate('/faq')} className={`hover:text-[#14F195] transition-colors ${isActive('/faq') ? 'text-white' : ''}`}>FAQ</button>
      </div>

      {/* Wallet Connection */}
      {solanaProfile ? (
        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:border-[#14F195]/50 transition-colors cursor-pointer group">
           <div className="flex flex-col items-end leading-none">
              <span className="text-xs font-bold text-white group-hover:text-[#14F195]">{solanaProfile.shortAddress}</span>
              <span className="text-[10px] text-gray-400 font-mono">{solanaProfile.balance.toFixed(2)} SOL</span>
           </div>
           <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#9945FF] to-[#14F195] p-[2px]">
              <img 
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${solanaProfile.address}`} 
                alt="Avatar" 
                className="w-full h-full rounded-full bg-black"
              />
           </div>
        </div>
      ) : (
        <button 
          onClick={onConnectWallet}
          className="group px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#9945FF]/50 rounded text-xs font-bold uppercase transition-all flex items-center gap-2 relative overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-[#9945FF]/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
          <Icons.Wallet size={14} className="relative z-10 text-[#9945FF]" />
          <span className="hidden sm:inline relative z-10">Connect Wallet</span>
        </button>
      )}
    </nav>
  );
};

export default Navbar;
