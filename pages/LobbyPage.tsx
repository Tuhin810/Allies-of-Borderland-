import React from 'react';
import LobbyView from '../components/LobbyView';
import { SolanaProfile } from '../services/solana';
import { Player } from '../types';

interface LobbyPageProps {
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
  onLeaveRoom: () => void;
}

const LobbyPage: React.FC<LobbyPageProps> = (props) => {
  return <LobbyView {...props} viewMode="lobby" />;
};

export default LobbyPage;
