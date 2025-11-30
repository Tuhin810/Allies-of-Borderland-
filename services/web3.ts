import { BrowserProvider, formatEther, parseEther, Contract, Eip1193Provider } from 'ethers';

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
  gameTokenBalance?: number; // Game token balance from contract
}

// Sepolia network configuration
const SEPOLIA_NETWORK = {
  chainId: '0xaa36a7', // 11155111 in hex
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'SEP',
    decimals: 18
  },
  rpcUrls: ['https://sepolia.infura.io/v3/', 'https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io']
};

// GameToken contract ABI (simplified - only what we need)
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

// Contract address - UPDATE THIS AFTER DEPLOYMENT
// Run `npm run deploy:sepolia` and paste the contract address here
const GAME_TOKEN_ADDRESS = process.env.GAME_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";

export class Web3Service {
  private provider: BrowserProvider | null = null;
  private gameTokenContract: Contract | null = null;

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

    // Initialize contract
    this.gameTokenContract = new Contract(GAME_TOKEN_ADDRESS, GAME_TOKEN_ABI, this.provider);

    // Get game token balance if on Sepolia
    let gameTokenBalance = 0;
    if (network.chainId === BigInt(11155111)) {
      try {
        const balance = await this.gameTokenContract.getTokenBalance(address);
        gameTokenBalance = Number(balance);
      } catch (error) {
        console.warn("Failed to fetch game token balance:", error);
      }
    }

    return {
      address,
      balance: formatEther(balanceBigInt),
      chainId: network.chainId.toString(),
      gameTokenBalance
    };
  }

  async switchToSepolia(): Promise<boolean> {
    if (!window.ethereum) {
      throw new Error("MetaMask not found");
    }

    try {
      // Try to switch to Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_NETWORK.chainId }],
      });
      return true;
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEPOLIA_NETWORK],
          });
          return true;
        } catch (addError) {
          console.error("Failed to add Sepolia network:", addError);
          throw new Error("Failed to add Sepolia network");
        }
      }
      console.error("Failed to switch to Sepolia:", switchError);
      throw new Error("Failed to switch to Sepolia network");
    }
  }

  async purchaseGameTokens(tokenAmount: number): Promise<string> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    // Ensure on Sepolia network
    const network = await this.provider.getNetwork();
    if (network.chainId !== BigInt(11155111)) {
      await this.switchToSepolia();
    }

    // Get signer (user's wallet)
    const signer = await this.provider.getSigner();

    // Initialize contract with signer
    const contract = new Contract(GAME_TOKEN_ADDRESS, GAME_TOKEN_ABI, signer);

    // Get token price from contract
    const tokenPrice = await contract.TOKEN_PRICE();
    console.log("Token price from contract:", formatEther(tokenPrice), "ETH per token");

    // Calculate total ETH needed
    const totalEth = tokenPrice * BigInt(tokenAmount);
    console.log(`Purchasing ${tokenAmount} tokens for ${formatEther(totalEth)} ETH`);

    // Call purchaseTokens function
    const tx = await contract.purchaseTokens(tokenAmount, {
      value: totalEth
    });

    console.log("Transaction sent:", tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt.hash);

    return receipt.hash;
  }

  async getGameTokenBalance(address: string): Promise<number> {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    if (!this.gameTokenContract) {
      this.gameTokenContract = new Contract(GAME_TOKEN_ADDRESS, GAME_TOKEN_ABI, this.provider);
    }

    try {
      const balance = await this.gameTokenContract.getTokenBalance(address);
      return Number(balance);
    } catch (error) {
      console.error("Failed to get game token balance:", error);
      return 0;
    }
  }

  shortenAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

export const web3Service = new Web3Service();