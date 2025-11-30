
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { TokenProvider, useTokens } from './contexts/TokenContext';
import Navbar from './components/Navbar';
import { GameState, Player, GamePhase, Suit, PlayerAction, ChatMessage, Role } from './types';
import { generateRoundNarrative, generateGameIntro } from './services/geminiService';
import { p2pService } from './services/p2p';
import { registerArena, setArenaStatus, updateArena, getArena } from './services/arenaRegistry';
import LandingPage from './pages/LandingPage';
import ArenaPage from './pages/ArenaPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import LoadingPage from './pages/LoadingPage';
import FeaturesPage from './pages/FeaturesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import FAQPage from './pages/FAQPage';
import { useAuth } from './contexts/AuthContext';
import ProfilePage from './pages/ProfilePage';
import StakingModal from './components/StakingModal';
import { distributeRCWinnings, calculateRCPot } from './services/stakingService';
import { ECONOMY } from './constants/economy';

// Constants
const INITIAL_HP = 100;
const INITIAL_BALANCE = 5.0; // Mock 5 SOL for non-web3 mode
const DISCUSSION_TIME = 240; // 4 minutes
const JAIL_TIME = 60; // 1 minute
const BUY_IN_AMOUNT = 0.1; // SOL

// Mock Avatars
const AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Kaito",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Asuna",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Daiki"
];

// Initial AI Players (Practice Mode)
const AI_PLAYERS: Player[] = [
  { id: 'p2', name: 'Kaito (AI)', avatar: AVATARS[0], hp: INITIAL_HP, isAlive: true, isLocal: false, betAmount: 0, balance: 1.5, solanaAddress: '8x...1B34', reputation: 50 },
  { id: 'p3', name: 'Asuna (AI)', avatar: AVATARS[1], hp: INITIAL_HP, isAlive: true, isLocal: false, betAmount: 0, balance: 0.8, solanaAddress: '9x...2C45', reputation: 50 },
  { id: 'p4', name: 'Daiki (AI)', avatar: AVATARS[2], hp: INITIAL_HP, isAlive: true, isLocal: false, betAmount: 0, balance: 2.1, solanaAddress: 'Ax...3D56', reputation: 50 },
];

const createInitialGameState = (): GameState => ({
  phase: GamePhase.LOBBY,
  round: 0,
  timer: 0,
  discussionTime: DISCUSSION_TIME, // Default
  pot: 0,
  narrative: "Waiting for players...",
  history: []
});



const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
  const hideNavbarRoutes = new Set(['/loading', '/game']);
  const showNavbar = !hideNavbarRoutes.has(normalizedPath);

  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const { profile: userProfile, solanaProfile, loginWithWallet, loginWithGoogle, needsProfileSetup } = useAuth();
  const { tokenBalance, spendTokens, addTokens } = useTokens();

  // Staking state
  const [showStakingModal, setShowStakingModal] = useState(false);
  const [pendingGameStart, setPendingGameStart] = useState<'single' | 'multi' | null>(null);

  // Game State
  const [players, setPlayers] = useState<Player[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState());

  const localPlayer = players.find(p => p.isLocal);

  // --- Helper: Mesh Network Logic ---
  const syncNetworkPlayers = (networkPlayers: Player[]) => {
    const mergedPlayers = networkPlayers.map(p => ({
      ...p,
      isLocal: p.peerId === p2pService.myPeerId
    }));
    setPlayers(mergedPlayers);

    const myId = p2pService.myPeerId;
    if (!myId) return;

    mergedPlayers.forEach(p => {
      if (p.peerId && p.peerId !== myId) {
        if (!p2pService.hasMediaConnection(p.peerId)) {
          if (myId > p.peerId) {
            p2pService.callPeer(p.peerId);
          }
        }
      }
    });
  };

  // Ref to track bot actions per phase
  const processedRoundPhase = useRef<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setInputRoomId(roomParam);
    }
  }, []);

  // useEffect(() => {
  //   if (needsProfileSetup && normalizedPath !== '/profile') {
  //     navigate('/profile?setup=1');
  //   }
  // }, [needsProfileSetup, navigate, normalizedPath]);

  const handleGoogleLogin = async () => {
    try {
      const { needsProfile } = await loginWithGoogle();
      if (needsProfile) {
        navigate('/profile?setup=google');
      } else {
        navigate('/arena');
      }
    } catch (e: any) {
      console.error('Google login failed', e);
      alert(e?.message ?? 'Google login failed.');
    }
  };

  // Bot Behavior Effect
  useEffect(() => {
    const phaseKey = `${gameState.round}-${gameState.phase}`;
    const amIHost = p2pService.isHost || !isMultiplayer;

    if (amIHost && gameState.phase === GamePhase.JAIL && processedRoundPhase.current !== phaseKey) {
      processedRoundPhase.current = phaseKey;

      const bots = players.filter(p => !p.isLocal && !p.peerId && p.isAlive);

      bots.forEach(bot => {
        const maxDelay = Math.max(2, JAIL_TIME - 5);
        const delay = Math.floor(Math.random() * maxDelay * 1000) + 2000;

        const timerId = window.setTimeout(() => {
          const suits = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
          const randomSuit = suits[Math.floor(Math.random() * suits.length)];

          setPlayers(prev => prev.map(p => {
            if (p.id === bot.id && p.isAlive && !p.guessedSuit) {
              return { ...p, guessedSuit: randomSuit };
            }
            return p;
          }));

          if (isMultiplayer && p2pService.isHost) {
            p2pService.broadcast('PLAYER_ACTION', {
              playerId: bot.id,
              type: 'GUESS_SUIT',
              value: randomSuit
            });
          }
        }, delay);
      });
    }
  }, [gameState.phase, gameState.round, isMultiplayer, players]);

  // --- Initialization ---

  const ensureLocalStream = async () => {
    if (localStream) return localStream;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn('Camera access denied or failed', err);
      throw err;
    }
  };

  const leaveRoom = useCallback((options?: { redirect?: boolean }) => {
    if (!roomId && players.length === 0) {
      return;
    }

    if (roomId && p2pService.isHost) {
      setArenaStatus(roomId, 'ended').catch((err) => console.warn('Failed to close arena on exit', err));
    }

    p2pService.disconnect();
    setPlayers([]);
    setRemoteStreams(new Map());
    setChatMessages([]);
    setRoomId('');
    setInputRoomId('');
    setIsMultiplayer(false);
    setGameState(createInitialGameState());

    if (options?.redirect !== false) {
      navigate('/arena', { replace: true });
    }
  }, [navigate, players.length, roomId]);

  // P2P Listeners
  useEffect(() => {
    const handleJoin = (newPlayer: Player) => {
      setPlayers(prev => {
        if (prev.find(p => p.id === newPlayer.id)) return prev;
        const updated = [...prev, { ...newPlayer, isLocal: false }];

        if (p2pService.isHost) {
          p2pService.broadcast('WELCOME', { players: updated, gameState });

          const sysMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'SYSTEM',
            text: `${newPlayer.name} entered the Borderland.`,
            timestamp: Date.now(),
            isSystem: true
          };
          setChatMessages(prevChat => [...prevChat, sysMsg]);
          p2pService.broadcast('CHAT', sysMsg);

          syncNetworkPlayers(updated);
        }
        return updated;
      });
    };

    const handlePlayerDisconnect = (peerId: string) => {
      if (!p2pService.isHost) {
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.delete(peerId);
          return newMap;
        });
        return;
      }

      setPlayers(prev => {
        const player = prev.find(p => p.peerId === peerId);
        if (!player) return prev;

        const updated = prev.filter(p => p.peerId !== peerId);
        p2pService.broadcast('WELCOME', { players: updated, gameState });

        const sysMsg: ChatMessage = {
          id: Date.now().toString(),
          sender: 'SYSTEM',
          text: `${player.name} was lost in the void.`,
          timestamp: Date.now(),
          isSystem: true
        };
        setChatMessages(old => [...old, sysMsg]);
        p2pService.broadcast('CHAT', sysMsg);

        return updated;
      });

      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(peerId);
        return newMap;
      });
    };

    const handleStateUpdate = (newState: GameState) => {
      setGameState(newState);
    };

    const handleWelcome = (data: { players: Player[], gameState: GameState }) => {
      setGameState(data.gameState);
      syncNetworkPlayers(data.players);
    };

    const handlePlayerAction = (action: PlayerAction) => {
      if (p2pService.isHost) {
        setPlayers(prev => prev.map(p => {
          if (p.id === action.playerId) {
            if (action.type === 'GUESS_SUIT') return { ...p, guessedSuit: action.value };
          }
          return p;
        }));
        p2pService.broadcast('PLAYER_ACTION', action);
      } else {
        setPlayers(prev => prev.map(p => {
          if (p.id === action.playerId) {
            if (action.type === 'GUESS_SUIT') return { ...p, guessedSuit: action.value };
          }
          return p;
        }));
      }
    };

    const handleStream = ({ peerId, stream }: { peerId: string, stream: MediaStream }) => {
      setRemoteStreams(prev => new Map(prev).set(peerId, stream));
    };

    const handleChat = (msg: ChatMessage) => {
      setChatMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      if (p2pService.isHost) {
        p2pService.broadcast('CHAT', msg);
      }
    };

    const handleBuyIn = (data: { playerId: string, amount: number }) => {
      if (!p2pService.isHost) return;
      setGameState(prev => ({ ...prev, pot: prev.pot + data.amount }));
      const sysMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'SYSTEM',
        text: `Player bought in with ${data.amount} SOL`,
        timestamp: Date.now(),
        isSystem: true
      };
      setChatMessages(prev => [...prev, sysMsg]);
      p2pService.broadcast('CHAT', sysMsg);
      p2pService.broadcast('STATE_UPDATE', { ...gameState, pot: gameState.pot + data.amount });
    };

    p2pService.on('JOIN', handleJoin);
    p2pService.on('STATE_UPDATE', handleStateUpdate);
    p2pService.on('WELCOME', handleWelcome);
    p2pService.on('PLAYER_ACTION', handlePlayerAction);
    p2pService.on('stream', handleStream);
    p2pService.on('CHAT', handleChat);
    p2pService.on('playerDisconnected', handlePlayerDisconnect);
    p2pService.on('BUY_IN', handleBuyIn);

    return () => {
      p2pService.off('JOIN', handleJoin);
      p2pService.off('STATE_UPDATE', handleStateUpdate);
      p2pService.off('WELCOME', handleWelcome);
      p2pService.off('PLAYER_ACTION', handlePlayerAction);
      p2pService.off('stream', handleStream);
      p2pService.off('CHAT', handleChat);
      p2pService.off('playerDisconnected', handlePlayerDisconnect);
      p2pService.off('BUY_IN', handleBuyIn);
    };
  }, [gameState.pot]);

  // Host Loop
  useEffect(() => {
    let interval: any;
    if (p2pService.isHost && (gameState.phase === GamePhase.DISCUSSION || gameState.phase === GamePhase.JAIL) && gameState.timer > 0) {
      interval = setInterval(() => {
        setGameState(prev => {
          let nextTimer = prev.timer - 1;
          let nextPhase = prev.phase;

          if (nextTimer <= 0) {
            if (prev.phase === GamePhase.DISCUSSION) {
              nextPhase = GamePhase.JAIL;
              nextTimer = JAIL_TIME;
            } else if (prev.phase === GamePhase.JAIL) {
              resolveRound();
              return prev;
            }
          }

          const next = { ...prev, timer: nextTimer, phase: nextPhase };
          p2pService.broadcast('STATE_UPDATE', next);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState.phase, gameState.timer]);

  useEffect(() => {
    if (p2pService.isHost && players.length > 0) {
      const t = setTimeout(() => {
        p2pService.broadcast('WELCOME', { players, gameState });
      }, 200);
      return () => clearTimeout(t);
    }
  }, [players]);

  useEffect(() => {
    if (!p2pService.isHost || !roomId) return;
    const activePlayers = players.filter(p => p.isAlive !== false && !p.isSpectator).length;
    updateArena(roomId, {
      playerCount: activePlayers,
      status: gameState.phase === GamePhase.LOBBY ? 'waiting' : undefined
    }).catch((err) => console.warn('Failed to sync arena roster', err));
  }, [players.length, roomId, gameState.phase]);

  useEffect(() => {
    if (!localPlayer) return;
    const inGamePhase = gameState.phase !== GamePhase.LOBBY;
    if (inGamePhase && normalizedPath !== '/game') {
      navigate('/game', { replace: true });
    } else if (!inGamePhase && normalizedPath === '/game') {
      if (roomId) {
        navigate('/lobby', { replace: true });
      } else {
        navigate('/arena', { replace: true });
      }
    }
  }, [gameState.phase, localPlayer, navigate, normalizedPath, roomId]);

  useEffect(() => {
    if (!roomId) return;
    const allowed = new Set(['/arena', '/lobby', '/game', '/loading']);
    if (!allowed.has(normalizedPath)) {
      leaveRoom({ redirect: false });
    }
  }, [normalizedPath, roomId, leaveRoom]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (roomId) {
        p2pService.disconnect();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [roomId]);

  // Auto-deduct stake on game start (Clients)
  const hasPaidRef = useRef<string | null>(null);

  useEffect(() => {
    const handleGameStart = async () => {
      // Reset payment tracking when in lobby
      if (gameState.phase === GamePhase.LOBBY) {
        hasPaidRef.current = null;
        return;
      }

      // If game started and we haven't paid yet for THIS game
      const currentGameId = gameState.gameId;
      if (gameState.phase === GamePhase.DISCUSSION && roomId && currentGameId && hasPaidRef.current !== currentGameId && !p2pService.isHost) {
        hasPaidRef.current = currentGameId;

        const arena = await getArena(roomId);
        const stakeAmount = arena?.buyIn || 0;

        if (stakeAmount > 0) {
          const success = await spendTokens(stakeAmount);
          if (!success) {
            console.error('Failed to pay entry fee!');
            // Ideally kick player or show error
          }
        }
      }
    };

    handleGameStart();
  }, [gameState.phase, roomId, gameState.gameId]);

  // --- Actions ---

  const handleConnectWallet = async () => {
    try {
      const { needsProfile } = await loginWithWallet();
      if (needsProfile) {
        navigate('/profile?setup=wallet');
      } else if (normalizedPath === '/') {
        navigate('/arena');
      }
    } catch (e: any) {
      alert('Failed to connect wallet: ' + (e?.message ?? 'Unknown error'));
    }
  };

  const initLocalPlayer = (isSpectator: boolean = false) => {
    const name = solanaProfile ? `Cit. ${solanaProfile.shortAddress}` : `Cit. ${Math.floor(Math.random() * 1000)}`;
    const avatar = solanaProfile ? `https://api.dicebear.com/7.x/bottts/svg?seed=${solanaProfile.address}` : '';
    const address = solanaProfile ? solanaProfile.address : `MockSolanaKey-${Math.random().toString(36)}`;

    return {
      id: solanaProfile?.address ?? userProfile?.id ?? `p-${Math.random().toString(36).substr(2, 9)}`,
      name,
      avatar,
      hp: INITIAL_HP,
      isAlive: true,
      isLocal: true,
      isSpectator,
      isWeb3: !!solanaProfile,
      betAmount: 0,
      balance: solanaProfile?.balance ?? userProfile?.walletBalance ?? INITIAL_BALANCE,
      solanaAddress: address,
      reputation: 100,
      role: Role.CITIZEN
    };
  };

  const createRoom = async (config: { stakeAmount: number, discussionTime: number, maxPlayers: number }) => {
    let stream: MediaStream;
    try {
      stream = await ensureLocalStream();
    } catch (err: any) {
      alert('Camera access required to play.');
      return;
    }
    navigate('/loading');
    setIsMultiplayer(true);

    // Deduct Room Creation Cost (Platform Fee)
    const creationSuccess = await spendTokens(ECONOMY.ROOM_CREATION_COST);
    if (!creationSuccess) {
      alert(`Insufficient funds to create room. Cost: ${ECONOMY.ROOM_CREATION_COST} RC`);
      navigate('/arena');
      return;
    }

    const id = await p2pService.init(true, stream);
    setRoomId(id);

    // Host pays creation cost immediately? 
    // Or just sets the stake. Let's assume creation cost is separate from stake.
    // For now, we just set the stake.

    const host = { ...initLocalPlayer(), isHost: true, peerId: id, rcStake: config.stakeAmount };
    setPlayers([host]);
    setGameState(prev => ({ ...prev, narrative: "Waiting for citizens..." }));
    registerArena({
      roomId: id,
      hostPeerId: id,
      hostName: host.name,
      status: 'waiting',
      playerCount: 1,
      capacity: config.maxPlayers,
      buyIn: config.stakeAmount, // Set the buy-in/stake amount
      discussionTime: config.discussionTime
    }).catch((err) => console.warn('Failed to register arena', err));
    navigate('/lobby');
  };

  const joinRoom = async (asSpectator: boolean = false, targetRoomId?: string) => {
    const roomToJoin = targetRoomId || inputRoomId;
    if (!roomToJoin) return;

    // Validate Balance for Players
    if (!asSpectator) {
      const arena = await getArena(roomToJoin);
      if (arena && arena.buyIn > 0) {
        if (tokenBalance < arena.buyIn) {
          alert(`Insufficient funds! This room requires ${arena.buyIn} RC to join. You have ${tokenBalance} RC.`);
          return;
        }
      }
    }

    let stream: MediaStream | null = null;
    if (!asSpectator) {
      try {
        stream = await ensureLocalStream();
      } catch (err: any) {
        alert('Camera access required to play.');
        return;
      }
    }
    navigate('/loading');
    setIsMultiplayer(true);
    const myId = await p2pService.init(false, asSpectator ? null : stream);

    setRoomId(roomToJoin);
    setInputRoomId(roomToJoin);
    const me = { ...initLocalPlayer(asSpectator), peerId: myId };
    p2pService.connectToHost(roomToJoin, me);
    navigate('/lobby');
  };

  const startSinglePlayer = () => {
    // Show staking modal before starting
    setPendingGameStart('single');
    setShowStakingModal(true);
  };

  const startMultiplayerGame = async () => {
    if (!p2pService.isHost) return;

    // Fetch arena to get buy-in amount and config
    const arena = await getArena(roomId);
    const stakeAmount = arena?.buyIn || 0;
    const discussionTime = arena?.discussionTime || DISCUSSION_TIME;

    // Deduct host's tokens
    if (stakeAmount > 0) {
      const success = await spendTokens(stakeAmount);
      if (!success) {
        alert('Failed to pay entry fee. Game cannot start.');
        return;
      }
    }

    // Update ALL players with the stake amount (since it's fixed for the room)
    const updatedPlayers = players.map(p => ({
      ...p,
      rcStake: stakeAmount
    }));
    setPlayers(updatedPlayers);

    // Start game with updated players and config
    setGameState(prev => ({ ...prev, discussionTime }));
    startNewGame(updatedPlayers, { discussionTime });

    if (roomId) {
      setArenaStatus(roomId, 'active').catch((err) => console.warn('Failed to mark arena active', err));
    }
    navigate('/game');
  };

  const handleStakeConfirm = async (stakeAmount: number) => {
    // Deduct tokens from player's balance
    const success = await spendTokens(stakeAmount);
    if (!success) {
      alert('Failed to stake tokens. Please try again.');
      return;
    }

    // Update local player with stake
    if (pendingGameStart === 'single') {
      // Single player mode
      setIsMultiplayer(false);
      const me = { ...initLocalPlayer(), rcStake: stakeAmount };
      const bots = AI_PLAYERS.map(b => ({
        ...b,
        role: Role.CITIZEN,
        actualSuit: Suit.HEARTS,
        rcStake: Math.floor(Math.random() * 30) + 20 // Bots stake 20-50 RC
      }));
      const all = [me, ...bots];
      setPlayers(all);
      startNewGame(all);
      navigate('/game');
    }

    setPendingGameStart(null);
  };

  const startNewGame = async (initializedPlayers: Player[], config?: { discussionTime?: number }) => {
    // Assign roles
    const playerCount = initializedPlayers.length;
    const jackIndex = Math.floor(Math.random() * playerCount);
    const suits = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];

    const playersWithRoles = initializedPlayers.map((p, i) => ({
      ...p,
      role: i === jackIndex ? Role.JACK : Role.CITIZEN,
      actualSuit: i === jackIndex ? Suit.SPADES : suits[Math.floor(Math.random() * suits.length)], // Jack is Spades (for now)
      hp: INITIAL_HP,
      isAlive: true,
      guessedSuit: null
    }));

    // Calculate RC pot from all players' stakes
    const rcPot = calculateRCPot(initializedPlayers);

    const discussionTime = config?.discussionTime || gameState.discussionTime || DISCUSSION_TIME;

    const intro = await generateGameIntro();
    const newState = {
      ...gameState,
      gameId: Date.now().toString(), // Generate unique game ID
      phase: GamePhase.DISCUSSION,
      round: 1,
      rcPot: rcPot, // Add RC pot to game state
      timer: discussionTime,
      discussionTime: discussionTime,
      pot: playerCount * BUY_IN_AMOUNT,
      narrative: intro,
      history: [intro]
    };

    setPlayers(playersWithRoles);
    setGameState(newState);
    if (p2pService.isHost) p2pService.broadcast('STATE_UPDATE', newState);
    if (p2pService.isHost) p2pService.broadcast('WELCOME', { players: playersWithRoles, gameState: newState });
  };

  const handleAction = async (type: 'GUESS_SUIT' | 'BRIBE', value: any) => {
    if (!localPlayer?.isAlive || localPlayer?.isSpectator) return;

    if (type === 'BRIBE') {
      const { target, amt } = value;
      alert(`Sent ${amt} SOL to ${target} (Simulated). Info request sent.`);
      return;
    }

    if (type === 'GUESS_SUIT') {
      setPlayers(prev => prev.map(p => p.isLocal ? { ...p, guessedSuit: value } : p));
      if (isMultiplayer) {
        p2pService.send({
          type: 'PLAYER_ACTION',
          payload: { playerId: localPlayer.id, type, value }
        });
      }
    }
  };

  const handleSendMessage = (text: string) => {
    if (!localPlayer) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: localPlayer.name,
      text: text,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, msg]);

    if (isMultiplayer) {
      if (p2pService.isHost) {
        p2pService.broadcast('CHAT', msg);
      } else {
        p2pService.send({ type: 'CHAT', payload: msg });
      }
    }
  };

  const resolveRound = async () => {
    setGameState(prev => ({ ...prev, phase: GamePhase.RESOLVING }));
    p2pService.broadcast('STATE_UPDATE', { ...gameState, phase: GamePhase.RESOLVING });

    const suits = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];

    let eliminatedCount = 0;
    const resolvedPlayers = players.map(p => {
      if (!p.isAlive || p.isSpectator) return p;

      let guess = p.guessedSuit;
      if (!guess && !p.isLocal) guess = suits[Math.floor(Math.random() * suits.length)];

      const survived = guess === p.actualSuit;
      if (!survived) eliminatedCount++;

      const nextSuit = suits[Math.floor(Math.random() * suits.length)];

      return {
        ...p,
        isAlive: survived,
        hp: survived ? p.hp : 0,
        actualSuit: survived ? nextSuit : p.actualSuit,
        guessedSuit: null
      };
    });

    const survivors = resolvedPlayers.filter(p => p.isAlive && !p.isSpectator);
    const jack = resolvedPlayers.find(p => p.role === Role.JACK);
    const jackAlive = jack?.isAlive;

    let nextPhase = GamePhase.DISCUSSION;
    let narrative = "";
    let gameOver = false;

    if (!jackAlive) {
      narrative = "The Jack has fallen! The Citizens have reclaimed the Borderland.";
      gameOver = true;
    } else if (survivors.length <= 2 && jackAlive) {
      narrative = "The Jack has deceived you all. Complete annihilation.";
      gameOver = true;
    } else if (survivors.length === 0) {
      narrative = "No one survived the night.";
      gameOver = true;
    } else {
      narrative = await generateRoundNarrative(gameState.round, Suit.HEARTS, eliminatedCount, survivors.length);
    }

    // Handle RC winnings if game is over
    if (gameOver && gameState.rcPot && gameState.rcPot > 0) {
      const winnings = distributeRCWinnings(survivors, gameState.rcPot);
      const localPlayerObj = resolvedPlayers.find(p => p.isLocal);

      if (localPlayerObj) {
        const myWinnings = winnings.get(localPlayerObj.id);

        if (myWinnings && myWinnings > 0) {
          // Winner - add winnings
          await addTokens(myWinnings);
          narrative += `\n\n🎉 You won ${Math.floor(myWinnings)} RC tokens!`;
        } else {
          // Loser - already spent
          const lostAmount = localPlayerObj.rcStake || 0;
          narrative += `\n\n💀 You lost ${lostAmount} RC tokens.`;
        }
      }
    }

    const finalState = {
      phase: gameOver ? GamePhase.GAME_OVER : GamePhase.DISCUSSION,
      round: gameOver ? gameState.round : gameState.round + 1,
      timer: gameOver ? 0 : gameState.discussionTime,
      pot: gameState.pot,
      rcPot: gameState.rcPot, // Keep rcPot in state
      narrative,
      history: [narrative, ...gameState.history],
      discussionTime: gameState.discussionTime, // Preserve config
      gameId: gameState.gameId // Preserve gameId
    };

    setPlayers(resolvedPlayers);
    setGameState(finalState);
    if (gameOver && roomId) {
      setArenaStatus(roomId, 'ended').catch((err) => console.warn('Failed to close arena', err));
    }
    p2pService.broadcast('STATE_UPDATE', finalState);
    p2pService.broadcast('WELCOME', { players: resolvedPlayers, gameState: finalState });
  };

  return (
    <>
      {showNavbar && (
        <Navbar
          solanaProfile={solanaProfile}
          onConnectWallet={handleConnectWallet}
          userProfile={userProfile}
          onProfileNavigate={() => navigate('/profile')}
        />
      )}

      <Routes>
        <Route
          path="/"
          element={
            <LandingPage
              onConnectWallet={handleConnectWallet}
              onGuestEnter={() => navigate('/arena')}
              onGoogleLogin={handleGoogleLogin}
              userProfile={userProfile}
              onGetStarted={() => navigate('/arena')}
            />
          }
        />
        <Route
          path="/arena"
          element={
            <ArenaPage
              solanaProfile={solanaProfile}
              roomId={roomId}
              inputRoomId={inputRoomId}
              setInputRoomId={setInputRoomId}
              players={players}
              localPlayer={localPlayer}
              onStartSinglePlayer={startSinglePlayer}
              onCreateRoom={createRoom}
              onJoinRoom={joinRoom}
              onStartMultiplayerGame={startMultiplayerGame}
            />
          }
        />
        <Route
          path="/lobby"
          element={
            <LobbyPage
              solanaProfile={solanaProfile}
              roomId={roomId}
              inputRoomId={inputRoomId}
              setInputRoomId={setInputRoomId}
              players={players}
              localPlayer={localPlayer}
              onStartSinglePlayer={startSinglePlayer}
              onCreateRoom={createRoom}
              onJoinRoom={joinRoom}
              onStartMultiplayerGame={startMultiplayerGame}
              onLeaveRoom={leaveRoom}
            />
          }
        />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route
          path="/game"
          element={
            <GamePage
              gameState={gameState}
              players={players}
              localPlayer={localPlayer}
              chatMessages={chatMessages}
              onSendMessage={handleSendMessage}
              localStream={localStream}
              remoteStreams={remoteStreams}
              onAction={handleAction}
              onLeave={leaveRoom}
            />
          }
        />
        <Route
          path="*"
          element={
            <LandingPage
              onConnectWallet={handleConnectWallet}
              onGuestEnter={() => navigate('/arena')}
              onGoogleLogin={handleGoogleLogin}
              userProfile={userProfile}
              onGetStarted={() => navigate('/arena')}
            />
          }
        />
      </Routes>

      {/* Staking Modal */}
      <StakingModal
        isOpen={showStakingModal}
        onClose={() => {
          setShowStakingModal(false);
          setPendingGameStart(null);
        }}
        onConfirm={handleStakeConfirm}
        title="Stake Your RC Tokens"
        description="Choose how much to risk in this game"
      />
    </>
  );
};

const App = () => (
  <TokenProvider>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </TokenProvider>
);

export default App;
