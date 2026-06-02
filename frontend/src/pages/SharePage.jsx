import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3009";

function SharePage() {
  const { token } = useParams();

  const [debt, setDebt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchDebt();
  }, [token]);

  async function fetchDebt() {
    try {
      const response = await fetch(`${API_URL}/api/share/${token}`);
      if (!response.ok) {
        setNotFound(true);
        return;
      }
      const data = await response.json();
      setDebt(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  function formatMoney(amount) {
    return Number(amount).toLocaleString("en-US");
  }

  if (loading) return (
    <div className="share-page-wrapper">
      <div className="loading">Loading...</div>
    </div>
  );

  if (notFound) return (
    <div className="share-page-wrapper">
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <div className="empty-state-text">Not Found<br />This link may be invalid or expired</div>
      </div>
    </div>
  );

  const percent = Math.min((debt.totalPaid / debt.amount) * 100, 100);

  return (
    <div className="share-page-wrapper">
      <div className="share-header">
        <div className="share-header-icon">💸</div>
        <div className="share-header-title">Debt Status</div>
        <div className="share-header-sub">Updated in real-time</div>
      </div>

      <div className="container" style={{ paddingTop: "20px" }}>
        <div className="amount-display">
          <div className="amount-display-label">
            {debt.isPaid ? "Fully Paid" : "Remaining Balance"}
          </div>
          <div
            className="amount-display-number"
            style={{ color: debt.isPaid ? "var(--success)" : "var(--danger)" }}
          >
            ฿{formatMoney(debt.remaining)}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-card-title">{debt.lender}</span>
            <span className={`badge ${debt.isPaid ? "badge-paid" : "badge-pending"}`}>
              {debt.isPaid ? "Paid" : "Unpaid"}
            </span>
          </div>

          <div className="summary-row">
            <span className="summary-row-label">Borrow Date</span>
            <span className="summary-row-value">{debt.date}</span>
          </div>
          {debt.description && (
            <div className="summary-row">
              <span className="summary-row-label">Notes</span>
              <span className="summary-row-value">{debt.description}</span>
            </div>
          )}
          <div className="summary-row">
            <span className="summary-row-label">Total Amount</span>
            <span className="summary-row-value text-red">฿{formatMoney(debt.amount)}</span>
          </div>
          <div className="summary-row">
            <span className="summary-row-label">Total Paid</span>
            <span className="summary-row-value text-green">฿{formatMoney(debt.totalPaid)}</span>
          </div>

          <div style={{ marginTop: "14px" }}>
            <div className="progress-bar" style={{ height: "8px" }}>
              <div className="progress-fill" style={{ width: `${percent}%` }} />
            </div>
            <div style={{ textAlign: "right", fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              {percent.toFixed(0)}% paid
            </div>
          </div>
        </div>

        <div className="section-title">
          Payment History ({debt.payments?.length || 0})
        </div>

        {debt.payments?.length === 0 ? (
          <div className="empty-state" style={{ padding: "32px 20px" }}>
            <div className="empty-state-icon">🧾</div>
            <div className="empty-state-text">No payments yet</div>
          </div>
        ) : (
          debt.payments?.map((payment) => (
            <div key={payment.id} className="payment-card">
              <div className="payment-card-header">
                <span className="payment-amount">+฿{formatMoney(payment.amount)}</span>
                <span className="payment-date">{payment.date}</span>
              </div>
              {payment.note && <p className="payment-note">{payment.note}</p>}
              {payment.image_url && (
                <img src={payment.image_url} alt="Payment proof" className="payment-image" />
              )}
            </div>
          ))
        )}

        <div className="share-footer">
          This page is read-only
        </div>
      </div>
    </div>
  );
}

export default SharePage;
