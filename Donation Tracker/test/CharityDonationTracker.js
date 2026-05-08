const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CharityDonationTracker", function () {
  async function deployTrackerFixture() {
    const [ngo, government, donor, recipient, outsider] = await ethers.getSigners();
    const CharityDonationTracker = await ethers.getContractFactory("CharityDonationTracker");
    const tracker = await CharityDonationTracker.deploy(ngo.address, government.address);
    await tracker.waitForDeployment();

    return { tracker, ngo, government, donor, recipient, outsider };
  }

  it("accepts dummy currency donations and tracks donor totals", async function () {
    const { tracker, donor } = await deployTrackerFixture();
    const donationAmount = 1000n;

    await expect(tracker.connect(donor).donate(donationAmount))
      .to.emit(tracker, "DonationReceived")
      .withArgs(donor.address, donationAmount, donationAmount);

    expect(await tracker.donations(donor.address)).to.equal(donationAmount);
    expect(await tracker.totalDonations()).to.equal(donationAmount);
    expect(await tracker.getFundBalance()).to.equal(donationAmount);
  });

  it("allows the NGO verifier to create a crisis release", async function () {
    const { tracker, ngo, recipient, outsider } = await deployTrackerFixture();
    const amount = 350n;

    await expect(tracker.connect(ngo).createRelease(57, "Emergency shelter supplies", recipient.address, amount))
      .to.emit(tracker, "ReleaseCreated")
      .withArgs(0n, 57n, recipient.address, "Emergency shelter supplies", amount);

    await expect(
      tracker.connect(outsider).createRelease(58, "Unauthorized request", recipient.address, amount)
    ).to.be.revertedWith("Only NGO verifier can perform this action");

    expect(await tracker.getReleaseCount()).to.equal(1n);

    const releaseRequest = await tracker.releases(0);
    expect(releaseRequest.crisisId).to.equal(57n);
    expect(releaseRequest.description).to.equal("Emergency shelter supplies");
    expect(releaseRequest.recipient).to.equal(recipient.address);
    expect(releaseRequest.amount).to.equal(amount);
    expect(releaseRequest.ngoVerified).to.equal(false);
    expect(releaseRequest.governmentVerified).to.equal(false);
    expect(releaseRequest.released).to.equal(false);
  });

  it("releases funds only after NGO and government verification", async function () {
    const { tracker, ngo, government, donor, recipient } = await deployTrackerFixture();

    await tracker.connect(donor).donate(1000);
    await tracker.connect(ngo).createRelease(57, "Mobile medical camp", recipient.address, 400);

    await expect(tracker.connect(ngo).releaseFunds(0)).to.be.revertedWith("NGO verification required");

    await expect(tracker.connect(ngo).verifyByNgo(0))
      .to.emit(tracker, "NgoVerified")
      .withArgs(0n);

    await expect(tracker.connect(ngo).releaseFunds(0)).to.be.revertedWith("Government verification required");

    await expect(tracker.connect(government).verifyByGovernment(0))
      .to.emit(tracker, "GovernmentVerified")
      .withArgs(0n);

    await expect(tracker.connect(ngo).releaseFunds(0))
      .to.emit(tracker, "FundsReleased")
      .withArgs(0n, 57n, recipient.address, 400n);

    const releaseRequest = await tracker.releases(0);
    expect(releaseRequest.ngoVerified).to.equal(true);
    expect(releaseRequest.governmentVerified).to.equal(true);
    expect(releaseRequest.released).to.equal(true);
    expect(await tracker.getFundBalance()).to.equal(600n);

    await expect(tracker.connect(ngo).releaseFunds(0)).to.be.revertedWith("Funds already released");
  });

  it("keeps NGO and government verifier powers separate", async function () {
    const { tracker, ngo, government, recipient, outsider } = await deployTrackerFixture();

    await tracker.connect(ngo).createRelease(57, "Temporary shelter", recipient.address, 100);

    await expect(tracker.connect(government).verifyByNgo(0)).to.be.revertedWith(
      "Only NGO verifier can perform this action"
    );
    await expect(tracker.connect(outsider).verifyByGovernment(0)).to.be.revertedWith(
      "Only government verifier can perform this action"
    );
  });
});
