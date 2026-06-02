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
// Helper: ทบต้นรายปี — ปีต่อปีเท่านั้น ไม่ทบต้นรายเดือน
// principal = เงินต้น
// annualRate = อัตราดอกเบี้ยต่อปี (%)
// years     = จำนวนปี (เช่น 2.5)
// ---------------------------------------------------------------------------
function calcAnnualCompound(principal, annualRate, years) {
  return principal * Math.pow(1 + annualRate / 100, years);
}

// ---------------------------------------------------------------------------
// Helper: สร้างตารางผ่อนรายเดือน (เงินต้น + ดอกเบี้ยทบต้นรายปี หารเท่าๆ กัน)
// ---------------------------------------------------------------------------
function calcSchedule(principal, annualRate, months, startDate) {
  const years           = months / 12;
  const totalWithInt    = calcAnnualCompound(principal, annualRate, years);
  const totalInterest   = totalWithInt - principal;
  const monthlyPayment  = round(totalWithInt / months);
  const monthlyInterest = round(totalInterest / months);
  const monthlyPrincipal = round(principal / months);

  let balance = round(totalWithInt);
  const schedule = [];

  for (let i = 1; i <= months; i++) {
    balance = round(balance - monthlyPayment);
    if (balance < 0.01) balance = 0;

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      month:      i,
      due_date:   dueDate.toISOString().split("T")[0],
      payment:    monthlyPayment,
      principal:  monthlyPrincipal,
      interest:   monthlyInterest,
      balance:    balance,
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
    const years = months / 12; // แปลงเดือน → ปี

    if (debt.payment_type === "monthly") {
      // ผ่อนรายเดือน: ทบต้นรายปี แล้วหารเท่าๆ กันทุกงวด
      totalWithInterest = round(calcAnnualCompound(principal, rate, years));
      totalInterest     = round(totalWithInterest - principal);
      monthlyPayment    = round(totalWithInterest / months);
      schedule          = calcSchedule(principal, rate, months, debt.date);
    } else {
      // ทีเดียวจบ: ทบต้นรายปีเท่านั้น
      totalWithInterest = round(calcAnnualCompound(principal, rate, years));
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
