const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CharityDonationTracker", function () {
  async function deployTrackerFixture() {
    const [owner, donor] = await ethers.getSigners();
    const CharityDonationTracker = await ethers.getContractFactory("CharityDonationTracker");
    const tracker = await CharityDonationTracker.deploy();
    await tracker.waitForDeployment();

    return { tracker, owner, donor };
  }

  it("accepts donations and tracks donor totals", async function () {
    const { tracker, donor } = await deployTrackerFixture();
    const donationAmount = ethers.parseEther("1");

    await expect(tracker.connect(donor).donate({ value: donationAmount }))
      .to.emit(tracker, "DonationReceived")
      .withArgs(donor.address, donationAmount, donationAmount);

    expect(await tracker.donations(donor.address)).to.equal(donationAmount);
    expect(await tracker.totalDonations()).to.equal(donationAmount);
    expect(await tracker.getContractBalance()).to.equal(donationAmount);
  });

  it("allows the owner to create a milestone", async function () {
    const { tracker } = await deployTrackerFixture();
    const amount = ethers.parseEther("0.5");

    await expect(tracker.createMilestone("Buy school supplies", amount))
      .to.emit(tracker, "MilestoneCreated")
      .withArgs(0n, "Buy school supplies", amount);

    expect(await tracker.getMilestoneCount()).to.equal(1n);

    const milestone = await tracker.milestones(0);
    expect(milestone.description).to.equal("Buy school supplies");
    expect(milestone.amount).to.equal(amount);
    expect(milestone.approved).to.equal(false);
    expect(milestone.released).to.equal(false);
  });

  it("approves and releases funds for a milestone", async function () {
    const { tracker, donor, owner } = await deployTrackerFixture();
    const donationAmount = ethers.parseEther("2");
    const milestoneAmount = ethers.parseEther("1");

    await tracker.connect(donor).donate({ value: donationAmount });
    await tracker.createMilestone("Pay medical camp expenses", milestoneAmount);

    await expect(tracker.approveMilestone(0))
      .to.emit(tracker, "MilestoneApproved")
      .withArgs(0n);

    await expect(() => tracker.releaseFunds(0)).to.changeEtherBalances(
      [tracker, owner],
      [-milestoneAmount, milestoneAmount]
    );

    const milestone = await tracker.milestones(0);
    expect(milestone.approved).to.equal(true);
    expect(milestone.released).to.equal(true);
    expect(await tracker.getContractBalance()).to.equal(donationAmount - milestoneAmount);

    await expect(tracker.releaseFunds(0)).to.be.revertedWith("Funds already released");
  });
});
