const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const CharityDonationTracker = await hre.ethers.getContractFactory("CharityDonationTracker");
  const tracker = await CharityDonationTracker.deploy();

  await tracker.waitForDeployment();

  console.log("CharityDonationTracker deployed to:", await tracker.getAddress());
  console.log("Owner/admin wallet:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
