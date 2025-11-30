import { BrowserProvider, formatEther, Contract, Eip1193Provider, TransactionReceipt } from 'ethers';

// --- Types & Interfaces ---

declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (eventName: string, handler: (...args: any[]) => void) => void;
      removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
    };
  }
}

export interface Web3Profile {
  address: string;
  balance: string; // Formatted ETH string
  chainId: string;
  gameTokenBalance: number;
}

// --- Configuration ---

// TODO: Replace with your deployed contract address
const GAME_TOKEN_ADDRESS = "0x0E4d26242E50abF138F57d77d26C74500b547bF0";

const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7'; // 11155111
const SEPOLIA_CHAIN_ID_DECIMAL = 11155111;

const SEPOLIA_NETWORK_CONFIG = {
  chainId: SEPOLIA_CHAIN_ID_HEX,
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'SEP',
    decimals: 18
  },
  rpcUrls: ['https://sepolia.infura.io/v3/', 'https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io']
};

const GAME_TOKEN_ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenAmount", "type": "uint256" }],
    "name": "purchaseTokens",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getTokenBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "TOKEN_PRICE",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "ethPaid", "type": "uint256" }
    ],
    "name": "TokensPurchased",
    "type": "event"
  }
];

// --- Service Class ---

class Web3Service {
  private provider: BrowserProvider | null = null;
  private gameTokenContract: Contract | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new BrowserProvider(window.ethereum);
    }
  }

  /**
   * Checks if a Web3 provider (MetaMask) is installed.
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum;
  }

  /**
   * Connects to the wallet, checks network, and fetches balances.
   */
  async connect(): Promise<Web3Profile> {
    if (!this.provider) {
      // Re-attempt initialization in case it loaded late
      if (window.ethereum) {
        this.provider = new BrowserProvider(window.ethereum);
      } else {
        throw new Error("No Ethereum provider found. Please install MetaMask.");
      }
    }

    try {
      // Request account access
      const accounts = await this.provider.send("eth_requestAccounts", []);
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts authorized.");
      }

      const address = accounts[0];
      const balanceBigInt = await this.provider.getBalance(address);
      const network = await this.provider.getNetwork();
      const chainId = network.chainId;

      // Initialize contract (Read-only mode initially)
      this.gameTokenContract = new Contract(GAME_TOKEN_ADDRESS, GAME_TOKEN_ABI, this.provider);

      // Get game token balance if we are on the correct network
      let gameTokenBalance = 0;
      if (chainId === BigInt(SEPOLIA_CHAIN_ID_DECIMAL)) {
        try {
          // Note: In Ethers v6, contract calls return BigInts or strings depending on config, 
          // usually BigInt for uint256.
          const balance = await this.gameTokenContract.getTokenBalance(address);
          gameTokenBalance = Number(balance);
        } catch (error) {
          console.warn("Failed to fetch game token balance (contract might not exist on this chain):", error);
        }
      }

      return {
        address,
        balance: formatEther(balanceBigInt),
        chainId: chainId.toString(),
        gameTokenBalance
      };
    } catch (error: any) {
      console.error("Connection error:", error);
      throw new Error(error.message || "Failed to connect wallet");
    }
  }

  /**
   * Switches the user's wallet to the Sepolia Testnet.
   * If Sepolia is not added to the wallet, it attempts to add it.
   */
  async switchToSepolia(): Promise<boolean> {
    if (!window.ethereum) {
      throw new Error("MetaMask not found");
    }

    try {
      // Try to switch to Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
      return true;
    } catch (switchError: any) {
      // This error code 4902 indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEPOLIA_NETWORK_CONFIG],
          });
          return true;
        } catch (addError) {
          console.error("Failed to add Sepolia network:", addError);
          throw new Error("Failed to add Sepolia network to wallet.");
        }
      }
      console.error("Failed to switch to Sepolia:", switchError);
      throw new Error("Failed to switch network.");
    }
  }

  /**
   * Purchases game tokens by sending ETH to the contract.
   * Automatically prompts network switch if not on Sepolia.
   */
  async purchaseGameTokens(tokenAmount: number): Promise<string> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    // 1. Ensure on Sepolia network
    const network = await this.provider.getNetwork();
    if (network.chainId !== BigInt(SEPOLIA_CHAIN_ID_DECIMAL)) {
      const switched = await this.switchToSepolia();
      if (!switched) throw new Error("Must be on Sepolia network to purchase.");

      // Re-initialize provider/signer after network switch to ensure context is correct
      this.provider = new BrowserProvider(window.ethereum!);
    }

    // 2. Get Signer (Required for writing transactions)
    const signer = await this.provider.getSigner();

    // 3. Connect contract to signer
    const contractWithSigner = new Contract(GAME_TOKEN_ADDRESS, GAME_TOKEN_ABI, signer);

    try {
      // 4. Get token price
      const tokenPrice: bigint = await contractWithSigner.TOKEN_PRICE();

      // 5. Calculate total ETH needed (Price * Amount)
      const totalEth = tokenPrice * BigInt(tokenAmount);

      console.log(`Purchasing ${tokenAmount} tokens for ${formatEther(totalEth)} ETH`);

      // 6. Send Transaction
      const tx = await contractWithSigner.purchaseTokens(tokenAmount, {
        value: totalEth
      });

      console.log("Transaction sent:", tx.hash);

      // 7. Wait for confirmation
      const receipt: TransactionReceipt = await tx.wait();

      if (!receipt) throw new Error("Transaction failed or receipt missing");

      console.log("Transaction confirmed in block:", receipt.blockNumber);
      return receipt.hash;
    } catch (error: any) {
      console.error("Purchase failed:", error);
      if (error.code === 'ACTION_REJECTED') {
        throw new Error("Transaction rejected by user.");
      }
      throw new Error(error.reason || error.message || "Purchase failed");
    }
  }

  /**
   * Helper to fetch just the token balance for a specific address.
   */
  async getGameTokenBalance(address: string): Promise<number> {
    if (!this.provider) return 0;

    // Use internal contract instance if available, otherwise create one
    const contract = this.gameTokenContract || new Contract(GAME_TOKEN_ADDRESS, GAME_TOKEN_ABI, this.provider);

    try {
      const balance = await contract.getTokenBalance(address);
      return Number(balance);
    } catch (error) {
      console.error("Failed to get game token balance:", error);
      return 0;
    }
  }

  /**
   * Utility to format addresses for UI display (e.g., 0x123...ABCD)
   */
  shortenAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

export const web3Service = new Web3Service();