const hre = require("hardhat");

async function main() {
  const [ngoVerifier, governmentVerifier] = await hre.ethers.getSigners();

  const CharityDonationTracker = await hre.ethers.getContractFactory("CharityDonationTracker");
  const tracker = await CharityDonationTracker.deploy(ngoVerifier.address, governmentVerifier.address);

  await tracker.waitForDeployment();

  console.log("CharityDonationTracker deployed to:", await tracker.getAddress());
  console.log("NGO verifier:", ngoVerifier.address);
  console.log("Government verifier:", governmentVerifier.address);
  console.log("Currency mode: dummy relief credits only");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
