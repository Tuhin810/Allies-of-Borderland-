import { BrowserProvider, formatEther, Eip1193Provider } from 'ethers';

// Declare window.ethereum type
declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

export interface Web3Profile {
  address: string;
  balance: string; // Formatted ETH string
  chainId: string;
}

export class Web3Service {
  private provider: BrowserProvider | null = null;

  constructor() {
    if (window.ethereum) {
      this.provider = new BrowserProvider(window.ethereum);
    }
  }

  isAvailable(): boolean {
    return !!window.ethereum;
  }

  async connect(): Promise<Web3Profile> {
    if (!this.provider) {
      throw new Error("No Ethereum provider found. Please install MetaMask.");
    }

    // Request accounts
    const accounts = await this.provider.send("eth_requestAccounts", []);
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts authorized.");
    }

    const address = accounts[0];
    const balanceBigInt = await this.provider.getBalance(address);
    const network = await this.provider.getNetwork();

    return {
      address,
      balance: formatEther(balanceBigInt),
      chainId: network.chainId.toString()
    };
  }

  shortenAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

export const web3Service = new Web3Service();