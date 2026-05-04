import React, { useMemo, useState } from "react";

const pages = ["home", "donate", "admin"];
const currencies = ["ETH", "BTC"];

const startingBalances = {
  ETH: 100,
  BTC: 5,
};

function formatAmount(value) {
  return Number(value).toFixed(4);
}

export default function App() {
  const [activePage, setActivePage] = useState("home");
  const [selectedCurrency, setSelectedCurrency] = useState("ETH");
  const [balances, setBalances] = useState(startingBalances);
  const [donations, setDonations] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [donationAmount, setDonationAmount] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [milestoneAmount, setMilestoneAmount] = useState("");
  const [message, setMessage] = useState("");

  const totals = useMemo(() => {
    return currencies.reduce((result, currency) => {
      const donated = donations
        .filter((donation) => donation.currency === currency)
        .reduce((sum, donation) => sum + donation.amount, 0);

      const released = milestones
        .filter((milestone) => milestone.currency === currency && milestone.released)
        .reduce((sum, milestone) => sum + milestone.amount, 0);

      result[currency] = {
        donated,
        balance: donated - released,
      };

      return result;
    }, {});
  }, [donations, milestones]);

  function handleDonate(event) {
    event.preventDefault();

    const amount = Number(donationAmount);

    if (!amount || amount <= 0) {
      setMessage("Donation amount must be greater than zero");
      return;
    }

    if (amount > balances[selectedCurrency]) {
      setMessage(`Not enough dummy ${selectedCurrency} balance`);
      return;
    }

    setDonations((currentDonations) => [
      ...currentDonations,
      {
        id: currentDonations.length,
        amount,
        currency: selectedCurrency,
        donor: "Demo Student",
      },
    ]);

    setBalances((currentBalances) => ({
      ...currentBalances,
      [selectedCurrency]: currentBalances[selectedCurrency] - amount,
    }));

    setDonationAmount("");
    setMessage(`Donation of ${formatAmount(amount)} ${selectedCurrency} recorded`);
  }

  function handleCreateMilestone(event) {
    event.preventDefault();

    const amount = Number(milestoneAmount);

    if (!milestoneDescription.trim()) {
      setMessage("Milestone description is required");
      return;
    }

    if (!amount || amount <= 0) {
      setMessage("Milestone amount must be greater than zero");
      return;
    }

    setMilestones((currentMilestones) => [
      ...currentMilestones,
      {
        id: currentMilestones.length,
        description: milestoneDescription.trim(),
        amount,
        currency: selectedCurrency,
        approved: false,
        released: false,
      },
    ]);

    setMilestoneDescription("");
    setMilestoneAmount("");
    setMessage("Milestone created");
  }

  function handleApproveMilestone(id) {
    setMilestones((currentMilestones) =>
      currentMilestones.map((milestone) =>
        milestone.id === id ? { ...milestone, approved: true } : milestone
      )
    );
    setMessage("Milestone approved");
  }

  function handleReleaseFunds(id) {
    const milestone = milestones.find((item) => item.id === id);

    if (!milestone) {
      setMessage("Milestone not found");
      return;
    }

    if (!milestone.approved) {
      setMessage("Approve the milestone before release");
      return;
    }

    if (milestone.released) {
      setMessage("Funds already released");
      return;
    }

    if (totals[milestone.currency].balance < milestone.amount) {
      setMessage(`Not enough donated ${milestone.currency} in the contract balance`);
      return;
    }

    setMilestones((currentMilestones) =>
      currentMilestones.map((item) =>
        item.id === id ? { ...item, released: true } : item
      )
    );
    setMessage(`Released ${formatAmount(milestone.amount)} ${milestone.currency}`);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Dummy blockchain demo</p>
          <h1>Charity Donation Tracker</h1>
        </div>
        <div className="wallet-panel">
          <span>Demo mode</span>
          <strong>No wallet required</strong>
          <select value={selectedCurrency} onChange={(event) => setSelectedCurrency(event.target.value)}>
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
      </header>

      <nav className="tabs" aria-label="Main pages">
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className={activePage === page ? "active" : ""}
            onClick={() => setActivePage(page)}
          >
            {page}
          </button>
        ))}
      </nav>

      {message && <p className="notice">{message}</p>}

      {activePage === "home" && (
        <section className="page-grid">
          <div className="metric-list">
            {currencies.map((currency) => (
              <React.Fragment key={currency}>
                <article className="metric donation">
                  <span>Total {currency} Donations</span>
                  <strong>{formatAmount(totals[currency].donated)} {currency}</strong>
                </article>
                <article className="metric balance">
                  <span>{currency} Contract Balance</span>
                  <strong>{formatAmount(totals[currency].balance)} {currency}</strong>
                </article>
              </React.Fragment>
            ))}
          </div>

          <MilestoneList
            milestones={milestones}
            onApprove={handleApproveMilestone}
            onRelease={handleReleaseFunds}
          />
        </section>
      )}

      {activePage === "donate" && (
        <section className="tool-panel narrow">
          <h2>Donate Dummy Currency</h2>
          <form onSubmit={handleDonate}>
            <label htmlFor="donationAmount">Amount</label>
            <div className="input-row">
              <input
                id="donationAmount"
                min="0"
                step="0.0001"
                type="number"
                value={donationAmount}
                onChange={(event) => setDonationAmount(event.target.value)}
                placeholder="0.10"
                required
              />
              <span>{selectedCurrency}</span>
            </div>
            <p className="helper-text">
              Demo balance: {formatAmount(balances[selectedCurrency])} {selectedCurrency}
            </p>
            <button type="submit">Donate</button>
          </form>
        </section>
      )}

      {activePage === "admin" && (
        <section className="admin-layout">
          <div className="tool-panel">
            <div className="section-title">
              <h2>Create Milestone</h2>
              <span>Admin demo</span>
            </div>
            <form onSubmit={handleCreateMilestone}>
              <label htmlFor="milestoneDescription">Description</label>
              <input
                id="milestoneDescription"
                type="text"
                value={milestoneDescription}
                onChange={(event) => setMilestoneDescription(event.target.value)}
                placeholder="Buy books for students"
                required
              />

              <label htmlFor="milestoneAmount">Amount</label>
              <div className="input-row">
                <input
                  id="milestoneAmount"
                  min="0"
                  step="0.0001"
                  type="number"
                  value={milestoneAmount}
                  onChange={(event) => setMilestoneAmount(event.target.value)}
                  placeholder="0.50"
                  required
                />
                <span>{selectedCurrency}</span>
              </div>

              <button type="submit">Create</button>
            </form>
          </div>

          <MilestoneList
            milestones={milestones}
            onApprove={handleApproveMilestone}
            onRelease={handleReleaseFunds}
          />
        </section>
      )}
    </main>
  );
}

function MilestoneList({ milestones, onApprove, onRelease }) {
  return (
    <section className="milestones">
      <div className="section-title">
        <h2>Milestones</h2>
        <span>{milestones.length} total</span>
      </div>

      {milestones.length === 0 ? (
        <p className="empty-state">No milestones yet.</p>
      ) : (
        <div className="milestone-list">
          {milestones.map((milestone) => (
            <article className="milestone-card" key={milestone.id}>
              <div>
                <span className="milestone-id">#{milestone.id}</span>
                <h3>{milestone.description}</h3>
                <p>{formatAmount(milestone.amount)} {milestone.currency}</p>
              </div>

              <div className="milestone-actions">
                <StatusBadge approved={milestone.approved} released={milestone.released} />
                {!milestone.approved && (
                  <button type="button" onClick={() => onApprove(milestone.id)}>
                    Approve
                  </button>
                )}
                {milestone.approved && !milestone.released && (
                  <button type="button" onClick={() => onRelease(milestone.id)}>
                    Release
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

function StatusBadge({ approved, released }) {
  if (released) {
    return <span className="badge released">Released</span>;
  }

  if (approved) {
    return <span className="badge approved">Approved</span>;
  }

  return <span className="badge pending">Pending</span>;
}
