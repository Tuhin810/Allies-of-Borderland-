import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';

// Extend window interface for Phantom/Solana support
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
      disconnect: () => Promise<void>;
      signTransaction: (transaction: Transaction) => Promise<Transaction>;
      signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
      signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
      on: (event: string, callback: (args: any) => void) => void;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

export interface SolanaProfile {
  address: string;
  balance: number; // SOL
  shortAddress: string;
}

export class SolanaService {
  private connection: Connection;
  private walletAddress: string | null = null;

  constructor() {
    // Connect to Devnet for testing. Use 'mainnet-beta' for production.
    this.connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  }

  isAvailable(): boolean {
    return 'solana' in window && window.solana?.isPhantom === true;
  }

  async connect(): Promise<SolanaProfile> {
    if (!this.isAvailable()) {
      window.open('https://phantom.app/', '_blank');
      throw new Error("Phantom Wallet not found. Please install it.");
    }

    try {
      // Connect to wallet
      const resp = await window.solana!.connect();
      this.walletAddress = resp.publicKey.toString();

      // Fetch balance
      const balanceLamports = await this.connection.getBalance(resp.publicKey);
      const balanceSOL = balanceLamports / LAMPORTS_PER_SOL;

      return {
        address: this.walletAddress,
        balance: balanceSOL,
        shortAddress: this.shortenAddress(this.walletAddress)
      };
    } catch (err) {
      console.error("Solana Connection Error:", err);
      throw err;
    }
  }

  shortenAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  // Real Transaction: Transfer SOL from player to a target address (e.g. Game Treasury or Host)
  async sendSOL(amountSOL: number, recipientAddress: string): Promise<string> {
    if (!this.walletAddress || !window.solana) throw new Error("Wallet not connected");

    try {
      const fromPubkey = new PublicKey(this.walletAddress);
      const toPubkey = new PublicKey(recipientAddress);
      
      const instructions = SystemProgram.transfer({
        fromPubkey: fromPubkey,
        toPubkey: toPubkey,
        lamports: amountSOL * LAMPORTS_PER_SOL,
      });

      const transaction = new Transaction().add(instructions);
      
      // Get latest blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      // Request signature from wallet
      const signedTransaction = await window.solana.signTransaction(transaction);
      
      // Send transaction
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
      
      // Confirm transaction
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      return signature;
    } catch (err) {
      console.error("Transaction Error:", err);
      throw new Error("Transaction failed or rejected.");
    }
  }

  async getBalance(address: string): Promise<number> {
    try {
        const pubKey = new PublicKey(address);
        const bal = await this.connection.getBalance(pubKey);
        return bal / LAMPORTS_PER_SOL;
    } catch (e) {
        return 0;
    }
  }
}

export const solanaService = new SolanaService();