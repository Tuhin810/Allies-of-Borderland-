
import React from 'react';
import { Icons } from './Icons';

const LeaderboardView = () => {
  const mockData = [
    { rank: 1, name: "CryptoKing.sol", winnings: 1245.50, winRate: "88%", status: "Legend" },
    { rank: 2, name: "SatoshiGhost", winnings: 980.20, winRate: "76%", status: "Elite" },
    { rank: 3, name: "DiamondHands", winnings: 850.00, winRate: "72%", status: "Elite" },
    { rank: 4, name: "PaperHands.eth", winnings: 620.10, winRate: "65%", status: "Veteran" },
    { rank: 5, name: "SolanaSurfer", winnings: 410.50, winRate: "59%", status: "Rookie" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 px-6 relative">
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-10">
           <Icons.Trophy className="text-yellow-500 w-12 h-12" />
           <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
             Global Rankings
           </h1>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
           <div className="grid grid-cols-5 p-4 bg-white/5 font-mono text-xs uppercase tracking-widest text-gray-400 font-bold">
              <div className="col-span-1">Rank</div>
              <div className="col-span-2">Player</div>
              <div className="col-span-1 text-right">Net Profit</div>
              <div className="col-span-1 text-right">Win Rate</div>
           </div>
           
           {mockData.map((player, idx) => (
             <div key={idx} className="grid grid-cols-5 p-6 border-b border-white/5 hover:bg-white/5 transition-colors items-center">
                <div className="col-span-1 text-xl font-bold font-mono">
                   {idx === 0 ? <span className="text-yellow-500">#1</span> : 
                    idx === 1 ? <span className="text-gray-400">#2</span> :
                    idx === 2 ? <span className="text-orange-700">#3</span> : `#${player.rank}`}
                </div>
                <div className="col-span-2 flex items-center gap-3">
                   <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${idx === 0 ? 'from-yellow-400 to-yellow-600' : 'from-gray-700 to-gray-900'}`}></div>
                   <div>
                      <div className="font-bold">{player.name}</div>
                      <div className="text-xs text-gray-500 uppercase">{player.status}</div>
                   </div>
                </div>
                <div className="col-span-1 text-right font-mono text-[#14F195] font-bold">
                   {player.winnings.toFixed(2)} SOL
                </div>
                <div className="col-span-1 text-right font-mono text-gray-400">
                   {player.winRate}
                </div>
             </div>
           ))}
        </div>
        
        <div className="mt-8 text-center">
           <button className="px-6 py-3 bg-[#9945FF] text-white font-bold rounded uppercase hover:scale-105 transition-transform">
              View Full Contract Stats
           </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardView;
