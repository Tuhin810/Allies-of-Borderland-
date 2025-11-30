const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Deploying GameToken contract to Sepolia...");

    // Get the deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

    // Deploy the contract
    const GameToken = await hre.ethers.getContractFactory("GameToken");
    const gameToken = await GameToken.deploy();

    await gameToken.waitForDeployment();

    const contractAddress = await gameToken.getAddress();
    console.log("✅ GameToken deployed to:", contractAddress);

    // Save the contract address and ABI to a JSON file
    const contractData = {
        address: contractAddress,
        deployer: deployer.address,
        network: hre.network.name,
        deployedAt: new Date().toISOString(),
        abi: JSON.parse(gameToken.interface.formatJson())
    };

    const outputPath = path.join(__dirname, "GameToken.json");
    fs.writeFileSync(outputPath, JSON.stringify(contractData, null, 2));
    console.log("📄 Contract data saved to:", outputPath);

    // Wait for a few block confirmations
    console.log("⏳ Waiting for block confirmations...");
    await gameToken.deploymentTransaction().wait(5);

    // Verify on Etherscan
    if (hre.network.name === "sepolia" && process.env.ETHERSCAN_API_KEY) {
        console.log("🔍 Verifying contract on Etherscan...");
        try {
            await hre.run("verify:verify", {
                address: contractAddress,
                constructorArguments: [],
            });
            console.log("✅ Contract verified on Etherscan");
        } catch (error) {
            console.log("❌ Verification failed:", error.message);
        }
    }

    console.log("\n📋 Summary:");
    console.log("Contract Address:", contractAddress);
    console.log("Network:", hre.network.name);
    console.log("Token Price: 0.0001 ETH per token");
    console.log("\n🔗 View on Etherscan:");
    console.log(`https://sepolia.etherscan.io/address/${contractAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
