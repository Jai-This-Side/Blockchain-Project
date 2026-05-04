// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Charity Donation Tracker
/// @notice A student-friendly contract for accepting donations and releasing funds by milestones.
contract CharityDonationTracker {
    address payable public owner;
    uint256 public totalDonations;

    mapping(address => uint256) public donations;

    struct Milestone {
        string description;
        uint256 amount;
        bool approved;
        bool released;
        uint256 createdAt;
        uint256 releasedAt;
    }

    Milestone[] public milestones;

    event DonationReceived(address indexed donor, uint256 amount, uint256 totalDonations);
    event MilestoneCreated(uint256 indexed milestoneId, string description, uint256 amount);
    event MilestoneApproved(uint256 indexed milestoneId);
    event FundsReleased(uint256 indexed milestoneId, address indexed recipient, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier validMilestone(uint256 _milestoneId) {
        require(_milestoneId < milestones.length, "Milestone does not exist");
        _;
    }

    constructor() {
        owner = payable(msg.sender);
    }

    /// @notice Donate ETH to the charity contract.
    function donate() external payable {
        _recordDonation(msg.sender, msg.value);
    }

    /// @notice Allows direct ETH transfers to be tracked as donations too.
    receive() external payable {
        _recordDonation(msg.sender, msg.value);
    }

    /// @notice Owner creates a milestone that can later be approved and released.
    /// @param _description Short explanation of what this spending milestone funds.
    /// @param _amount ETH amount in wei that should be released for this milestone.
    function createMilestone(string calldata _description, uint256 _amount) external onlyOwner {
        require(bytes(_description).length > 0, "Description is required");
        require(_amount > 0, "Milestone amount must be greater than zero");

        milestones.push(
            Milestone({
                description: _description,
                amount: _amount,
                approved: false,
                released: false,
                createdAt: block.timestamp,
                releasedAt: 0
            })
        );

        emit MilestoneCreated(milestones.length - 1, _description, _amount);
    }

    /// @notice Owner approves a milestone before funds can be released.
    function approveMilestone(uint256 _milestoneId) external onlyOwner validMilestone(_milestoneId) {
        Milestone storage milestone = milestones[_milestoneId];

        require(!milestone.approved, "Milestone already approved");
        require(!milestone.released, "Milestone already released");

        milestone.approved = true;

        emit MilestoneApproved(_milestoneId);
    }

    /// @notice Owner releases funds for an approved milestone.
    /// @dev Funds are sent to the owner wallet, which represents the charity admin in this simple project.
    function releaseFunds(uint256 _milestoneId) external onlyOwner validMilestone(_milestoneId) {
        Milestone storage milestone = milestones[_milestoneId];

        require(milestone.approved, "Milestone must be approved first");
        require(!milestone.released, "Funds already released");
        require(address(this).balance >= milestone.amount, "Insufficient contract balance");

        milestone.released = true;
        milestone.releasedAt = block.timestamp;

        (bool sent, ) = owner.call{value: milestone.amount}("");
        require(sent, "Fund transfer failed");

        emit FundsReleased(_milestoneId, owner, milestone.amount);
    }

    function getMilestoneCount() external view returns (uint256) {
        return milestones.length;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function _recordDonation(address _donor, uint256 _amount) private {
        require(_amount > 0, "Donation must be greater than zero");

        donations[_donor] += _amount;
        totalDonations += _amount;

        emit DonationReceived(_donor, _amount, totalDonations);
    }
}
