import React, { useEffect, useState } from 'react';
import LobbyView from '../components/LobbyView';
import { SolanaProfile } from '../services/solana';
import { Player } from '../types';
import ArenaDirectory from '../components/ArenaDirectory';
import { ArenaRecord, subscribeToArenas } from '../services/arenaRegistry';
import { firebaseEnabled } from '../services/firebase';

interface ArenaPageProps {
  solanaProfile: SolanaProfile | null;
  roomId: string;
  inputRoomId: string;
  setInputRoomId: (val: string) => void;
  players: Player[];
  localPlayer?: Player;
  onStartSinglePlayer: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (spectator: boolean, targetRoomId?: string) => void;
  onStartMultiplayerGame: () => void;
}

const ArenaPage: React.FC<ArenaPageProps> = (props) => {
  const [waitingArenas, setWaitingArenas] = useState<ArenaRecord[]>([]);
  const [activeArenas, setActiveArenas] = useState<ArenaRecord[]>([]);

  useEffect(() => {
    if (!firebaseEnabled) return;
    const unsubWaiting = subscribeToArenas('waiting', setWaitingArenas);
    const unsubActive = subscribeToArenas('active', setActiveArenas);
    return () => {
      unsubWaiting();
      unsubActive();
    };
  }, []);

  const handleJoin = (roomId: string) => props.onJoinRoom(false, roomId);
  const handleSpectate = (roomId: string) => props.onJoinRoom(true, roomId);

  return (
    <LobbyView
      {...props}
      viewMode="selection"
      bottomSlot={
        <div className="border-t border-white/5 pt-12">
          <ArenaDirectory 
            waiting={waitingArenas}
            active={activeArenas}
            onJoin={handleJoin}
            onSpectate={handleSpectate}
            firebaseReady={firebaseEnabled}
          />
        </div>
      }
    />
  );
};

export default ArenaPage;
