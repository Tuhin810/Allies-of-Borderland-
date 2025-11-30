import React, { useEffect, useState } from 'react';
import LobbyView from '../components/LobbyView';
import { SolanaProfile } from '../services/solana';
import { Player } from '../types';
import ArenaDirectory from '../components/ArenaDirectory';
import { ArenaRecord, subscribeToArenas } from '../services/arenaRegistry';
import { firebaseEnabled } from '../services/firebase';
import CreateRoomModal, { RoomConfig } from '../components/CreateRoomModal';
import { useTokens } from '../contexts/TokenContext';

interface ArenaPageProps {
  solanaProfile: SolanaProfile | null;
  roomId: string;
  inputRoomId: string;
  setInputRoomId: (val: string) => void;
  players: Player[];
  localPlayer?: Player;
  onStartSinglePlayer: () => void;
  onCreateRoom: (config: RoomConfig) => void;
  onJoinRoom: (spectator: boolean, targetRoomId?: string) => void;
  onStartMultiplayerGame: () => void;
}

const ArenaPage: React.FC<ArenaPageProps> = (props) => {
  const [waitingArenas, setWaitingArenas] = useState<ArenaRecord[]>([]);
  const [activeArenas, setActiveArenas] = useState<ArenaRecord[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { tokenBalance } = useTokens();

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

  const handleCreateClick = () => {
    setShowCreateModal(true);
  };

  const handleConfirmCreate = (config: RoomConfig) => {
    props.onCreateRoom(config);
    setShowCreateModal(false);
  };

  return (
    <>
      <LobbyView
        {...props}
        onCreateRoom={handleCreateClick}
        viewMode="selection"
        bottomSlot={
          <div className="border-t border-white/5 ">
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
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleConfirmCreate}
        balance={tokenBalance}
      />
    </>
  );
};

export default ArenaPage;
