
import React from 'react';
import { Icons } from './Icons';

const FAQView = () => {
  const faqs = [
    { q: "Is the SOL staking real?", a: "Yes. On Mainnet, transactions are irreversible. On Devnet, it uses test tokens. Always verify the network before connecting." },
    { q: "How does the Jail phase work?", a: "For 60 seconds, all audio/video is cut. You must select the suit you think is on your forehead based on information gathered during the round." },
    { q: "Can I play without a wallet?", a: "Yes, you can enter Spectator Mode to watch matches, but you cannot participate in the pot or win rewards." },
    { q: "What happens if I disconnect?", a: "If you disconnect during a live round, your stake remains in the pot. It is treated as an elimination to prevent 'rage quitting' to save funds." },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 px-6 relative">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-10 text-center">
          Frequency Asked <span className="text-[#9945FF]">Questions</span>
        </h1>

        <div className="space-y-4">
           {faqs.map((item, idx) => (
             <div key={idx} className="border border-white/10 rounded-xl bg-white/5 overflow-hidden">
                <div className="p-6 font-bold flex items-start gap-4 cursor-default">
                   <Icons.HelpCircle className="text-gray-500 shrink-0 mt-1" />
                   <div>
                      <div className="text-lg mb-2 text-white">{item.q}</div>
                      <div className="text-gray-400 leading-relaxed text-sm">{item.a}</div>
                   </div>
                </div>
             </div>
           ))}
        </div>

        <div className="mt-20 p-8 border border-red-900/30 bg-red-950/10 rounded-2xl text-center">
           <h3 className="text-red-500 font-bold uppercase mb-2">Disclaimer</h3>
           <p className="text-xs text-red-400/70 leading-relaxed">
              Allies of Borderland is a high-risk social experiment. Smart contracts have not been audited by a third party. Use at your own risk. The Jack takes no responsibility for lost funds.
           </p>
        </div>
      </div>
    </div>
  );
};

export default FAQView;
