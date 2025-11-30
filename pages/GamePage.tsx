import React from 'react';
import { Icons } from '../components/Icons';
import VideoGrid from '../components/VideoGrid';
import GameControls from '../components/GameControls';
import Chat from '../components/Chat';
import { GameState, Player, GamePhase, ChatMessage, Role } from '../types';

interface GamePageProps {
  gameState: GameState;
  players: Player[];
  localPlayer: Player | undefined;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  onAction: (type: 'GUESS_SUIT' | 'BRIBE', value: any) => void;
}

const GamePage: React.FC<GamePageProps> = ({
  gameState,
  players,
  localPlayer,
  chatMessages,
  onSendMessage,
  localStream,
  remoteStreams,
  onAction
}) => (
  <div className="h-screen bg-black flex flex-col overflow-hidden relative font-sans">
    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-black to-black"></div>

    {localPlayer?.role === Role.JACK && localPlayer.isAlive && (
       <div className="absolute top-0 inset-x-0 bg-red-900/80 text-white text-center text-xs py-1 font-bold z-50 animate-pulse">
          YOU ARE THE JACK. ELIMINATE THE CITIZENS.
       </div>
    )}

    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50 backdrop-blur-md z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
           <Icons.Trophy className="text-[#9945FF]" size={20} />
           <span className="font-mono text-xl font-bold text-[#9945FF]">{gameState.pot.toFixed(2)} SOL</span>
        </div>
        <div className="h-6 w-px bg-white/20"></div>
        <div className="text-sm text-gray-400 font-mono">
           ROUND <span className="text-white text-lg font-bold">{gameState.round}</span>
        </div>
        {localPlayer?.isSpectator && (
           <span className="px-2 py-1 bg-blue-900/50 text-blue-400 text-xs font-bold rounded uppercase border border-blue-800 ml-4 flex items-center gap-1">
              <Icons.Eye size={12} /> Spectator Mode
           </span>
        )}
      </div>
      <div className="flex items-center gap-2">
         <button onClick={() => window.location.reload()} className="text-gray-500 hover:text-white text-sm uppercase transition-colors">Exit</button>
      </div>
    </div>

    <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
      <div className="w-full md:w-1/4 flex flex-col border-r border-white/10 bg-black/40 hidden md:flex">
        <div className="h-1/2 flex flex-col border-b border-white/10 p-4 overflow-y-auto custom-scrollbar">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4 font-bold sticky top-0 bg-black/40 backdrop-blur w-full py-1">Narrative Log</h3>
          <div className="space-y-4">
            {gameState.history.map((msg, idx) => (
              <div key={idx} className={`p-3 rounded border ${idx === 0 ? 'border-indigo-900 bg-indigo-900/10' : 'border-gray-800 bg-gray-900/30'}`}>
                <p className="text-sm text-gray-300 font-mono leading-relaxed">{msg}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="h-1/2 flex-1 min-h-0">
           <Chat 
              messages={chatMessages} 
              onSendMessage={onSendMessage}
              disabled={gameState.phase === GamePhase.JAIL} 
           />
        </div>
      </div>

      <div className="flex-1 relative flex flex-col">
        <div className="flex-1 p-2 md:p-4 overflow-hidden">
           <VideoGrid 
              players={players} 
              localStream={localStream}
              remoteStreams={remoteStreams}
              gamePhase={gameState.phase}
           />
        </div>

        {gameState.phase === GamePhase.JAIL && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
               <Icons.ShieldAlert className="w-96 h-96 text-red-900 opacity-20 animate-pulse" />
           </div>
        )}

        {gameState.phase === GamePhase.GAME_OVER && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-md">
              <h2 className="text-6xl text-white font-black mb-4 uppercase tracking-tighter animate-in zoom-in duration-500">GAME OVER</h2>
              <p className="text-xl text-red-200 mb-8 max-w-md text-center">{gameState.narrative}</p>
              {localPlayer?.isAlive && !localPlayer?.isSpectator ? (
                 <div className="text-center animate-in slide-in-from-bottom duration-700">
                   <Icons.Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                   <p className="text-2xl text-yellow-400 font-bold mb-6">YOU SURVIVED</p>
                   <p className="text-sm text-yellow-600/80 mb-8 font-mono">Payout: {gameState.pot.toFixed(2)} SOL</p>
                 </div>
              ) : (
                 <div className="text-center animate-in slide-in-from-bottom duration-700">
                   <Icons.Skull className="w-20 h-20 text-gray-500 mx-auto mb-4" />
                   <p className="text-2xl text-gray-400 font-bold mb-6">
                      ELIMINATED
                   </p>
                 </div>
              )}
              <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white text-black font-bold uppercase rounded hover:bg-gray-200">
                 Return to Lobby
              </button>
          </div>
        )}

        <div className="p-4 relative">
           {!localPlayer?.isSpectator ? (
              <GameControls 
                  phase={gameState.phase}
                  guessedSuit={localPlayer?.guessedSuit}
                  onGuessSuit={(s) => onAction('GUESS_SUIT', s)}
                  timeLeft={gameState.timer}
                  walletBalance={localPlayer?.balance || 0}
                  players={players}
                  onBribe={(target, amt) => onAction('BRIBE', { target, amt })}
                  isWeb3={localPlayer?.isWeb3}
                  localPlayerId={localPlayer?.id}
              />
           ) : (
              <div className="w-full glass-panel rounded-xl p-6 text-center border border-blue-500/20 bg-blue-950/20">
                  <p className="text-blue-300 font-mono animate-pulse">SPECTATING - ALL CARDS REVEALED</p>
              </div>
           )}
        </div>
      </div>
    </div>
  </div>
);

export default GamePage;
