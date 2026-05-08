import React, { useMemo, useState } from "react";

const pages = [
  { id: "dashboard", label: "Dashboard" },
  { id: "donate", label: "Donate" },
  { id: "new-release", label: "New Release" },
  { id: "ngo", label: "NGO Verify" },
  { id: "government", label: "Government Verify" },
];
const CURRENCY = "DRC";
const NGO_ADDRESS = "NGO-VERIFY-57";
const GOVERNMENT_ADDRESS = "GOV-VERIFY-57";
const NON_VERIFIER = "PUBLIC-WALLET-09";

const initialWallets = [
  { address: "0xA11CE", label: "Asha", balance: 1200 },
  { address: "0xB0B57", label: "Ben", balance: 900 },
  { address: "0xC1V1C", label: "Civic Club", balance: 1500 },
  { address: "0xD0N0R", label: "Dana", balance: 700 },
  { address: "0xECHO5", label: "Echo Aid", balance: 1100 },
];

const initialReleases = [];

function createDonationId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatAmount(value) {
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [wallets] = useState(initialWallets);
  const [selectedWallet, setSelectedWallet] = useState(initialWallets[0].address);
  const [donations, setDonations] = useState([]);
  const [releases, setReleases] = useState(initialReleases);
  const [donationAmount, setDonationAmount] = useState("250");
  const [releaseAmount, setReleaseAmount] = useState("600");
  const [recipient, setRecipient] = useState("0xVICT1M57");
  const [releaseDescription, setReleaseDescription] = useState("");
  const [message, setMessage] = useState("Dummy relief credits are locked until NGO and government verification are both complete.");

  const totals = useMemo(() => {
    const donated = donations.reduce((sum, donation) => sum + donation.amount, 0);
    const released = releases
      .filter((release) => release.released)
      .reduce((sum, release) => sum + release.amount, 0);
    const ready = releases.filter(
      (release) => release.ngoVerified && release.governmentVerified && !release.released
    ).length;
    const pendingGovernment = releases.filter((release) => !release.governmentVerified && !release.released).length;
    const pendingNgo = releases.filter((release) => !release.ngoVerified && !release.released).length;

    return {
      donated,
      released,
      locked: donated - released,
      ready,
      pendingGovernment,
      pendingNgo,
    };
  }, [donations, releases]);

  const currentWallet = wallets.find((wallet) => wallet.address === selectedWallet);

  function handleDonate(event) {
    event.preventDefault();

    const amount = Number(donationAmount);

    if (!amount || amount <= 0) {
      setMessage("Donation amount must be greater than zero.");
      return;
    }

    setDonations((currentDonations) => [
      ...currentDonations,
      {
        id: createDonationId(),
        donor: currentWallet.address,
        label: currentWallet.label,
        amount,
      },
    ]);

    setMessage(`${currentWallet.label} donated ${formatAmount(amount)} ${CURRENCY}. The donation was added to the public ledger.`);
  }

  function donateFromAllWallets() {
    const amounts = [300, 250, 400, 150, 350];

    setDonations((currentDonations) => [
      ...currentDonations,
      ...wallets.map((wallet, index) => ({
        id: `${createDonationId()}-${index}`,
        donor: wallet.address,
        label: wallet.label,
        amount: amounts[index],
      })),
    ]);

    setMessage("Received donations from 5 wallets. Release remains locked until both verifiers approve.");
  }

  function createRelease(event) {
    event.preventDefault();
    const amount = Number(releaseAmount);

    if (!recipient.trim()) {
      setMessage("Recipient address is required.");
      return;
    }

    if (!releaseDescription.trim()) {
      setMessage("Release description is required.");
      return;
    }

    if (!amount || amount <= 0) {
      setMessage("Release amount must be greater than zero.");
      return;
    }

    setReleases((currentReleases) => [
      ...currentReleases,
      {
        id: currentReleases.length,
        crisisId: 57,
        description: releaseDescription.trim(),
        recipient: recipient.trim(),
        amount,
        ngoVerified: false,
        governmentVerified: false,
        released: false,
      },
    ]);

    setReleaseDescription("");
    setMessage("NGO created a crisis release request. It still needs both approvals.");
  }

  function verifyRelease(id, verifier) {
    setReleases((currentReleases) =>
      currentReleases.map((release) => {
        if (release.id !== id || release.released) {
          return release;
        }

        return verifier === "ngo"
          ? { ...release, ngoVerified: true }
          : { ...release, governmentVerified: true };
      })
    );

    setMessage(verifier === "ngo" ? "NGO verifier approved the crisis." : "Government verifier approved the crisis.");
  }

  function releaseFunds(id, actor = NGO_ADDRESS) {
    const release = releases.find((item) => item.id === id);

    if (actor !== NGO_ADDRESS) {
      setMessage(`Release rejected: ${NON_VERIFIER} is not an authorized verifier.`);
      return;
    }

    if (!release.ngoVerified || !release.governmentVerified) {
      setMessage("Release rejected: both NGO and government must verify first.");
      return;
    }

    if (release.amount > totals.locked) {
      setMessage("Release rejected: the fund does not have enough locked dummy credits.");
      return;
    }

    setReleases((currentReleases) =>
      currentReleases.map((item) => (item.id === id ? { ...item, released: true } : item))
    );
    setMessage(`Released ${formatAmount(release.amount)} ${CURRENCY} to ${release.recipient}.`);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="kicker">Emergency Fund Console</span>
          <h1>DisasterRelief Dual-Key Fund</h1>
          <div className="hero-stats" aria-label="Fund status">
            <span>{releases.length} release requests</span>
            <span>{totals.ready} ready</span>
            <span>{donations.length} donations</span>
          </div>
        </div>
        <div className="wallet-panel">
          <span>Currency</span>
          <strong>{CURRENCY}</strong>
          <span>NGO verifier</span>
          <strong>{NGO_ADDRESS}</strong>
          <span>Government verifier</span>
          <strong>{GOVERNMENT_ADDRESS}</strong>
        </div>
      </header>

      <nav className="tabs" aria-label="Main pages">
        {pages.map((page) => (
          <button
            key={page.id}
            type="button"
            className={activePage === page.id ? "active" : ""}
            onClick={() => setActivePage(page.id)}
          >
            {page.label}
          </button>
        ))}
      </nav>

      {message && <p className="notice">{message}</p>}

      {activePage === "dashboard" && (
        <section className="page-grid">
          <div className="metric-list">
            <article className="metric donation">
              <span>Total Dummy Donations</span>
              <strong>{formatAmount(totals.donated)} {CURRENCY}</strong>
            </article>
            <article className="metric balance">
              <span>Locked Fund Balance</span>
              <strong>{formatAmount(totals.locked)} {CURRENCY}</strong>
            </article>
            <article className="metric admin">
              <span>Released to Victims</span>
              <strong>{formatAmount(totals.released)} {CURRENCY}</strong>
            </article>
            <article className="metric review">
              <span>Awaiting Review</span>
              <strong>{totals.pendingNgo + totals.pendingGovernment}</strong>
            </article>
          </div>

          <ReleaseList releases={releases} onRelease={releaseFunds} mode="overview" />
        </section>
      )}

      {activePage === "donate" && (
        <section className="admin-layout">
          <div className="tool-panel">
            <div className="section-title">
              <h2>Public Donation</h2>
              <span>No restriction</span>
            </div>
            <WalletRoster wallets={wallets} selectedWallet={selectedWallet} />
            <form onSubmit={handleDonate}>
              <label htmlFor="wallet">Donor wallet</label>
              <select id="wallet" value={selectedWallet} onChange={(event) => setSelectedWallet(event.target.value)}>
                {wallets.map((wallet) => (
                  <option key={wallet.address} value={wallet.address}>
                    {wallet.label} - {wallet.address}
                  </option>
                ))}
              </select>

              <label htmlFor="donationAmount">Amount</label>
              <div className="input-row">
                <input
                  id="donationAmount"
                  min="0"
                  step="1"
                  type="number"
                  value={donationAmount}
                  onChange={(event) => setDonationAmount(event.target.value)}
                  required
                />
                <span>{CURRENCY}</span>
              </div>
              <button type="submit">Donate</button>
              <button type="button" className="secondary" onClick={donateFromAllWallets}>Receive From 5 Wallets</button>
            </form>
          </div>

          <DonationLedger donations={donations} />
        </section>
      )}

      {activePage === "new-release" && (
        <section className="admin-layout">
          <div className="tool-panel">
            <div className="section-title">
              <h2>New Release</h2>
              <span>Describe the need</span>
            </div>
            <form onSubmit={createRelease}>
              <label htmlFor="releaseDescription">Description</label>
              <input
                id="releaseDescription"
                type="text"
                value={releaseDescription}
                onChange={(event) => setReleaseDescription(event.target.value)}
                placeholder="Emergency food, shelter, and medical supplies"
                required
              />

              <label htmlFor="recipient">Victim recipient</label>
              <input
                id="recipient"
                type="text"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                required
              />

              <label htmlFor="releaseAmount">Amount</label>
              <div className="input-row">
                <input
                  id="releaseAmount"
                  min="0"
                  step="1"
                  type="number"
                  value={releaseAmount}
                  onChange={(event) => setReleaseAmount(event.target.value)}
                  required
                />
                <span>{CURRENCY}</span>
              </div>

              <button type="submit">Create Release</button>
            </form>
          </div>

          <ReleaseList releases={releases} onVerify={verifyRelease} onRelease={releaseFunds} mode="ngo" />
        </section>
      )}

      {activePage === "ngo" && (
        <section className="admin-layout">
          <div className="tool-panel identity-panel">
            <div className="section-title">
              <h2>NGO Verification Desk</h2>
              <span>{NGO_ADDRESS}</span>
            </div>
            <div className="desk-summary">
              <span>Pending NGO</span>
              <strong>{totals.pendingNgo}</strong>
            </div>
          </div>

          <ReleaseList releases={releases} onVerify={verifyRelease} onRelease={releaseFunds} mode="ngo" />
        </section>
      )}

      {activePage === "government" && (
        <section className="admin-layout">
          <div className="tool-panel identity-panel">
            <div className="section-title">
              <h2>Government Verification Desk</h2>
              <span>{GOVERNMENT_ADDRESS}</span>
            </div>
            <div className="identity-stack">
              <div>
                <span>Pending Review</span>
                <strong>{totals.pendingGovernment}</strong>
              </div>
              <div>
                <span>Verified</span>
                <strong>{releases.filter((release) => release.governmentVerified).length}</strong>
              </div>
            </div>
          </div>

          <ReleaseList releases={releases} onVerify={verifyRelease} mode="government" />
        </section>
      )}
    </main>
  );
}

function WalletRoster({ wallets, selectedWallet }) {
  return (
    <div className="wallet-roster" aria-label="Wallet balances">
      {wallets.map((wallet) => (
        <div className={wallet.address === selectedWallet ? "wallet-chip selected" : "wallet-chip"} key={wallet.address}>
          <span>{wallet.label}</span>
          <strong>{wallet.address}</strong>
        </div>
      ))}
    </div>
  );
}

function DonationLedger({ donations }) {
  return (
    <section className="milestones">
      <div className="section-title">
        <h2>Transparent Donation Ledger</h2>
        <span>{donations.length} records</span>
      </div>

      {donations.length === 0 ? (
        <p className="empty-state">No dummy donations yet.</p>
      ) : (
        <div className="milestone-list">
          {donations.map((donation) => (
            <article className="milestone-card" key={donation.id}>
              <div>
                <span className="milestone-id">{donation.donor}</span>
                <h3>{donation.label}</h3>
                <p>{formatAmount(donation.amount)} {CURRENCY}</p>
              </div>
              <span className="badge approved">Received</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ReleaseList({ releases, onVerify, onRelease, mode }) {
  const heading = mode === "government" ? "Government Queue" : mode === "ngo" ? "NGO Release Queue" : "Crisis Releases";

  return (
    <section className="milestones">
      <div className="section-title">
        <h2>{heading}</h2>
        <span>{releases.length} total</span>
      </div>

      {releases.length === 0 ? (
        <p className="empty-state">No release requests yet.</p>
      ) : (
        <div className="milestone-list">
          {releases.map((release) => (
            <article className="milestone-card" key={release.id}>
              <div>
                <span className="milestone-id">Crisis #{release.crisisId} / Release #{release.id}</span>
                <h3>{release.description}</h3>
                <p className="recipient-line">{release.recipient}</p>
                <p>{formatAmount(release.amount)} {CURRENCY}</p>
                <ApprovalProgress release={release} />
                <div className="approval-row">
                  <StatusBadge active={release.ngoVerified} label="NGO" />
                  <StatusBadge active={release.governmentVerified} label="Government" />
                  {release.released && <span className="badge released">Released</span>}
                </div>
              </div>

              <div className="milestone-actions">
                {mode === "ngo" && (
                  <>
                    <button type="button" disabled={release.ngoVerified || release.released} onClick={() => onVerify(release.id, "ngo")}>
                      NGO Verify
                    </button>
                    <button type="button" disabled={release.released} onClick={() => onRelease(release.id)}>
                      Release
                    </button>
                    <button type="button" className="secondary" disabled={release.released} onClick={() => onRelease(release.id, NON_VERIFIER)}>
                      Try Non-Verifier
                    </button>
                  </>
                )}
                {mode === "government" && (
                  <button
                    type="button"
                    disabled={release.governmentVerified || release.released}
                    onClick={() => onVerify(release.id, "government")}
                  >
                    Government Verify
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ApprovalProgress({ release }) {
  const completedSteps = Number(release.ngoVerified) + Number(release.governmentVerified) + Number(release.released);
  const percent = (completedSteps / 3) * 100;

  return (
    <div className="progress-track" aria-label="Release progress">
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}

function StatusBadge({ active, label }) {
  return <span className={active ? "badge approved" : "badge pending"}>{label}</span>;
}
