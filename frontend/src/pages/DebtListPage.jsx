import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3009";

function DebtListPage() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDebts();
  }, []);

  async function fetchDebts() {
    try {
      const response = await fetch(`${API_URL}/api/debts`);
      const data = await response.json();
      setDebts(data);
    } catch (error) {
      console.error("Error fetching debts:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatMoney(amount) {
    return Number(amount).toLocaleString("en-US");
  }

  const totalDebt = debts.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalPaid = debts.reduce((sum, d) => sum + Number(d.totalPaid), 0);
  const totalLeft = debts.reduce((sum, d) => sum + Number(d.remaining), 0);

  const pendingDebts = debts.filter((d) => !d.isPaid);
  const paidDebts    = debts.filter((d) => d.isPaid);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      {debts.length > 0 && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Debt</div>
            <div className="stat-value red">฿{formatMoney(totalDebt)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Paid</div>
            <div className="stat-value green">฿{formatMoney(totalPaid)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Remaining</div>
            <div className="stat-value blue">฿{formatMoney(totalLeft)}</div>
          </div>
        </div>
      )}

      <Link to="/add-debt" className="add-btn">
        + Add Debt
      </Link>

      {debts.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">No debts yet<br />Tap "+ Add Debt" to get started</div>
        </div>
      )}

      {pendingDebts.length > 0 && (
        <>
          <div className="section-label">Unpaid ({pendingDebts.length})</div>
          {pendingDebts.map((debt) => (
            <DebtCard key={debt.id} debt={debt} formatMoney={formatMoney} />
          ))}
        </>
      )}

      {paidDebts.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: "20px" }}>Paid ({paidDebts.length})</div>
          {paidDebts.map((debt) => (
            <DebtCard key={debt.id} debt={debt} formatMoney={formatMoney} />
          ))}
        </>
      )}
    </div>
  );
}

function DebtCard({ debt, formatMoney }) {
  const percent = Math.min((debt.totalPaid / debt.amount) * 100, 100);

  return (
    <Link to={`/debt/${debt.id}`} className="debt-card">
      <div className="debt-card-top">
        <div>
          <div className="debt-lender">{debt.lender}</div>
          {debt.description && (
            <div className="debt-desc">{debt.description}</div>
          )}
        </div>
        <div>
          <div className="debt-amount">฿{formatMoney(debt.amount)}</div>
          <div className="debt-date-text">{debt.date}</div>
        </div>
      </div>

      <div className="progress-wrap">
        <div className="progress-bar">
          <div
            className={`progress-fill ${debt.isPaid ? "full" : ""}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="progress-labels">
          <span>Paid ฿{formatMoney(debt.totalPaid)}</span>
          <span className={debt.isPaid ? "paid" : ""}>
            {debt.isPaid ? "Fully Paid" : `Left ฿${formatMoney(debt.remaining)}`}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default DebtListPage;
