import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3009";

function AddDebtPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    lender: "",
    amount: "",
    description: "",
    date: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/debts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

          <div className="form-group">
            <label>Amount Borrowed (THB)</label>
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

          <div className="form-group">
            <label>Borrow Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="e.g. Car repair, Tuition fee"
              rows={3}
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

export default AddDebtPage;
