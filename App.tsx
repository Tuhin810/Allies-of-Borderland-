
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { GameState, Player, GamePhase, Suit, PlayerAction, ChatMessage, Role } from './types';
import { generateRoundNarrative, generateGameIntro } from './services/geminiService';
import { p2pService } from './services/p2p';
import { solanaService, SolanaProfile } from './services/solana';
import { registerArena, setArenaStatus, updateArena } from './services/arenaRegistry';
import LandingPage from './pages/LandingPage';
import ArenaPage from './pages/ArenaPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import LoadingPage from './pages/LoadingPage';
import FeaturesPage from './pages/FeaturesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import FAQPage from './pages/FAQPage';

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

  // Web3 State
  const [solanaProfile, setSolanaProfile] = useState<SolanaProfile | null>(null);

  // Game State
  const [players, setPlayers] = useState<Player[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.LOBBY,
    round: 0,
    timer: DISCUSSION_TIME,
    pot: 0,
    narrative: "Waiting for game to start...",
    history: []
  });

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

  // Check URL Params for Invite Link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setInputRoomId(roomParam);
    }
  }, []);

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

  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
      } catch (err) {
        console.warn("Camera access denied or failed", err);
      }
    };
    getMedia();
  }, []);

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
      p2pService.cleanup();
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

  // --- Actions ---

  const handleConnectWallet = async () => {
    try {
      const profile = await solanaService.connect();
      setSolanaProfile(profile);
        if (normalizedPath === '/') {
          navigate('/arena');
      }
    } catch (e: any) {
      alert("Failed to connect wallet: " + e.message);
    }
  };

  const initLocalPlayer = (isSpectator: boolean = false) => {
    const name = solanaProfile ? `Cit. ${solanaProfile.shortAddress}` : `Cit. ${Math.floor(Math.random() * 1000)}`;
    const avatar = solanaProfile ? `https://api.dicebear.com/7.x/bottts/svg?seed=${solanaProfile.address}` : '';
    const address = solanaProfile ? solanaProfile.address : `MockSolanaKey-${Math.random().toString(36)}`;
    
    return {
      id: solanaProfile ? solanaProfile.address : `p-${Math.random().toString(36).substr(2, 9)}`,
      name,
      avatar,
      hp: INITIAL_HP,
      isAlive: true,
      isLocal: true,
      isSpectator,
      isWeb3: !!solanaProfile,
      betAmount: 0,
      balance: solanaProfile ? solanaProfile.balance : INITIAL_BALANCE,
      solanaAddress: address,
      reputation: 100,
      role: Role.CITIZEN
    };
  };

  const createRoom = async () => {
    if (!localStream) {
        alert("Camera access required to play.");
        return;
    }
    navigate('/loading');
    setIsMultiplayer(true);
    const id = await p2pService.init(true, localStream);
    setRoomId(id);
    
    const host = { ...initLocalPlayer(), isHost: true, peerId: id };
    setPlayers([host]);
    setGameState(prev => ({ ...prev, narrative: "Waiting for citizens..." }));
    registerArena({
      roomId: id,
      hostPeerId: id,
      hostName: host.name,
      status: 'waiting',
      playerCount: 1,
      capacity: 10,
      buyIn: BUY_IN_AMOUNT
    }).catch((err) => console.warn('Failed to register arena', err));
    navigate('/lobby'); 
  };

  const joinRoom = async (asSpectator: boolean = false, targetRoomId?: string) => {
    const roomToJoin = targetRoomId || inputRoomId;
    if (!roomToJoin) return;
    if (!asSpectator && !localStream) {
        alert("Camera access required to play.");
        return;
    }
    navigate('/loading');
    setIsMultiplayer(true);
    const myId = await p2pService.init(false, asSpectator ? null : localStream);
    
    setRoomId(roomToJoin);
    setInputRoomId(roomToJoin);
    const me = { ...initLocalPlayer(asSpectator), peerId: myId };
    p2pService.connectToHost(roomToJoin, me);
    navigate('/lobby'); 
  };

  const startSinglePlayer = () => {
    setIsMultiplayer(false);
    const me = initLocalPlayer();
    const bots = AI_PLAYERS.map(b => ({...b, role: Role.CITIZEN, actualSuit: Suit.HEARTS}));
    const all = [me, ...bots];
    setPlayers(all);
    startNewGame(all); 
    navigate('/game');
  };

  const startMultiplayerGame = async () => {
    if (!p2pService.isHost) return;
    startNewGame(players);
    if (roomId) {
      setArenaStatus(roomId, 'active').catch((err) => console.warn('Failed to mark arena active', err));
    }
    navigate('/game');
  };

  const startNewGame = async (currentPlayers: Player[]) => {
    const suits = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
    
    const jackIndex = Math.floor(Math.random() * currentPlayers.length);
    
    const initializedPlayers = currentPlayers.map((p, idx) => ({
        ...p,
        role: idx === jackIndex ? Role.JACK : Role.CITIZEN,
        actualSuit: suits[Math.floor(Math.random() * suits.length)],
        guessedSuit: null,
        isAlive: true,
        hp: INITIAL_HP
    }));

    const intro = await generateGameIntro();
    const newState = {
      ...gameState,
      phase: GamePhase.DISCUSSION,
      round: 1,
      narrative: intro,
      timer: DISCUSSION_TIME,
      history: [intro, "The Jack has been chosen. Trust no one."]
    };
    
    setPlayers(initializedPlayers);
    setGameState(newState);
    if (p2pService.isHost) p2pService.broadcast('STATE_UPDATE', newState);
    if (p2pService.isHost) p2pService.broadcast('WELCOME', { players: initializedPlayers, gameState: newState });
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

    const finalState = {
      phase: gameOver ? GamePhase.GAME_OVER : GamePhase.DISCUSSION,
      round: gameOver ? gameState.round : gameState.round + 1,
      timer: gameOver ? 0 : DISCUSSION_TIME,
      pot: gameState.pot,
      narrative,
      history: [narrative, ...gameState.history]
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
        />
      )}

      <Routes>
        <Route 
          path="/"
          element={
            <LandingPage 
              onConnectWallet={handleConnectWallet}
              onGuestEnter={() => navigate('/arena')}
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
            />
          }
        />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/faq" element={<FAQPage />} />
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
            />
          }
        />
        <Route 
          path="*"
          element={
            <LandingPage 
              onConnectWallet={handleConnectWallet}
              onGuestEnter={() => navigate('/arena')}
            />
          }
        />
      </Routes>
    </>
  );
};

const App = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;
