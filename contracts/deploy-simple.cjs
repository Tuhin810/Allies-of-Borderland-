const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

async function main() {
    console.log("Deploying GameToken contract to Sepolia...\n");

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log("Deploying with account:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

    if (parseFloat(ethers.formatEther(balance)) < 0.01) {
        throw new Error("Insufficient balance! Get Sepolia ETH from faucet.");
    }

    // Read compiled contract
    const artifactPath = path.join(__dirname, "../artifacts/contracts/GameToken.sol/GameToken.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    // Deploy contract
    console.log("Deploying contract...");
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await factory.deploy();

    console.log("Transaction hash:", contract.deploymentTransaction().hash);
    console.log("Waiting for deployment...\n");

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    console.log("✅ GameToken deployed to:", contractAddress);

    // Save contract data
    const contractData = {
        address: contractAddress,
        deployer: wallet.address,
        network: "sepolia",
        deployedAt: new Date().toISOString(),
        abi: artifact.abi
    };

    const outputPath = path.join(__dirname, "GameToken.json");
    fs.writeFileSync(outputPath, JSON.stringify(contractData, null, 2));
    console.log("📄 Contract data saved to:", outputPath);

    console.log("\n📋 Summary:");
    console.log("Contract Address:", contractAddress);
    console.log("Network: Sepolia Testnet");
    console.log("Token Price: 0.0001 ETH per token");
    console.log("\n🔗 View on Etherscan:");
    console.log(`https://sepolia.etherscan.io/address/${contractAddress}`);
    console.log("\n⚠️  IMPORTANT: Copy this address to services/web3.ts (line ~74):");
    console.log(`const GAME_TOKEN_ADDRESS = "${contractAddress}";`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error.message);
        process.exit(1);
    });
