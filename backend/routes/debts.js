// ===== routes/debts.js =====
// จัดการ API เกี่ยวกับหนี้สิน (เพิ่ม, ดู, ลบ)

const express = require("express");
const supabase = require("../supabase");

const router = express.Router();

// GET /api/debts - ดึงรายการหนี้ทั้งหมด
router.get("/", async (req, res) => {
  // ดึงหนี้ทั้งหมดจาก Supabase
  const { data: debts, error: debtsError } = await supabase
    .from("debts")
    .select("*")
    .order("created_at", { ascending: false });

  if (debtsError) {
    return res.status(500).json({ message: debtsError.message });
  }

  // ดึงการชำระทั้งหมดเพื่อคำนวณยอดคงเหลือ
  const { data: allPayments } = await supabase
    .from("payments")
    .select("debt_id, amount");

  // คำนวณยอดคงเหลือของแต่ละหนี้
  const debtsWithBalance = debts.map((debt) => {
    const debtPayments = allPayments.filter((p) => p.debt_id === debt.id);
    const totalPaid = debtPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(debt.amount) - totalPaid;

    return {
      ...debt,
      totalPaid,
      remaining,
      isPaid: remaining <= 0,
    };
  });

  res.json(debtsWithBalance);
});

// GET /api/debts/:id - ดึงข้อมูลหนี้รายการเดียว พร้อมประวัติการชำระ
router.get("/:id", async (req, res) => {
  // ดึงข้อมูลหนี้
  const { data: debt, error } = await supabase
    .from("debts")
    .select("*")
    .eq("id", req.params.id)
    .single(); // .single() คืนค่าเป็น object เดียว ไม่ใช่ array

  if (error || !debt) {
    return res.status(404).json({ message: "ไม่พบรายการหนี้นี้" });
  }

  // ดึงประวัติการชำระของหนี้นี้
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("debt_id", debt.id)
    .order("date", { ascending: false });

  const totalPaid = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Number(debt.amount) - totalPaid;

  res.json({
    ...debt,
    payments: payments || [],
    totalPaid,
    remaining,
    isPaid: remaining <= 0,
  });
});

// POST /api/debts - เพิ่มหนี้ใหม่
router.post("/", async (req, res) => {
  const { lender, amount, description, date } = req.body;

  if (!lender || !amount || !date) {
    return res
      .status(400)
      .json({ message: "กรุณาระบุชื่อเจ้าหนี้, จำนวนเงิน, และวันที่" });
  }

  // บันทึกลง Supabase
  const { data: newDebt, error } = await supabase
    .from("debts")
    .insert({ lender, amount: Number(amount), description: description || "", date })
    .select() // ให้ Supabase return ข้อมูลที่เพิ่งบันทึก
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.status(201).json(newDebt);
});

// DELETE /api/debts/:id - ลบรายการหนี้
router.delete("/:id", async (req, res) => {
  const { error } = await supabase
    .from("debts")
    .delete()
    .eq("id", req.params.id);

  // การชำระที่เกี่ยวข้องจะถูกลบอัตโนมัติ เพราะตั้ง ON DELETE CASCADE ใน Supabase

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json({ message: "ลบรายการหนี้สำเร็จ" });
});

module.exports = router;
