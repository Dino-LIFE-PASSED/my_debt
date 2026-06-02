// ===== routes/debts.js =====

const express = require("express");
const supabase = require("../supabase");

const router = express.Router();

// ---------------------------------------------------------------------------
// Helper: คำนวณจำนวนเดือนระหว่างสองวัน
// ---------------------------------------------------------------------------
function monthsBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end   = new Date(endDate);
  return (end.getFullYear() - start.getFullYear()) * 12
       + (end.getMonth() - start.getMonth());
}

// ---------------------------------------------------------------------------
// Helper: คำนวณยอดผ่อนต่อเดือน (PMT Formula)
// principal   = เงินต้น
// monthlyRate = ดอกเบี้ยต่อเดือน (%) เช่น 1.5
// months      = จำนวนงวด
// ---------------------------------------------------------------------------
function calcPMT(principal, monthlyRate, months) {
  if (monthlyRate === 0) return principal / months;
  const r = monthlyRate / 100;
  return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
}

// ---------------------------------------------------------------------------
// Helper: สร้างตารางผ่อนชำระ (Amortization Schedule)
// ---------------------------------------------------------------------------
function calcSchedule(principal, monthlyRate, months, startDate) {
  const r   = monthlyRate / 100;
  const pmt = calcPMT(principal, monthlyRate, months);
  let balance = principal;
  const schedule = [];

  for (let i = 1; i <= months; i++) {
    const interest      = balance * r;
    const principalPart = pmt - interest;
    balance -= principalPart;
    if (balance < 0.01) balance = 0;

    // วันครบกำหนดของแต่ละงวด
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      month:      i,
      due_date:   dueDate.toISOString().split("T")[0],
      payment:    round(pmt),
      principal:  round(principalPart),
      interest:   round(interest),
      balance:    round(balance),
    });
  }
  return schedule;
}

function round(n) {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Helper: รวมข้อมูลและผลการคำนวณของหนี้แต่ละรายการ
// ---------------------------------------------------------------------------
function enrichDebt(debt, payments) {
  const totalPaid   = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const principal   = Number(debt.amount);
  const rate        = Number(debt.interest_rate) || 0;
  const hasInterest = rate > 0 && debt.due_date;
  const months      = hasInterest ? monthsBetween(debt.date, debt.due_date) : 0;

  let totalWithInterest = principal;
  let totalInterest     = 0;
  let monthlyPayment    = null;
  let schedule          = [];

  if (hasInterest && months > 0) {
    if (debt.payment_type === "monthly") {
      // ผ่อนรายเดือน: คำนวณด้วย PMT
      monthlyPayment    = round(calcPMT(principal, rate, months));
      totalWithInterest = round(monthlyPayment * months);
      totalInterest     = round(totalWithInterest - principal);
      schedule          = calcSchedule(principal, rate, months, debt.date);
    } else {
      // ทีเดียวจบ: Compound Interest
      totalWithInterest = round(principal * Math.pow(1 + rate / 100, months));
      totalInterest     = round(totalWithInterest - principal);
    }
  }

  const remaining = round(totalWithInterest - totalPaid);

  return {
    ...debt,
    monthsTotal:       months,
    totalInterest,
    totalWithInterest,
    monthlyPayment,
    schedule,
    totalPaid:         round(totalPaid),
    remaining,
    isPaid:            remaining <= 0,
  };
}

// ---------------------------------------------------------------------------
// GET /api/debts — รายการหนี้ทั้งหมด
// ---------------------------------------------------------------------------
router.get("/", async (req, res) => {
  const { data: debts, error } = await supabase
    .from("debts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ message: error.message });

  const { data: allPayments } = await supabase
    .from("payments")
    .select("debt_id, amount");

  const result = debts.map((debt) => {
    const payments = allPayments.filter((p) => p.debt_id === debt.id);
    return enrichDebt(debt, payments);
  });

  res.json(result);
});

// ---------------------------------------------------------------------------
// GET /api/debts/:id — หนี้รายการเดียว พร้อมประวัติชำระและตารางผ่อน
// ---------------------------------------------------------------------------
router.get("/:id", async (req, res) => {
  const { data: debt, error } = await supabase
    .from("debts")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error || !debt) return res.status(404).json({ message: "Debt not found" });

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("debt_id", debt.id)
    .order("date", { ascending: false });

  const enriched = enrichDebt(debt, payments || []);
  res.json({ ...enriched, payments: payments || [] });
});

// ---------------------------------------------------------------------------
// POST /api/debts — เพิ่มหนี้ใหม่
// ---------------------------------------------------------------------------
router.post("/", async (req, res) => {
  const { lender, amount, description, date, payment_type, interest_rate, due_date } = req.body;

  if (!lender || !amount || !date) {
    return res.status(400).json({ message: "Please fill in lender, amount, and date" });
  }

  const { data: newDebt, error } = await supabase
    .from("debts")
    .insert({
      lender,
      amount:        Number(amount),
      description:   description || "",
      date,
      payment_type:  payment_type || "lump_sum",
      interest_rate: Number(interest_rate) || 0,
      due_date:      due_date || null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ message: error.message });

  res.status(201).json(newDebt);
});

// ---------------------------------------------------------------------------
// DELETE /api/debts/:id — ลบหนี้ (payments ถูกลบอัตโนมัติ ON DELETE CASCADE)
// ---------------------------------------------------------------------------
router.delete("/:id", async (req, res) => {
  const { error } = await supabase.from("debts").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: "Debt deleted" });
});

module.exports = router;
module.exports.enrichDebt = enrichDebt;
