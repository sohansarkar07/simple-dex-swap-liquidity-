const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH\n");

  const initialSupply = ethers.parseUnits("1000000", 18);

  const TokenA = await ethers.getContractFactory("TokenA");
  const tokenA = await TokenA.deploy(initialSupply);
  await tokenA.waitForDeployment();

  const tokenAAddress = await tokenA.getAddress();
  console.log("TokenA deployed to:", tokenAAddress);

  const TokenB = await ethers.getContractFactory("TokenB");
  const tokenB = await TokenB.deploy(initialSupply);
  await tokenB.waitForDeployment();

  const tokenBAddress = await tokenB.getAddress();
  console.log("TokenB deployed to:", tokenBAddress);

  const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
  const dex = await SimpleDEX.deploy(tokenAAddress, tokenBAddress);
  await dex.waitForDeployment();

  const dexAddress = await dex.getAddress();
  console.log("SimpleDEX deployed to:", dexAddress);

  console.log("\n─────────────────────────────────────────────────────────");
  console.log("✅  Deployment complete. Update frontend/script.js with:");
  console.log("─────────────────────────────────────────────────────────");
  console.log(`  TOKEN_A_ADDRESS = "${tokenAAddress}"`);
  console.log(`  TOKEN_B_ADDRESS = "${tokenBAddress}"`);
  console.log(`  DEX_ADDRESS     = "${dexAddress}"`);
  console.log("─────────────────────────────────────────────────────────\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
