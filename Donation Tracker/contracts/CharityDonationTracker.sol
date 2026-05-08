// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CharityDonationTracker {
    address public ngoVerifier;
    address public governmentVerifier;
    uint256 public totalDonations;
    uint256 public releasedDonations;

    mapping(address => uint256) public donations;

    struct CrisisRelease {
        uint256 crisisId;
        string description;
        address recipient;
        uint256 amount;
        bool ngoVerified;
        bool governmentVerified;
        bool released;
        uint256 createdAt;
        uint256 releasedAt;
    }

    CrisisRelease[] public releases;

    event DonationReceived(address indexed donor, uint256 amount, uint256 totalDonations);
    event ReleaseCreated(
        uint256 indexed releaseId,
        uint256 indexed crisisId,
        address indexed recipient,
        string description,
        uint256 amount
    );
    event NgoVerified(uint256 indexed releaseId);
    event GovernmentVerified(uint256 indexed releaseId);
    event FundsReleased(uint256 indexed releaseId, uint256 indexed crisisId, address indexed recipient, uint256 amount);

    modifier onlyNgoVerifier() {
        require(msg.sender == ngoVerifier, "Only NGO verifier can perform this action");
        _;
    }

    modifier onlyGovernmentVerifier() {
        require(msg.sender == governmentVerifier, "Only government verifier can perform this action");
        _;
    }

    modifier validRelease(uint256 releaseId) {
        require(releaseId < releases.length, "Release does not exist");
        _;
    }

    constructor(address _ngoVerifier, address _governmentVerifier) {
        require(_ngoVerifier != address(0), "NGO verifier is required");
        require(_governmentVerifier != address(0), "Government verifier is required");
        require(_ngoVerifier != _governmentVerifier, "Verifiers must be different");

        ngoVerifier = _ngoVerifier;
        governmentVerifier = _governmentVerifier;
    }

    function donate(uint256 amount) external {
        require(amount > 0, "Donation must be greater than zero");

        donations[msg.sender] += amount;
        totalDonations += amount;

        emit DonationReceived(msg.sender, amount, totalDonations);
    }

    function createRelease(
        uint256 crisisId,
        string calldata description,
        address recipient,
        uint256 amount
    ) external onlyNgoVerifier {
        require(bytes(description).length > 0, "Description is required");
        require(recipient != address(0), "Recipient is required");
        require(amount > 0, "Release amount must be greater than zero");

        releases.push(
            CrisisRelease({
                crisisId: crisisId,
                description: description,
                recipient: recipient,
                amount: amount,
                ngoVerified: false,
                governmentVerified: false,
                released: false,
                createdAt: block.timestamp,
                releasedAt: 0
            })
        );

        emit ReleaseCreated(releases.length - 1, crisisId, recipient, description, amount);
    }

    function verifyByNgo(uint256 releaseId) external onlyNgoVerifier validRelease(releaseId) {
        CrisisRelease storage releaseRequest = releases[releaseId];

        require(!releaseRequest.released, "Funds already released");
        require(!releaseRequest.ngoVerified, "NGO already verified");

        releaseRequest.ngoVerified = true;

        emit NgoVerified(releaseId);
    }

    function verifyByGovernment(uint256 releaseId) external onlyGovernmentVerifier validRelease(releaseId) {
        CrisisRelease storage releaseRequest = releases[releaseId];

        require(!releaseRequest.released, "Funds already released");
        require(!releaseRequest.governmentVerified, "Government already verified");

        releaseRequest.governmentVerified = true;

        emit GovernmentVerified(releaseId);
    }

    function releaseFunds(uint256 releaseId) external onlyNgoVerifier validRelease(releaseId) {
        CrisisRelease storage releaseRequest = releases[releaseId];

        require(releaseRequest.ngoVerified, "NGO verification required");
        require(releaseRequest.governmentVerified, "Government verification required");
        require(!releaseRequest.released, "Funds already released");
        require(getFundBalance() >= releaseRequest.amount, "Insufficient fund balance");

        releaseRequest.released = true;
        releaseRequest.releasedAt = block.timestamp;
        releasedDonations += releaseRequest.amount;

        emit FundsReleased(releaseId, releaseRequest.crisisId, releaseRequest.recipient, releaseRequest.amount);
    }

    function getReleaseCount() external view returns (uint256) {
        return releases.length;
    }

    function getFundBalance() public view returns (uint256) {
        return totalDonations - releasedDonations;
    }
}
