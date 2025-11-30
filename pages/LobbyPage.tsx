import React, { useState } from 'react';
import LobbyView from '../components/LobbyView';
import CreateRoomModal, { RoomConfig } from '../components/CreateRoomModal';
import { SolanaProfile } from '../services/solana';
import { Player } from '../types';
import { useTokens } from '../contexts/TokenContext';

interface LobbyPageProps {
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
  onLeaveRoom: () => void;
}

const LobbyPage: React.FC<LobbyPageProps> = (props) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { tokenBalance } = useTokens();

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
        viewMode="lobby"
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

export default LobbyPage;
