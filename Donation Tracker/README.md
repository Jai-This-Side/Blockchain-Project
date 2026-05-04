# Charity Donation Tracker DApp

A moderate Solidity + React project for a college blockchain submission. Users can donate ETH, every donation is tracked publicly, and the owner/admin releases funds only after creating and approving spending milestones.

## Tech Stack

- Solidity `^0.8.20`
- Hardhat
- ethers.js
- React + Vite
- MetaMask

## Project Structure

```text
Donation Tracker/
  contracts/
    CharityDonationTracker.sol
  scripts/
    deploy.js
  test/
    CharityDonationTracker.js
  frontend/
    src/
      App.jsx
      contractABI.js
      config.js
      styles.css
```

## Smart Contract Explanation

The contract is named `CharityDonationTracker`.

Important state variables:

- `owner`: the admin wallet. This wallet can create milestones, approve them, and release funds.
- `donations`: stores how much ETH each donor address has donated.
- `totalDonations`: stores the total ETH ever donated.
- `milestones`: stores all spending milestones.

Important functions:

- `donate()`: payable function used by donors to send ETH. It rejects zero-value donations.
- `createMilestone(description, amount)`: owner-only function that creates a new spending milestone.
- `approveMilestone(id)`: owner-only function that marks a milestone as approved.
- `releaseFunds(id)`: owner-only function that sends the milestone amount to the owner/admin wallet. It checks that the milestone is approved, not already released, and that the contract has enough ETH.

Events emitted by the contract:

- `DonationReceived`
- `MilestoneCreated`
- `MilestoneApproved`
- `FundsReleased`

For simplicity, the owner wallet also acts as the charity/admin wallet receiving released milestone funds.

## How To Run

Install Node.js first if it is not already installed.

### 1. Install Hardhat Project Dependencies

```bash
cd "/home/jai/Documents/Blockchain/Donation Tracker"
npm install
```

### 2. Compile The Contract

```bash
npm run compile
```

### 3. Run Tests

```bash
npm run test
```

The test file checks:

- donation tracking
- milestone creation
- milestone approval and fund release

### 4. Start A Local Blockchain

Keep this terminal running:

```bash
npm run node
```

### 5. Deploy The Contract

Open another terminal:

```bash
cd "/home/jai/Documents/Blockchain/Donation Tracker"
npm run deploy
```

The terminal prints the deployed contract address.

### 6. Configure MetaMask

Add a local Hardhat network in MetaMask:

- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency symbol: `ETH`

Import one of the test accounts printed by `npm run node`. Use these accounts only for local testing.

### 7. Configure The Frontend

```bash
cd "/home/jai/Documents/Blockchain/Donation Tracker/frontend"
npm install
```

Create `frontend/.env`:

```bash
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
```

### 8. Run The Frontend

```bash
npm run dev
```

Open the Vite URL in the browser, usually:

```text
http://localhost:5173
```

## Student Notes

This project avoids advanced DAO voting, tokenomics, or upgradeable contracts. The main Solidity concepts demonstrated are:

- payable functions
- mappings
- arrays of structs
- events
- modifiers
- owner-based access control
- balance checks before transferring ETH
- preventing double fund release
