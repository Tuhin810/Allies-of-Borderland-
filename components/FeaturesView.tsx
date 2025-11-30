
import React from 'react';
import { Icons } from './Icons';

const FeaturesView = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 px-6 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1a103c_0%,_#000000_100%)] z-0 pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#14F195]">
            System Architecture
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            A fusion of Web3 incentives and real-time deception.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors group">
             <div className="w-16 h-16 bg-[#9945FF]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <Icons.Zap className="text-[#9945FF] w-8 h-8" />
             </div>
             <h3 className="text-2xl font-bold mb-4 font-mono uppercase">Solana Pay Integration</h3>
             <p className="text-gray-400 leading-relaxed">
               Direct wallet-to-treasury settlement. Smart contracts manage the pot, taking a 5% protocol fee and distributing the rest to survivors. Zero-knowledge proofs (planned) for card shuffling.
             </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors group">
             <div className="w-16 h-16 bg-[#14F195]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <Icons.Video className="text-[#14F195] w-8 h-8" />
             </div>
             <h3 className="text-2xl font-bold mb-4 font-mono uppercase">P2P Mesh Network</h3>
             <p className="text-gray-400 leading-relaxed">
               Serverless architecture using PeerJS. Video streams are encrypted end-to-end. Latency is minimized by connecting players directly in a mesh topology, reducing server costs to zero.
             </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors group">
             <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <Icons.Cpu className="text-red-500 w-8 h-8" />
             </div>
             <h3 className="text-2xl font-bold mb-4 font-mono uppercase">AI Narrator (The Jack)</h3>
             <p className="text-gray-400 leading-relaxed">
               Gemini 2.5 Flash powers the game master. It analyzes game state to generate dynamic, psychological horror narratives, keeping tension high and ensuring no two rounds feel the same.
             </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors group">
             <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <Icons.ShieldAlert className="text-blue-500 w-8 h-8" />
             </div>
             <h3 className="text-2xl font-bold mb-4 font-mono uppercase">Anti-Cheat Protocol</h3>
             <p className="text-gray-400 leading-relaxed">
               Browser fingerprinting and reputation scores prevent sybil attacks. The "Jail" phase forces blind voting, ensuring that screen-sharing or external comms cannot guarantee a win.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesView;
