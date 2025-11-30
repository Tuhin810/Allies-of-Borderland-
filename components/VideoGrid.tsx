import React, { useEffect, useRef, useState } from 'react';
import { Icons } from './Icons';
import { Player, Suit, GamePhase } from '../types';

interface VideoGridProps {
  players: Player[];
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  gamePhase: GamePhase;
}

const VideoGrid: React.FC<VideoGridProps> = ({ players, localStream, remoteStreams, gamePhase }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  
  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Filter out spectators from the grid
  const activePlayers = players.filter(p => !p.isSpectator);
  const isJail = gamePhase === GamePhase.JAIL;

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 w-full h-full p-4 overflow-y-auto transition-all duration-1000 ${isJail ? 'grayscale brightness-50' : ''}`}>
      {activePlayers.map((player) => (
        <VideoItem 
          key={player.id} 
          player={player} 
          stream={player.isLocal ? localStream : (player.peerId ? remoteStreams.get(player.peerId) : null)}
          gamePhase={gamePhase}
        />
      ))}
    </div>
  );
};

const VideoItem: React.FC<{ player: Player, stream: MediaStream | null | undefined, gamePhase: GamePhase }> = ({ player, stream, gamePhase }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Force mute during Jail phase logic is handled in App.tsx mainly, 
  // but we can visually indicate it here.
  const isJail = gamePhase === GamePhase.JAIL;

  const toggleMic = () => {
    if (stream && !isJail) {
      stream.getAudioTracks().forEach(track => track.enabled = !micOn);
      setMicOn(!micOn);
    }
  };

  const toggleCam = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => track.enabled = !camOn);
      setCamOn(!camOn);
    }
  };

  const getSuitIcon = (suit?: Suit) => {
    if (!suit) return null;
    switch(suit) {
      case Suit.HEARTS: return <Icons.Heart className="text-red-600 drop-shadow-md" size={32} fill="currentColor" />;
      case Suit.DIAMONDS: return <Icons.Diamond className="text-red-600 drop-shadow-md" size={32} fill="currentColor" />;
      case Suit.CLUBS: return <Icons.Club className="text-white drop-shadow-md" size={32} fill="currentColor" />;
      case Suit.SPADES: return <Icons.Spade className="text-white drop-shadow-md" size={32} fill="currentColor" />;
    }
  };

  return (
    <div 
      className={`relative rounded-xl overflow-hidden bg-gray-900 border-2 transition-all duration-300 ${
        !player.isAlive ? 'border-red-900 opacity-50 grayscale' : 
        player.isLocal ? 'border-indigo-500/50' : 'border-gray-700'
      }`}
      style={{ aspectRatio: '4/3' }}
    >
      {stream ? (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted={player.isLocal || isJail} // Always mute local, mute everyone in jail
            className={`w-full h-full object-cover ${!camOn ? 'hidden' : ''}`} 
          />
          {!camOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <Icons.VideoOff className="w-12 h-12 text-gray-500" />
            </div>
          )}
        </>
      ) : (
        <>
          <img 
            src={player.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.name}`} 
            alt={player.name} 
            className="w-full h-full object-cover opacity-80" 
          />
          {!player.isLocal && !player.peerId && (
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-600 rounded text-xs font-bold text-white">AI BOT</div>
          )}
        </>
      )}

      {/* SUIT DISPLAY (The Core Mechanic) */}
      {player.isAlive && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
           <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 shadow-xl transform hover:scale-110 transition-transform">
              {player.isLocal ? (
                  <span className="text-4xl font-black text-[#9945FF] animate-pulse">?</span>
              ) : (
                  getSuitIcon(player.actualSuit)
              )}
           </div>
        </div>
      )}

      {/* Local Controls */}
      {player.isLocal && (
        <div className="absolute bottom-2 left-2 flex gap-2 z-20">
          <button onClick={toggleMic} disabled={isJail} className={`p-1.5 rounded-full text-white ${isJail ? 'bg-red-500/20 cursor-not-allowed' : 'bg-black/50 hover:bg-black/70'}`}>
            {micOn && !isJail ? <Icons.Mic size={16} /> : <Icons.MicOff size={16} className="text-red-500" />}
          </button>
          <button onClick={toggleCam} className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white">
            {camOn ? <Icons.Video size={16} /> : <Icons.VideoOff size={16} className="text-red-500" />}
          </button>
        </div>
      )}

      {/* Jail Indicator */}
      {isJail && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/40">
              <Icons.ShieldAlert className="w-12 h-12 text-red-500 animate-pulse opacity-50" />
          </div>
      )}

      {/* Player Status Overlay */}
      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-1">
               <p className="text-sm font-bold text-white leading-none">{player.name}</p>
               {player.isHost && <Icons.Trophy size={10} className="text-yellow-500"/>}
            </div>
            <p className="text-xs text-gray-400 font-mono mt-1">{player.solanaAddress?.slice(0, 6)}...</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
              <Icons.Activity size={12} className={player.isAlive ? "text-green-500" : "text-red-600"} />
              <span className={`text-xs font-bold ${player.isAlive ? "text-green-400" : "text-red-600"}`}>
                {player.isAlive ? `${player.hp} HP` : 'DEAD'}
              </span>
            </div>
            {player.guessedSuit && player.isAlive && gamePhase === GamePhase.JAIL && (
                <span className="text-xs text-yellow-500 font-mono mt-1">LOCKED IN</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Elimination Overlay */}
      {!player.isAlive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30 pointer-events-none">
            <div className="flex flex-col items-center">
                <Icons.Skull className="w-12 h-12 text-red-600 mb-2" />
                <span className="text-red-600 font-black uppercase tracking-widest text-xl">ELIMINATED</span>
                <span className="text-gray-500 text-xs mt-1">
                    was {player.actualSuit}
                </span>
            </div>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;