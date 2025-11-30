import React, { useEffect, useState } from 'react';
import { Icons } from './Icons';

interface LandingViewProps {
  onConnectWallet: () => void;
  onGuestEnter: () => void;
  onGoogleLogin?: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onConnectWallet, onGuestEnter, onGoogleLogin }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-[#050505] text-white overflow-hidden relative selection:bg-[#9945FF] selection:text-white font-sans w-full min-h-screen">
      
      {/* --- BACKGROUND FX --- */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,_#1a103c_0%,_#000000_70%)] z-0 pointer-events-none"></div>
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay z-0 pointer-events-none"></div>
      
      {/* 3D Grid Floor */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-[80vh] bg-[linear-gradient(to_bottom,transparent_0%,#000_100%),linear-gradient(rgba(153,69,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(153,69,255,0.1)_1px,transparent_1px)] bg-[size:60px_60px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom opacity-20 z-0 pointer-events-none transition-transform duration-100 will-change-transform"
        style={{ transform: `perspective(500px) rotateX(60deg) translateY(${scrollY * 0.1}px)` }}
      ></div>

      {/* --- FLOATING 3D CARDS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden perspective-[1000px]">
          
          {/* Card 1: Ace of Spades (Left) */}
          <div className="absolute top-[15%] left-[5%] md:left-[10%] animate-[float_6s_ease-in-out_infinite] will-change-transform">
             <div className="w-32 h-48 md:w-48 md:h-72 bg-[#0a0a0a]/80 backdrop-blur-xl border border-[#9945FF]/40 rounded-2xl p-4 flex flex-col justify-between shadow-[0_0_50px_rgba(153,69,255,0.15)] rotate-[-12deg] group hover:scale-105 transition-transform duration-500">
                <div className="text-[#9945FF] font-mono text-2xl md:text-3xl font-bold leading-none">A<br/><Icons.Spade size={20} className="md:w-6 md:h-6"/></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-80"><Icons.Spade size={80} className="text-[#9945FF] md:w-32 md:h-32" /></div>
                <div className="text-[#9945FF] font-mono text-2xl md:text-3xl font-bold rotate-180 self-end leading-none">A<br/><Icons.Spade size={20} className="md:w-6 md:h-6"/></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-2xl"></div>
             </div>
          </div>

          {/* Card 2: King of Hearts (Right) */}
          <div className="absolute top-[25%] right-[5%] md:right-[12%] animate-[float_8s_ease-in-out_infinite_1s] will-change-transform">
             <div className="w-28 h-40 md:w-40 md:h-60 bg-[#0a0a0a]/80 backdrop-blur-xl border border-red-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-[0_0_50px_rgba(220,38,38,0.15)] rotate-[15deg]">
                <div className="text-red-600 font-mono text-xl md:text-2xl font-bold leading-none">K<br/><Icons.Heart size={16} className="md:w-5 md:h-5"/></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-80"><Icons.Heart size={64} className="text-red-600 md:w-24 md:h-24" /></div>
                <div className="text-red-600 font-mono text-xl md:text-2xl font-bold rotate-180 self-end leading-none">K<br/><Icons.Heart size={16} className="md:w-5 md:h-5"/></div>
             </div>
          </div>

           {/* Card 3: The Jack (Background Center) */}
           <div className="absolute bottom-[5%] left-[50%] md:left-[45%] -translate-x-1/2 animate-[float_10s_ease-in-out_infinite_2s] z-[-1] opacity-40 blur-[1px]">
             <div className="w-56 h-80 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-[0_0_100px_rgba(0,0,0,1)] rotate-[5deg] grayscale">
                <div className="text-gray-400 font-mono text-4xl font-bold leading-none">J<br/><Icons.Users size={24}/></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-50"><Icons.Skull size={100} className="text-white" /></div>
                <div className="text-gray-400 font-mono text-4xl font-bold rotate-180 self-end leading-none">J<br/><Icons.Users size={24}/></div>
             </div>
          </div>
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 z-10">
        
        {/* Animated Badge */}
        <div className="mb-10 px-6 py-2 rounded-full border border-[#14F195]/30 bg-[#14F195]/5 backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-8 duration-1000 shadow-[0_0_20px_rgba(20,241,149,0.1)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14F195] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14F195]"></span>
          </span>
          <span className="text-[10px] md:text-xs font-mono uppercase tracking-[0.25em] text-[#14F195] font-bold">
            Live on Solana Devnet
          </span>
        </div>

        {/* Main Title */}
        <div className="relative mb-8 text-center group perspective-[1000px]">
          <h1 className="text-8xl md:text-[11rem] font-black tracking-tighter text-white relative z-10 mix-blend-normal drop-shadow-[0_0_60px_rgba(153,69,255,0.4)] leading-[0.85] select-none">
            THE <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#9945FF] via-[#7B2CBF] to-[#14F195] relative inline-block animate-pulse-slow">
               JACK
            </span>
          </h1>
          <div className="absolute -inset-10 bg-[#9945FF] opacity-[0.03] blur-[100px] rounded-full z-0"></div>
        </div>

        {/* Subtitle */}
        <p className="text-lg md:text-2xl text-gray-400 max-w-2xl text-center mb-16 font-light leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          High-stakes social deduction protocol.<br className="hidden md:block"/> 
          <span className="text-gray-500">
             Stakes are real. <span className="text-white font-medium">Trust is currency.</span> Death is permanent.
          </span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-5 w-full max-w-lg mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <button 
            onClick={onConnectWallet}
            className="flex-1 group relative px-8 py-4 bg-[#9945FF] text-white font-bold tracking-widest uppercase transition-all duration-300 rounded-lg shadow-[0_0_30px_rgba(153,69,255,0.4)] hover:shadow-[0_0_60px_rgba(153,69,255,0.6)] hover:scale-105 overflow-hidden ring-1 ring-[#9945FF]"
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] w-[200%] h-full translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
            <div className="flex items-center justify-center gap-3 relative z-10">
              <Icons.Wallet size={20} />
              <span>Connect Wallet</span>
            </div>
          </button>
          <button 
            onClick={() => onGoogleLogin?.()}
            className="flex-1 px-8 py-4 bg-white text-black font-bold tracking-widest uppercase transition-all duration-300 rounded-lg border border-white/10 hover:border-white/40 hover:scale-105 flex items-center justify-center gap-3"
            aria-label="Sign in with Google"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 533.5 544.3" className="w-5 h-5">
              <path fill="#4285f4" d="M533.5 278.4c0-17-1.5-33.6-4.3-49.6H272v93.9h147.1c-6.4 34.6-25.4 63.9-54 83.6v69.4h87.1c51-47 80.3-116.2 80.3-197.3z"/>
              <path fill="#34a853" d="M272 544.3c73.4 0 135.1-24.3 180.1-66.1l-87.1-69.4c-24.2 16.3-55.1 26-93 26-71.4 0-132-48.1-153.5-112.6H30.3v70.9C74.8 482.8 167.2 544.3 272 544.3z"/>
              <path fill="#fbbc04" d="M118.5 325.3c-11.8-34.6-11.8-71.6 0-106.2V148.2H30.3c-38.6 76.9-38.6 168.2 0 245.1l88.2-68z"/>
              <path fill="#ea4335" d="M272 109.6c39.8 0 76 13.6 104.3 40.2l78.2-78.2C404.4 24.5 343 0 272 0 167.2 0 74.8 61.5 30.3 148.2l88.2 70.9C140 157.7 200.6 109.6 272 109.6z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>
          <button 
            onClick={onGuestEnter}
            className="flex-1 px-8 py-4 bg-white/5 border border-white/10 hover:border-white/40 hover:bg-white/10 text-gray-300 hover:text-white font-bold tracking-widest uppercase transition-all duration-300 rounded-lg backdrop-blur-sm flex items-center justify-center gap-2 hover:scale-105"
          >
            <Icons.Eye size={20} />
            <span>Spectate</span>
          </button>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 animate-bounce opacity-30 mix-blend-screen">
          <Icons.ChevronDown size={32} />
        </div>
      </section>

      {/* --- LIVE STATS TICKER --- */}
      <div className="w-full bg-[#14F195] text-black overflow-hidden py-3 font-mono font-bold uppercase text-xs md:text-sm tracking-widest z-20 relative border-y-4 border-black">
        <div className="whitespace-nowrap animate-[scroll_20s_linear_infinite] flex gap-12">
           {[...Array(5)].map((_, i) => (
             <React.Fragment key={i}>
                <span className="flex items-center gap-3"><Icons.Activity size={16}/> LIVE POT: 452.5 SOL</span>
                <span className="flex items-center gap-3"><Icons.Skull size={16}/> RECENT KILL: USER 8x...3f4A</span>
                <span className="flex items-center gap-3"><Icons.Users size={16}/> ACTIVE PLAYERS: 1,204</span>
                <span className="text-black/30 text-xl mx-4">///</span>
             </React.Fragment>
           ))}
        </div>
      </div>

      {/* --- HOW IT WORKS --- */}
      <section id="about" className="py-32 px-6 relative z-10 border-t border-white/5 bg-black/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20 text-center md:text-left">
             <h2 className="text-xs text-[#9945FF] font-mono uppercase tracking-[0.3em] mb-4 flex items-center gap-2 justify-center md:justify-start">
               <span className="w-8 h-px bg-[#9945FF]"></span> The Rules <span className="w-8 h-px bg-[#9945FF]"></span>
             </h2>
             <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tight">Survival of the <span className="text-white/30">Liest</span></h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
             {[
               { icon: Icons.Coins, color: 'text-yellow-500', title: "1. The Buy In", desc: "Stake real SOL to enter the lobby. The pot grows with every player. Winner takes all." },
               { icon: Icons.Mic, color: 'text-[#9945FF]', title: "2. The Deception", desc: "You cannot see your own card suit. Use Proximity Voice to trade information. Or lie." },
               { icon: Icons.Lock, color: 'text-red-500', title: "3. The Jail", desc: "Voice cuts. You must vote on your own suit. Guess wrong, and your stake is liquidated." }
             ].map((item, idx) => (
               <div key={idx} className="group p-10 border border-white/10 rounded-3xl bg-white/[0.02] hover:bg-white/[0.05] transition-all hover:-translate-y-2 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 p-32 bg-${item.color.split('-')[1]}-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-${item.color.split('-')[1]}-500/10 transition-colors`}></div>
                  <div className={`w-16 h-16 bg-black rounded-2xl border border-white/10 flex items-center justify-center mb-8 ${item.color} group-hover:scale-110 transition-transform duration-300 shadow-2xl`}>
                    <item.icon size={32} />
                  </div>
                  <h4 className="text-2xl font-bold mb-4 font-mono uppercase">{item.title}</h4>
                  <p className="text-gray-400 leading-relaxed text-lg">{item.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* --- FEATURES --- */}
      <section id="features" className="py-32 px-6 relative z-10 bg-gradient-to-b from-[#0a0a0a] to-black">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-20 items-center">
            <div className="w-full md:w-1/2">
               <div className="sticky top-32">
                  <h2 className="text-xs text-[#14F195] font-mono uppercase tracking-[0.3em] mb-4">System Core</h2>
                  <h3 className="text-5xl md:text-6xl font-black uppercase mb-10 leading-[0.9]">Built for <br/>Trustless Chaos.</h3>
                  <div className="space-y-4">
                     {[
                       { label: "Solana Mainnet", text: "Instant settlements. Zero downtime.", icon: Icons.Zap },
                       { label: "P2P WebRTC", text: "Encrypted low-latency video feeds.", icon: Icons.Globe },
                       { label: "Gemini AI 2.5", text: "Dynamic narration and bot psychology.", icon: Icons.Cpu },
                     ].map((f, i) => (
                       <div key={i} className="flex items-start gap-6 p-6 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group cursor-default">
                          <div className="mt-1 p-2 rounded-lg bg-white/5 text-gray-400 group-hover:text-[#14F195] group-hover:bg-[#14F195]/10 transition-colors">
                            <f.icon />
                          </div>
                          <div>
                             <h4 className="font-bold text-xl text-white mb-2 group-hover:text-[#14F195] transition-colors">{f.label}</h4>
                             <p className="text-sm text-gray-500 font-mono leading-relaxed">{f.text}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
            
            <div className="w-full md:w-1/2 grid grid-cols-2 gap-4">
               {/* Decorative Grid of Cards */}
               <div className="col-span-2 bg-[#1a1a1a] rounded-3xl p-8 border border-white/10 aspect-video flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                  <div className="absolute inset-0 bg-red-900/10 group-hover:bg-red-900/20 transition-colors"></div>
                  <Icons.ShieldAlert size={80} className="text-red-500/80 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
                  <div className="absolute bottom-6 left-6 font-mono text-xs text-red-500 bg-red-950/80 px-3 py-1.5 rounded border border-red-500/20">ANTI-CHEAT ACTIVE</div>
               </div>
               <div className="bg-[#111] rounded-3xl p-8 border border-white/10 aspect-square flex flex-col justify-between group hover:border-[#9945FF]/50 transition-colors relative overflow-hidden">
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#9945FF]/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Icons.Wallet className="text-gray-600 group-hover:text-[#9945FF] transition-colors relative z-10" size={40} />
                  <div className="relative z-10">
                    <span className="text-5xl font-mono font-bold block mb-1">2.4s</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Avg Payout Time</span>
                  </div>
               </div>
               <div className="bg-[#111] rounded-3xl p-8 border border-white/10 aspect-square flex flex-col justify-between group hover:border-[#14F195]/50 transition-colors relative overflow-hidden">
                   <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-[#14F195]/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Icons.Users className="text-gray-600 group-hover:text-[#14F195] transition-colors relative z-10" size={40} />
                  <div className="relative z-10">
                    <span className="text-5xl font-mono font-bold block mb-1">10k+</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Daily Users</span>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- LORE --- */}
      <section id="lore" className="py-40 px-6 relative z-10 text-center">
         <div className="absolute inset-0 bg-gradient-to-t from-red-900/10 to-transparent z-0"></div>
         <div className="relative z-10 max-w-4xl mx-auto">
            <Icons.Eye size={64} className="mx-auto text-red-600 mb-8 animate-pulse drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
            <h2 className="text-4xl md:text-7xl font-black uppercase mb-8 tracking-tighter">"The Jack is Watching"</h2>
            <p className="text-xl md:text-3xl text-gray-400 font-light leading-relaxed mb-12">
               In the Borderland, your wallet is your life. The Jack is an algorithm designed to separate you from your liquidity. <br/>
               <strong className="text-white font-bold">Will you band together with the Citizens, or sell them out for the Grand Pot?</strong>
            </p>
            <button className="group text-[#9945FF] uppercase font-bold tracking-[0.2em] text-sm hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto">
               Read the Whitepaper 
               <Icons.ChevronDown className="-rotate-90 group-hover:translate-x-1 transition-transform" size={14} />
            </button>
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-16 px-6 border-t border-white/10 bg-black relative z-10">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity">
               <div className="w-8 h-8 bg-white rounded flex items-center justify-center font-black text-black text-xs">J</div>
               <span className="font-bold tracking-widest text-xs">BORDERLAND_PROTOCOL_V1</span>
            </div>
            
            <div className="flex gap-8 text-gray-500">
               <Icons.Twitter size={24} className="hover:text-[#1DA1F2] cursor-pointer transition-colors hover:scale-110" />
               <Icons.Github size={24} className="hover:text-white cursor-pointer transition-colors hover:scale-110" />
               <Icons.HelpCircle size={24} className="hover:text-[#14F195] cursor-pointer transition-colors hover:scale-110" />
            </div>

            <div className="text-xs text-gray-600 font-mono text-right">
               © 2025 ALLIES OF BORDERLAND. <br className="md:hidden"/> RUNNING ON SOLANA.
            </div>
         </div>
      </footer>

      {/* Animation Styles */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-12deg); }
          50% { transform: translateY(-20px) rotate(-10deg); }
        }
        .will-change-transform {
           will-change: transform;
        }
        .animate-pulse-slow {
           animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingView;