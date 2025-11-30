import Peer, { DataConnection, MediaConnection } from 'peerjs';
import { Player, GameState, NetworkMessage, NetworkMessageType } from '../types';

type EventCallback = (data: any) => void;

export class P2PService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private mediaConnections: Map<string, MediaConnection> = new Map();
  private listeners: Map<string, EventCallback[]> = new Map();
  
  public myPeerId: string | null = null;
  public isHost: boolean = false;
  private localStream: MediaStream | null = null;

  constructor() {}

  // Helper: Create a dummy stream for Spectators (Silent/Black) to allow Mesh Connection
  private createDummyStream(): MediaStream {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const dest = ctx.createMediaStreamDestination();
      osc.connect(dest);
      // Don't start osc to keep it silent, or start and mute track
      osc.start();
      const audioTrack = dest.stream.getAudioTracks()[0];
      audioTrack.enabled = false;

      // Create a 1x1 black canvas for video
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const canvasStream = canvas.captureStream(1);
      const videoTrack = canvasStream.getVideoTracks()[0];
      videoTrack.enabled = false;

      return new MediaStream([audioTrack, videoTrack]);
    } catch (e) {
      console.warn("Could not create dummy stream, connection might fail:", e);
      return new MediaStream(); // Empty stream fallback
    }
  }

  // Initialize Peer
  async init(isHost: boolean, localStream: MediaStream | null): Promise<string> {
    this.isHost = isHost;
    this.localStream = localStream;

    return new Promise((resolve, reject) => {
      // Create Peer instance
      // Using public PeerJS server. 
      // In production, you would run your own peerjs-server.
      this.peer = new Peer();

      this.peer.on('open', (id) => {
        console.log('My Peer ID:', id);
        this.myPeerId = id;
        resolve(id);
      });

      this.peer.on('connection', (conn) => this.handleConnection(conn));
      this.peer.on('call', (call) => this.handleIncomingCall(call));
      
      this.peer.on('error', (err) => {
        console.error('Peer Error:', err);
        // Retry logic or user notification could go here
        this.emit('error', err);
      });
    });
  }

  // Connect to a Host (Data Channel Only)
  connectToHost(hostId: string, playerProfile: Partial<Player>) {
    if (!this.peer) return;

    console.log(`Connecting to host: ${hostId}`);
    const conn = this.peer.connect(hostId, { reliable: true });
    
    conn.on('open', () => {
      console.log('Data connection to Host open');
      this.connections.set(hostId, conn);
      
      // Send JOIN message to Host
      this.send({
        type: 'JOIN',
        payload: { ...playerProfile, peerId: this.myPeerId }
      });
    });

    conn.on('data', (data) => this.handleData(data));
    conn.on('close', () => {
      console.log('Disconnected from Host');
      this.emit('disconnected', hostId);
    });
    
    conn.on('error', (err) => console.error("Connection Error", err));
  }

  // Handle incoming data connection
  private handleConnection(conn: DataConnection) {
    conn.on('open', () => {
      console.log('New data connection from:', conn.peer);
      this.connections.set(conn.peer, conn);
    });

    conn.on('data', (data) => this.handleData(data));
    
    conn.on('close', () => {
      console.log('Connection closed:', conn.peer);
      this.connections.delete(conn.peer);
      this.mediaConnections.delete(conn.peer);
      this.emit('playerDisconnected', conn.peer);
    });
    
    conn.on('error', (err) => console.error("Data Connection Error", err));
  }

  // Handle incoming media call
  private handleIncomingCall(call: MediaConnection) {
    console.log('Incoming call from:', call.peer);
    
    // Setup listeners FIRST to ensure we don't miss any events
    this.setupCallListeners(call);

    // If we have a local stream, answer with it.
    // If we are a spectator (localStream is null), answer with a dummy stream.
    const streamToAnswer = this.localStream || this.createDummyStream();
    
    call.answer(streamToAnswer);
  }

  // Setup listeners for a media connection (both incoming and outgoing)
  private setupCallListeners(call: MediaConnection) {
    call.on('stream', (remoteStream) => {
      console.log('Received stream from:', call.peer);
      this.emit('stream', { peerId: call.peer, stream: remoteStream });
    });
    
    call.on('error', (err) => console.error("Call Error", err));

    call.on('close', () => {
      console.log('Media connection closed:', call.peer);
      this.mediaConnections.delete(call.peer);
    });

    this.mediaConnections.set(call.peer, call);
  }

  // Initiate a Media Call to a peer
  callPeer(peerId: string) {
    if (!this.peer) {
        console.warn("Cannot call peer: PeerJS not init");
        return;
    }
    
    if (this.mediaConnections.has(peerId)) {
        console.log(`Already have media connection to ${peerId}`);
        return;
    }

    // Use local stream or dummy stream if spectator
    const streamToCall = this.localStream || this.createDummyStream();

    console.log(`Calling peer: ${peerId}`);
    const call = this.peer.call(peerId, streamToCall);
    this.setupCallListeners(call);
  }

  // Check if we already have a media connection with this peer
  hasMediaConnection(peerId: string): boolean {
      return this.mediaConnections.has(peerId);
  }

  // Generic Data Handler
  private handleData(data: any) {
    const msg = data as NetworkMessage;
    this.emit(msg.type, msg.payload);
  }

  // Send message to a specific or all connections
  send(msg: NetworkMessage) {
    // If broadcasting (Host), send to all
    if (this.isHost) {
      this.connections.forEach(conn => {
          if (conn.open) conn.send(msg);
      });
    } else {
      // If client, send to host (assuming single connection)
      this.connections.forEach(conn => {
          if (conn.open) conn.send(msg);
      });
    }
  }

  // Host only: Broadcast message to all connected clients
  broadcast(type: NetworkMessageType, payload: any) {
    if (!this.isHost) return;
    const msg: NetworkMessage = { type, payload };
    this.connections.forEach(conn => {
        if (conn.open) conn.send(msg);
    });
  }

  // Event Emitter Logic
  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      this.listeners.set(event, callbacks.filter(cb => cb !== callback));
    }
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  cleanup() {
    this.peer?.destroy();
    this.connections.clear();
    this.mediaConnections.clear();
    this.listeners.clear();
  }

  disconnect() {
    this.connections.forEach((conn) => {
      try {
        conn.close();
      } catch (e) {
        console.warn('Failed closing data connection', e);
      }
    });
    this.mediaConnections.forEach((call) => {
      try {
        call.close();
      } catch (e) {
        console.warn('Failed closing media connection', e);
      }
    });
    this.peer?.disconnect();
    this.peer?.destroy();
    this.connections.clear();
    this.mediaConnections.clear();
    this.myPeerId = null;
    this.isHost = false;
  }
}

export const p2pService = new P2PService();