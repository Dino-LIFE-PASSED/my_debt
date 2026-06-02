import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3009";

function AddPaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    amount: "",
    date: "",
    note: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("debtId", id);
      formData.append("amount", form.amount);
      formData.append("date", form.date);
      formData.append("note", form.note);
      if (imageFile) formData.append("image", imageFile);

      const response = await fetch(`${API_URL}/api/payments`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      navigate(`/debt/${id}`);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <Link to={`/debt/${id}`} className="back-btn">←</Link>
        <h1 className="page-title">Add Payment</h1>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Payment Amount (THB)</label>
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
            <label>Payment Date</label>
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
            <input
              type="text"
              name="note"
              value={form.note}
              onChange={handleChange}
              placeholder="e.g. Bank transfer, PromptPay"
            />
          </div>

          <div className="form-group">
            <label>Payment Proof (optional)</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="image-preview" />
            )}
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn btn-success btn-full" disabled={submitting}>
            {submitting ? "Saving..." : "Save Payment"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddPaymentPage;
