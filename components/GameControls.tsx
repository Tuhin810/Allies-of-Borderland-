import React from 'react';
import { Suit, GamePhase, Player } from '../types';
import { Icons } from './Icons';

interface GameControlsProps {
  phase: GamePhase;
  guessedSuit: Suit | null | undefined;
  onGuessSuit: (suit: Suit) => void;
  timeLeft: number;
  walletBalance: number;
  players: Player[];
  onBribe: (targetId: string, amount: number) => void;
  isWeb3?: boolean;
  localPlayerId?: string;
}

const GameControls: React.FC<GameControlsProps> = ({ 
  phase, 
  guessedSuit, 
  onGuessSuit, 
  timeLeft,
  walletBalance,
  players,
  onBribe,
  isWeb3,
  localPlayerId
}) => {
  const suits = [
    { type: Suit.HEARTS, icon: Icons.Heart, color: 'text-red-500', bg: 'hover:bg-red-900/30 border-red-500/30' },
    { type: Suit.DIAMONDS, icon: Icons.Diamond, color: 'text-red-500', bg: 'hover:bg-red-900/30 border-red-500/30' },
    { type: Suit.CLUBS, icon: Icons.Club, color: 'text-white', bg: 'hover:bg-gray-800 border-gray-500/30' },
    { type: Suit.SPADES, icon: Icons.Spade, color: 'text-white', bg: 'hover:bg-gray-800 border-gray-500/30' },
  ];

  const handleBribeClick = (target: Player) => {
      const amount = prompt(`How much SOL do you want to send to ${target.name} for info?`);
      if (amount) {
          const val = parseFloat(amount);
          if (val > 0 && val <= walletBalance) {
              onBribe(target.id, val);
          } else {
              alert("Invalid amount or insufficient balance.");
          }
      }
  };

  const isJail = phase === GamePhase.JAIL;
  const isDiscussion = phase === GamePhase.DISCUSSION;

  return (
    <div className="w-full glass-panel rounded-t-2xl md:rounded-2xl p-6 border-t md:border border-white/10 relative transition-all duration-500">
      
      {/* Timer Badge */}
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
         <div className={`px-6 py-2 rounded-full border shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center gap-2 ${
             isJail ? 'bg-red-950 border-red-600 animate-pulse' : 'bg-black border-gray-700'
         }`}>
            {isJail ? <Icons.ShieldAlert size={16} className="text-red-500" /> : <Icons.Mic size={16} className="text-[#14F195]" />}
            <span className={`text-2xl font-mono font-bold ${timeLeft < 10 ? 'text-red-500' : 'text-white'}`}>
            00:{timeLeft.toString().padStart(2, '0')}
            </span>
            <span className="text-xs text-gray-400 uppercase tracking-widest ml-2 border-l border-gray-600 pl-2">
                {isJail ? 'JAIL PHASE' : 'DISCUSSION'}
            </span>
         </div>
      </div>

      <div className="mt-6 flex flex-col md:flex-row items-center gap-6">
        
        {/* Wallet & Bribe Section (Visible during discussion) */}
        <div className={`w-full md:w-1/3 bg-black/40 rounded-xl p-4 border border-white/5 flex flex-col gap-2 transition-opacity ${isJail ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-widest">My Wallet</span>
                <span className="text-[#14F195] font-mono font-bold">{walletBalance.toFixed(3)} SOL</span>
            </div>
            <div className="text-xs text-gray-500 mb-2">Buy info from other players:</div>
            <div className="flex gap-2 overflow-x-auto pb-2">
                {players.filter(p => p.id !== localPlayerId && p.isAlive).map(p => (
                    <button 
                        key={p.id}
                        onClick={() => handleBribeClick(p)}
                        className="flex flex-col items-center p-2 bg-gray-800 rounded hover:bg-gray-700 min-w-[60px]"
                    >
                        <img src={p.avatar} className="w-6 h-6 rounded-full mb-1 opacity-70" />
                        <span className="text-[10px] text-gray-300 truncate w-full text-center">{p.name.split(' ')[0]}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="hidden md:block w-px h-24 bg-white/10"></div>

        {/* Voting Section (Only active in Jail) */}
        <div className="flex-1 w-full flex flex-col items-center">
          <h3 className={`text-sm uppercase tracking-[0.2em] mb-4 font-bold flex items-center gap-2 ${isJail ? 'text-red-500 animate-pulse' : 'text-gray-600'}`}>
             {isJail ? <><Icons.Eye size={16}/> SELECT YOUR SUIT TO SURVIVE</> : 'WAIT FOR JAIL PHASE...'}
          </h3>
          <div className="grid grid-cols-4 gap-4 w-full max-w-xl">
            {suits.map(({ type, icon: Icon, color, bg }) => {
              const isSelected = guessedSuit === type;
              return (
                <button
                  key={type}
                  onClick={() => onGuessSuit(type)}
                  disabled={!isJail}
                  className={`
                    relative flex flex-col items-center justify-center py-4 md:py-6 rounded-xl border-2 transition-all duration-200
                    ${!isJail ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer transform hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'}
                    ${isSelected ? `bg-white/10 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] opacity-100 grayscale-0` : `bg-black/40 border-transparent ${bg}`}
                  `}
                >
                  <Icon className={`w-8 h-8 md:w-10 md:h-10 mb-2 ${color}`} fill={color.includes('red') ? "currentColor" : "white"} />
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-500 rounded-full animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameControls;