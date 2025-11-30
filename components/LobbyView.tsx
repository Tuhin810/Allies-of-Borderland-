
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { Player } from '../types';
import { SolanaProfile } from '../services/solana';

interface LobbyViewProps {
  solanaProfile: SolanaProfile | null;
  roomId: string;
  inputRoomId: string;
  setInputRoomId: (val: string) => void;
  players: Player[];
  onStartSinglePlayer: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (spectator: boolean) => void;
  onStartMultiplayerGame: () => void;
}

const LobbyView: React.FC<LobbyViewProps> = ({
  solanaProfile,
  roomId,
  inputRoomId,
  setInputRoomId,
  players,
  onStartSinglePlayer,
  onCreateRoom,
  onJoinRoom,
  onStartMultiplayerGame
}) => {
  const [hoveredMode, setHoveredMode] = useState<'solo' | 'multi' | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Mouse Parallax Effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // System Logs Simulation
  useEffect(() => {
    if (roomId) {
      setLogs(prev => [...prev, `> Secure Channel Established: ${roomId}`]);
      setLogs(prev => [...prev, `> Listening for peers on port 443...`]);
    }
  }, [roomId]);

  useEffect(() => {
    if (players.length > 0) {
      const lastPlayer = players[players.length - 1];
      setLogs(prev => [...prev, `> Detected entity: ${lastPlayer.name} [${lastPlayer.id.slice(0,6)}]`]);
      setLogs(prev => [...prev, `> Handshake successful. Ping: ${Math.floor(Math.random() * 50) + 10}ms`]);
    }
  }, [players.length]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setLogs(prev => [...prev, `> Room ID copied to clipboard.`]);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = () => {
    const inviteLink = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    setLogs(prev => [...prev, `> Invite Link generated and copied.`]);
    setTimeout(() => setInviteCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20 px-6 relative overflow-hidden font-sans flex flex-col items-center justify-center">
      
      {/* --- Background FX --- */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1a103c_0%,_#000000_80%)] z-0 pointer-events-none"></div>
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none"></div>
      
      {/* 3D Grid Floor with Parallax */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-[60vh] bg-[linear-gradient(to_bottom,transparent_0%,#000_100%),linear-gradient(rgba(153,69,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(153,69,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] origin-bottom opacity-30 z-0 pointer-events-none transition-transform duration-100 ease-out"
        style={{ 
          transform: `perspective(500px) rotateX(60deg) translateX(${mousePos.x * 20}px) translateY(${mousePos.y * 10}px)` 
        }}
      ></div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 w-full max-w-6xl animate-in fade-in zoom-in duration-500">
        
        {/* Header */}
        <div className="mb-12 text-center" style={{ transform: `translate(${mousePos.x * -10}px, ${mousePos.y * -10}px)` }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/10 text-xs font-mono uppercase tracking-widest text-gray-400 mb-4 hover:bg-white/10 transition-colors cursor-help" title="System Status: Operational">
            <div className="w-2 h-2 bg-[#14F195] rounded-full animate-pulse"></div>
            System Online
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 drop-shadow-2xl">
            Select <span className="text-[#9945FF]">Protocol</span>
          </h1>
        </div>

        {!roomId ? (
          <div className="grid md:grid-cols-2 gap-8 w-full">
            
            {/* SOLO MODE CARD */}
            <div 
              onMouseEnter={() => setHoveredMode('solo')}
              onMouseLeave={() => setHoveredMode(null)}
              className="group relative bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 overflow-hidden transition-all duration-500 hover:border-[#14F195]/50 hover:shadow-[0_0_50px_rgba(20,241,149,0.1)] hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#14F195]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:bg-[#14F195]/20 group-hover:text-[#14F195] transition-colors shadow-lg">
                      <Icons.Cpu size={32} />
                    </div>
                    <div className="text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <Icons.WifiOff size={12} />
                      OFFLINE SIMULATION
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold uppercase mb-2 group-hover:text-[#14F195] transition-colors">Training Ground</h3>
                  <p className="text-gray-400 leading-relaxed mb-8 group-hover:text-gray-300 transition-colors">
                    Face off against Gemini AI-powered bots. Perfect your lying skills before risking real liquidity.
                  </p>
                  
                  {/* Fake stats */}
                  <div className="space-y-3 font-mono text-xs text-gray-500 mb-8 p-4 bg-black/40 rounded-lg border border-white/5">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span>BOT_DIFFICULTY</span>
                      <span className="text-[#14F195]">ADAPTIVE</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span>RISK_LEVEL</span>
                      <span className="text-white">ZERO</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={onStartSinglePlayer}
                  className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest rounded-lg hover:bg-[#14F195] transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-95 duration-200 shadow-xl"
                >
                  <Icons.Play size={18} /> Initiate Solo
                </button>
              </div>
            </div>

            {/* MULTIPLAYER CARD */}
            <div 
              onMouseEnter={() => setHoveredMode('multi')}
              onMouseLeave={() => setHoveredMode(null)}
              className="group relative bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 overflow-hidden transition-all duration-500 hover:border-[#9945FF]/50 hover:shadow-[0_0_50px_rgba(153,69,255,0.15)] hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#9945FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                   <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:bg-[#9945FF]/20 group-hover:text-[#9945FF] transition-colors shadow-lg">
                      <Icons.Globe size={32} />
                    </div>
                    <div className="text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]"></span>
                       LIVE MAINNET
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold uppercase mb-2 group-hover:text-[#9945FF] transition-colors">The Arena</h3>
                  <p className="text-gray-400 leading-relaxed mb-8 group-hover:text-gray-300 transition-colors">
                    P2P encrypted video lobbies. High-stakes betting. The Jack is watching.
                  </p>

                   {/* Join Inputs */}
                   <div className="bg-black/40 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm group-hover:border-[#9945FF]/30 transition-colors">
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 block flex items-center justify-between">
                        <span>Join Existing Cell</span>
                        <Icons.Signal size={12} className={inputRoomId ? "text-green-500" : "text-gray-700"}/>
                      </label>
                      <div className="flex gap-2">
                         <div className="relative flex-1">
                            <Icons.Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                            <input 
                              type="text" 
                              value={inputRoomId}
                              onChange={(e) => setInputRoomId(e.target.value)}
                              placeholder="ENTER ROOM ID"
                              className="w-full bg-[#111] border border-white/10 rounded px-3 pl-8 py-2 text-sm font-mono text-white focus:border-[#9945FF] focus:bg-white/5 outline-none transition-all placeholder:text-gray-700"
                            />
                         </div>
                         <button 
                            onClick={() => onJoinRoom(false)}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-xs font-bold uppercase transition-colors hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                         >
                            Join
                         </button>
                          <button 
                            onClick={() => onJoinRoom(true)}
                            className="bg-transparent border border-white/10 hover:border-white/30 text-gray-400 hover:text-white px-3 py-2 rounded transition-colors"
                            title="Spectate"
                         >
                            <Icons.Eye size={16} />
                         </button>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={onCreateRoom}
                  className="w-full py-4 bg-[#9945FF] text-white font-bold uppercase tracking-widest rounded-lg hover:bg-[#863ee3] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(153,69,255,0.3)] hover:shadow-[0_0_40px_rgba(153,69,255,0.5)] active:scale-95 duration-200"
                >
                  <Icons.PlusSquare size={18} /> Create New Room
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* --- ROOM DASHBOARD --- */
          <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6 h-[70vh]">
             
             {/* LEFT: STATUS & LOGS */}
             <div className="w-full md:w-1/3 flex flex-col gap-6">
                
                {/* Status Card */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-20 bg-[#14F195]/5 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-[#14F195]/10 rounded-xl flex items-center justify-center border border-[#14F195]/20 animate-pulse">
                                <Icons.Server className="text-[#14F195]" size={24} />
                            </div>
                            <div>
                                <div className="text-[#14F195] font-mono text-xs uppercase tracking-widest font-bold mb-1">Uplink Established</div>
                                <h2 className="text-xl font-bold text-white">Lobby Control</h2>
                            </div>
                        </div>
                        
                        {/* Room ID Widget */}
                        <div className="flex gap-2">
                           <div 
                              onClick={handleCopy}
                              className={`flex-1 group cursor-pointer bg-[#111] border ${copied ? 'border-[#14F195]' : 'border-white/10'} rounded-xl p-3 flex items-center gap-3 hover:border-[#9945FF]/50 transition-all active:scale-95`}
                           >
                              <div className={`p-2 rounded-lg transition-colors ${copied ? 'bg-[#14F195] text-black' : 'bg-[#222] text-gray-400 group-hover:bg-[#9945FF] group-hover:text-white'}`}>
                                  {copied ? <Icons.CheckCircle size={16} /> : <Icons.Copy size={16} />}
                              </div>
                              <div className="overflow-hidden">
                                  <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Room ID</div>
                                  <div className="text-xs font-mono text-white tracking-wider truncate">{roomId.slice(0, 12)}...</div>
                              </div>
                           </div>

                           {/* Invite Button */}
                           <button 
                              onClick={handleInvite}
                              className={`bg-[#111] border ${inviteCopied ? 'border-[#14F195]' : 'border-white/10'} rounded-xl p-3 flex flex-col items-center justify-center w-20 hover:border-[#9945FF]/50 transition-all active:scale-95`}
                           >
                               <Icons.Share2 size={18} className={inviteCopied ? 'text-[#14F195]' : 'text-gray-400'} />
                               <span className="text-[9px] mt-1 text-gray-500 uppercase font-bold">{inviteCopied ? 'Sent' : 'Invite'}</span>
                           </button>
                        </div>

                    </div>
                </div>

                {/* System Logs (Terminal) */}
                <div className="flex-1 bg-[#050505] border border-white/10 rounded-2xl p-4 font-mono text-xs text-gray-400 overflow-hidden flex flex-col shadow-inner bg-black/50">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5 text-gray-500 uppercase tracking-wider">
                        <Icons.Terminal size={12} /> System Logs
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                        {logs.map((log, i) => (
                            <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300">
                                <span className="text-[#9945FF] mr-2">➜</span>{log}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>

             </div>

             {/* RIGHT: PLAYER GRID & START */}
             <div className="flex-1 bg-[#050505] border border-white/10 p-8 rounded-2xl relative overflow-hidden flex flex-col">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#9945FF] to-transparent opacity-50"></div>
                
                <div className="flex justify-between items-end mb-8">
                     <div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Active Roster</h3>
                        <p className="text-sm text-gray-500">Waiting for connections...</p>
                     </div>
                     <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Capacity</div>
                        <div className="text-2xl font-mono text-white font-bold">{players.length} <span className="text-gray-600">/ 10</span></div>
                     </div>
                </div>

                {/* Player Grid */}
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 overflow-y-auto">
                   {/* Create 10 slots */}
                   {[...Array(8)].map((_, i) => {
                      const player = players[i];
                      return (
                        <div key={i} className={`rounded-xl border transition-all duration-300 ${player ? 'bg-white/5 border-white/20 shadow-lg' : 'bg-transparent border-white/5 border-dashed opacity-50'} flex flex-col items-center justify-center relative group min-h-[100px]`}>
                           {player ? (
                              <>
                                 <div className="relative">
                                    <img src={player.avatar} className="w-10 h-10 rounded-full mb-3 bg-gray-800 border border-white/10 group-hover:scale-110 transition-transform" />
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#14F195] border-2 border-[#050505] animate-pulse"></div>
                                 </div>
                                 <span className="text-xs font-bold text-white truncate max-w-[90%] px-2">{player.name}</span>
                                 <div className="mt-2 flex gap-0.5 items-end h-2">
                                     <div className="w-1 bg-[#14F195] h-full animate-[pulse_1s_ease-in-out_infinite]"></div>
                                     <div className="w-1 bg-[#14F195] h-3/4 animate-[pulse_1.2s_ease-in-out_infinite]"></div>
                                     <div className="w-1 bg-[#14F195] h-1/2 animate-[pulse_1.5s_ease-in-out_infinite]"></div>
                                 </div>
                                 {player.isSpectator && <div className="absolute top-2 left-2 text-[8px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1 rounded uppercase font-bold">SPEC</div>}
                              </>
                           ) : (
                              <div className="flex flex-col items-center opacity-30 group-hover:opacity-60 transition-opacity">
                                  <Icons.UserPlus size={16} className="mb-2" />
                                  <span className="text-[10px] font-mono uppercase">Open Slot</span>
                              </div>
                           )}
                        </div>
                      );
                   })}
                </div>

                {/* Actions */}
                <button 
                  onClick={onStartMultiplayerGame}
                  className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-lg rounded-xl hover:bg-[#14F195] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(20,241,149,0.4)] relative overflow-hidden group active:scale-[0.98]"
                >
                   <span className="relative z-10 flex items-center justify-center gap-3">
                      <Icons.Zap className="group-hover:animate-bounce" /> Initiate Game Sequence
                   </span>
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                </button>

             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LobbyView;
