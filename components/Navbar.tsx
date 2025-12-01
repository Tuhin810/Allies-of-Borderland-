import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icons } from './Icons';
import { Menu, X, Wallet, Coins } from 'lucide-react';
import { SolanaProfile } from '../services/solana';
import { Payment } from './Payment';
import { BorderlandProfile } from '../types/profile';
import { useTokens } from '../contexts/TokenContext';
import { ECONOMY } from '../constants/economy';

interface NavbarProps {
  solanaProfile: SolanaProfile | null;
  onConnectWallet: () => void;
  userProfile?: BorderlandProfile | null;
  onProfileNavigate?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ solanaProfile, onConnectWallet, userProfile, onProfileNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { tokenBalance } = useTokens();

  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
  const isActive = (path: string) => normalizedPath === path;

  // Handle scroll effect for glass intensity
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Token Shop', path: '/payment' },
    { name: 'FAQ', path: '/faq' },
  ];

  // if (userProfile) {
  //   navLinks.push({ name: 'Profile', path: '/profile' });
  // }

  const avatarSeed = userProfile?.avatarSeed ?? solanaProfile?.address;
  const avatarUrl = avatarSeed
    ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(avatarSeed)}`
    : undefined;

  return (
    <>
      {/* Floating Navbar Container */}
      <nav
        className={`fixed -top-3 left-0 right-0 z-50 flex justify-center transition-all duration-300 ${isScrolled ? 'pt-4' : 'pt-6'
          }`}
      >
        <div
          className={`
            w-[95%] max-w-7xl mx-auto 
            rounded-2xl border border-white/10 
            backdrop-blur-xl bg-black/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
            transition-all duration-300 ease-in-out
            ${isMobileMenuOpen ? 'rounded-b-none bg-black/90' : ''}
          `}
        >
          <div className="px-6 py-3 flex justify-between items-center">

            {/* Logo Section */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-[#9945FF] blur opacity-50 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-[#1e1e1e] to-black border border-white/10 rounded-md flex items-center justify-center">
                  <span className="text-[#9945FF] font-black text-lg group-hover:scale-110 transition-transform duration-300">J</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold tracking-[0.2em] text-sm text-white group-hover:text-[#9945FF] transition-colors">
                  BORDERLAND
                </span>
                <span className="text-[10px] tracking-widest text-gray-500 font-mono">PROTOCOL</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center bg-white/5 rounded-full px-2 py-1 border border-white/5">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`
                    relative px-4 py-2 text-xs font-mono uppercase tracking-widest transition-all duration-300 rounded-full
                    ${isActive(link.path)
                      ? 'text-black font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {isActive(link.path) && (
                    <div className="absolute inset-0 bg-[#14F195] rounded-full shadow-[0_0_10px_#14F195] z-0"></div>
                  )}
                  <span className="relative z-10">{link.name}</span>
                </button>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* <Payment /> */}

              {userProfile ? (
                <button
                  onClick={() => onProfileNavigate?.()}
                  className="flex items-center gap-3 pl-4 pr-2 py-1 bg-black/40 rounded-full border border-white/20 hover:border-[#14F195]/60 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col items-end leading-none">
                    <span className="text-xs font-bold text-hite font-mono text-white group-hover:text-[#14F195] transition-colors">
                      {userProfile.username}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 px-2 py-0.5 rounded-full border border-[#9945FF]/30">
                        <Coins size={10} className="text-[#14F195]" />
                        <span className="text-[10px] text-[#14F195] font-mono font-bold">
                          {tokenBalance} {ECONOMY.TOKEN_SYMBOL}
                        </span>
                      </div>
                      {/* {typeof userProfile.walletBalance === 'number' && (
                        <span className="text-[10px] text-gray-400 font-mono">
                          {userProfile.walletBalance.toFixed(2)} SOL
                        </span>
                      )} */}
                      {/* <span className="text-[10px] text-gray-400 font-mono">
                        View Profile
                      </span> */}
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#9945FF] to-[#14F195] p-[2px]">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full bg-black object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-black" />
                    )}
                  </div>
                </button>
              ) : solanaProfile ? (
                <div className="flex items-center gap-3 pl-4 pr-1 py-1 bg-black/40 rounded-full border border-white/10 hover:border-[#9945FF]/50 transition-all cursor-pointer group">
                  <div className="flex flex-col items-end leading-none">
                    <span className="text-xs font-bold text-white font-mono group-hover:text-[#9945FF] transition-colors">
                      {solanaProfile.shortAddress}
                    </span>
                    <span className="text-[10px] text-[#14F195] font-mono">
                      {solanaProfile.balance.toFixed(2)} SOL
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#9945FF] to-[#14F195] p-[2px]">
                    <img
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${solanaProfile.address}`}
                      alt="Avatar"
                      className="w-full h-full rounded-full bg-black object-cover"
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={onConnectWallet}
                  className="group relative px-6 py-2.5 bg-white/5 overflow-hidden rounded-xl border border-white/10 hover:border-[#9945FF] transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <div className="relative flex items-center gap-2">
                    <Wallet size={16} className="text-[#9945FF] group-hover:text-white transition-colors" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Connect</span>
                  </div>
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center gap-4">
              {(userProfile || solanaProfile) && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#9945FF] to-[#14F195] p-[1px]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full bg-black" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-black" />
                  )}
                </div>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white hover:text-[#14F195] transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          <div
            className={`
              md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-white/5
              ${isMobileMenuOpen ? 'max-h-[400px] opacity-100 pb-6' : 'max-h-0 opacity-0'}
            `}
          >
            <div className="flex flex-col p-4 gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => {
                    navigate(link.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full text-left px-4 py-3 rounded-xl text-sm font-mono uppercase tracking-widest transition-colors
                    ${isActive(link.path)
                      ? 'bg-[#9945FF]/20 text-[#14F195] border border-[#9945FF]/30'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  {link.name}
                </button>
              ))}

              <div className="h-px bg-white/10 my-2 mx-4"></div>

              <div className="px-4 flex flex-col gap-3">
                <div className="flex justify-center">
                  <Payment />
                </div>
                {!userProfile && !solanaProfile && (
                  <button
                    onClick={() => {
                      onConnectWallet();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-3 bg-[#9945FF] text-black font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-[#14F195] transition-colors shadow-[0_0_20px_rgba(153,69,255,0.4)]"
                  >
                    Connect Wallet
                  </button>
                )}
                {userProfile && (
                  <button
                    onClick={() => {
                      onProfileNavigate?.();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-3 bg-white/10 border border-white/20 text-white font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-white/20 transition-colors"
                  >
                    Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from hiding behind fixed nav */}
      {/* <div className="h-24"></div> */}
    </>
  );
};

export default Navbar;