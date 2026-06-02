import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import DateInput from "../components/DateInput";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3009";

function AddDebtPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    lender:        "",
    amount:        "",
    description:   "",
    date:          "",
    payment_type:  "lump_sum",  // 'lump_sum' or 'monthly'
    interest_rate: "",          // % per year
    due_date:      "",          // due date
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  const hasInterest = Number(form.interest_rate) > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (hasInterest && !form.due_date) {
      setError("Please set a due date when interest rate is specified.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/debts`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }
      navigate("/");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <Link to="/" className="back-btn">←</Link>
        <h1 className="page-title">Add New Debt</h1>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>

          {/* ชื่อเจ้าหนี้ */}
          <div className="form-group">
            <label>Lender Name</label>
            <input
              type="text"
              name="lender"
              value={form.lender}
              onChange={handleChange}
              placeholder="e.g. John, Mom, Best Friend"
              required
            />
          </div>

          {/* จำนวนเงิน */}
          <div className="form-group">
            <label>Principal Amount (THB)</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="0"
              min="1"
              required
            />
          </div>

          {/* วันที่ยืม */}
          <div className="form-group">
            <label>Borrow Date</label>
            <DateInput
              value={form.date}
              onChange={(val) => setForm((p) => ({ ...p, date: val }))}
              placeholder="Select borrow date"
            />
          </div>

          {/* ประเภทการชำระ */}
          <div className="form-group">
            <label>Repayment Type</label>
            <div className="type-toggle">
              <button
                type="button"
                className={`type-btn ${form.payment_type === "lump_sum" ? "active" : ""}`}
                onClick={() => setForm((p) => ({ ...p, payment_type: "lump_sum" }))}
              >
                One-time
              </button>
              <button
                type="button"
                className={`type-btn ${form.payment_type === "monthly" ? "active" : ""}`}
                onClick={() => setForm((p) => ({ ...p, payment_type: "monthly" }))}
              >
                Monthly Installment
              </button>
            </div>
          </div>

          {/* ดอกเบี้ย */}
          <div className="form-group">
            <label>Interest Rate (% per year, 0 = no interest)</label>
            <input
              type="number"
              name="interest_rate"
              value={form.interest_rate}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>

          {/* วันครบกำหนด — แสดงเสมอ แต่ required เมื่อมีดอกเบี้ย */}
          <div className="form-group">
            <label>Due Date {hasInterest && <span className="required-star">*</span>}</label>
            <DateInput
              value={form.due_date}
              onChange={(val) => setForm((p) => ({ ...p, due_date: val }))}
              placeholder="Select due date"
            />
            {form.payment_type === "monthly" && form.date && form.due_date && (
              <div className="field-hint">
                {monthsBetween(form.date, form.due_date)} monthly installments
              </div>
            )}
          </div>

          {/* หมายเหตุ */}
          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="e.g. Car repair, Tuition fee"
              rows={2}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? "Saving..." : "Save Debt"}
          </button>
        </form>
      </div>
    </div>
  );
}

// helper เอาไว้แสดงจำนวนงวดใน form
function monthsBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end   = new Date(endDate);
  const m = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return m > 0 ? m : 0;
}

export default AddDebtPage;
