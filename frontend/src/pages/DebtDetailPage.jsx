import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3009";

function DebtDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [debt, setDebt]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => { fetchDebt(); }, [id]);

  async function fetchDebt() {
    try {
      const res = await fetch(`${API_URL}/api/debts/${id}`);
      if (!res.ok) throw new Error();
      setDebt(await res.json());
    } catch {
      console.error("Failed to load debt");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyShareLink() {
    const url = `${window.location.origin}/share/${debt.share_token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleDelete() {
    if (!confirm("Delete this debt? All payment records will also be removed.")) return;
    await fetch(`${API_URL}/api/debts/${id}`, { method: "DELETE" });
    navigate("/");
  }

  async function handleDeletePayment(paymentId) {
    if (!confirm("Delete this payment record?")) return;
    await fetch(`${API_URL}/api/payments/${paymentId}`, { method: "DELETE" });
    fetchDebt();
  }

  function fmt(n) { return Number(n).toLocaleString("en-US"); }

  if (loading) return <div className="loading">Loading...</div>;
  if (!debt)   return <div className="loading">Debt not found</div>;

  const percent = Math.min((debt.totalPaid / (debt.totalWithInterest || debt.amount)) * 100, 100);
  const hasInterest = Number(debt.interest_rate) > 0;

  return (
    <div>
      <div className="page-header">
        <Link to="/" className="back-btn">←</Link>
        <h1 className="page-title">Debt Details</h1>
      </div>

      {/* ยอดคงเหลือ */}
      <div className="amount-display">
        <div className="amount-display-label">
          {debt.isPaid ? "Fully Paid" : "Remaining Balance"}
        </div>
        <div className="amount-display-number"
          style={{ color: debt.isPaid ? "var(--success)" : "var(--danger)" }}>
          ฿{fmt(debt.remaining)}
        </div>
      </div>

      {/* Summary card */}
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
        {debt.due_date && (
          <div className="summary-row">
            <span className="summary-row-label">Due Date</span>
            <span className="summary-row-value">{debt.due_date}</span>
          </div>
        )}
        {debt.description && (
          <div className="summary-row">
            <span className="summary-row-label">Notes</span>
            <span className="summary-row-value">{debt.description}</span>
          </div>
        )}
        <div className="summary-row">
          <span className="summary-row-label">Repayment Type</span>
          <span className="summary-row-value">
            {debt.payment_type === "monthly" ? "Monthly Installment" : "One-time Payment"}
          </span>
        </div>
        <div className="summary-row">
          <span className="summary-row-label">Principal</span>
          <span className="summary-row-value">฿{fmt(debt.amount)}</span>
        </div>

        {hasInterest && (
          <>
            <div className="summary-row">
              <span className="summary-row-label">Interest Rate</span>
              <span className="summary-row-value">{debt.interest_rate}% / year</span>
            </div>
            <div className="summary-row">
              <span className="summary-row-label">Total Interest</span>
              <span className="summary-row-value text-red">+฿{fmt(debt.totalInterest)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-row-label">
                {debt.payment_type === "monthly" ? "Total of All Payments" : "Total Due"}
              </span>
              <span className="summary-row-value" style={{ fontWeight: 800 }}>฿{fmt(debt.totalWithInterest)}</span>
            </div>
            {debt.payment_type === "monthly" && debt.monthlyPayment && (
              <div className="summary-row">
                <span className="summary-row-label">Monthly Payment</span>
                <span className="summary-row-value" style={{ color: "var(--primary)", fontWeight: 700 }}>
                  ฿{fmt(debt.monthlyPayment)} × {debt.monthsTotal} months
                </span>
              </div>
            )}
          </>
        )}

        <div className="summary-row">
          <span className="summary-row-label">Total Paid</span>
          <span className="summary-row-value text-green">฿{fmt(debt.totalPaid)}</span>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: "14px" }}>
          <div className="progress-bar" style={{ height: "8px" }}>
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <div style={{ textAlign: "right", fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
            {percent.toFixed(0)}% paid
          </div>
        </div>
      </div>

      {/* Installment Schedule (Monthly type เท่านั้น) */}
      {debt.payment_type === "monthly" && debt.schedule?.length > 0 && (
        <div style={{ marginBottom: "8px" }}>
          <div className="section-title">Installment Schedule</div>
          <div className="schedule-table">
            <div className="schedule-header">
              <span>#</span>
              <span>Due Date</span>
              <span>Payment</span>
              <span>Interest</span>
              <span>Balance</span>
            </div>
            {debt.schedule.map((row) => (
              <div key={row.month} className="schedule-row">
                <span className="schedule-month">{row.month}</span>
                <span>{row.due_date}</span>
                <span style={{ fontWeight: 600 }}>฿{fmt(row.payment)}</span>
                <span style={{ color: "var(--danger)", fontSize: "12px" }}>฿{fmt(row.interest)}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>฿{fmt(row.balance)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Link */}
      <div className="share-box">
        <div className="share-box-left">
          <div className="share-box-title">Share with Lender</div>
          <div className="share-box-desc">Send this link so your lender can track payment status</div>
        </div>
        <button className={`btn-copy ${copied ? "btn-copy-done" : ""}`} onClick={handleCopyShareLink}>
          {copied ? "Copied ✓" : "Copy Link"}
        </button>
      </div>

      {/* ปุ่มชำระ */}
      {!debt.isPaid && (
        <Link to={`/debt/${id}/add-payment`} className="btn btn-success btn-full" style={{ marginBottom: "8px" }}>
          + Add Payment
        </Link>
      )}

      {/* ประวัติการชำระ */}
      <div className="section-title">Payment History ({debt.payments?.length || 0})</div>

      {debt.payments?.length === 0 ? (
        <div className="empty-state" style={{ padding: "32px 20px" }}>
          <div className="empty-state-icon">🧾</div>
          <div className="empty-state-text">No payments yet</div>
        </div>
      ) : (
        debt.payments?.map((payment) => (
          <div key={payment.id} className="payment-card">
            <div className="payment-card-header">
              <span className="payment-amount">+฿{fmt(payment.amount)}</span>
              <div className="payment-meta">
                <span className="payment-date">{payment.date}</span>
                <button className="btn-danger-outline" onClick={() => handleDeletePayment(payment.id)}>
                  Delete
                </button>
              </div>
            </div>
            {payment.note && <p className="payment-note">{payment.note}</p>}
            {payment.image_url && (
              <img src={`${API_URL}${payment.image_url}`} alt="Payment proof" className="payment-image" />
            )}
          </div>
        ))
      )}

      <div className="danger-zone">
        <div className="danger-zone-title">Danger Zone</div>
        <button className="btn-danger-full" onClick={handleDelete}>Delete This Debt</button>
      </div>
    </div>
  );
}

export default DebtDetailPage;
