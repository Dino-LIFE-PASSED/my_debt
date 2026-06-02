import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3009";

function DebtDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [debt, setDebt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchDebt();
  }, [id]);

  async function fetchDebt() {
    try {
      const response = await fetch(`${API_URL}/api/debts/${id}`);
      if (!response.ok) throw new Error("Not found");
      const data = await response.json();
      setDebt(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyShareLink() {
    const shareUrl = `${window.location.origin}/share/${debt.share_token}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleDelete() {
    if (!confirm("Delete this debt? All payment records will also be removed.")) return;
    try {
      await fetch(`${API_URL}/api/debts/${id}`, { method: "DELETE" });
      navigate("/");
    } catch {
      alert("Delete failed. Please try again.");
    }
  }

  async function handleDeletePayment(paymentId) {
    if (!confirm("Delete this payment record?")) return;
    try {
      await fetch(`${API_URL}/api/payments/${paymentId}`, { method: "DELETE" });
      fetchDebt();
    } catch {
      alert("Delete failed. Please try again.");
    }
  }

  function formatMoney(amount) {
    return Number(amount).toLocaleString("en-US");
  }

  if (loading) return <div className="loading">Loading...</div>;
  if (!debt)   return <div className="loading">Debt not found</div>;

  const percent = Math.min((debt.totalPaid / debt.amount) * 100, 100);

  return (
    <div>
      <div className="page-header">
        <Link to="/" className="back-btn">←</Link>
        <h1 className="page-title">Debt Details</h1>
      </div>

      <div className="amount-display">
        <div className="amount-display-label">
          {debt.isPaid ? "Fully Paid" : "Remaining Balance"}
        </div>
        <div className="amount-display-number" style={{ color: debt.isPaid ? "var(--success)" : "var(--danger)" }}>
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

      <div className="share-box">
        <div className="share-box-left">
          <div className="share-box-title">Share with Lender</div>
          <div className="share-box-desc">Send this link so your lender can track payment status</div>
        </div>
        <button
          className={`btn-copy ${copied ? "btn-copy-done" : ""}`}
          onClick={handleCopyShareLink}
        >
          {copied ? "Copied ✓" : "Copy Link"}
        </button>
      </div>

      {!debt.isPaid && (
        <Link to={`/debt/${id}/add-payment`} className="btn btn-success btn-full" style={{ marginBottom: "8px" }}>
          + Add Payment
        </Link>
      )}

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
              <div className="payment-meta">
                <span className="payment-date">{payment.date}</span>
                <button
                  className="btn-danger-outline"
                  onClick={() => handleDeletePayment(payment.id)}
                >
                  Delete
                </button>
              </div>
            </div>
            {payment.note && <p className="payment-note">{payment.note}</p>}
            {payment.image_url && (
              <img src={payment.image_url} alt="Payment proof" className="payment-image" />
            )}
          </div>
        ))
      )}

      <div className="danger-zone">
        <div className="danger-zone-title">Danger Zone</div>
        <button className="btn-danger-full" onClick={handleDelete}>
          Delete This Debt
        </button>
      </div>
    </div>
  );
}

export default DebtDetailPage;
