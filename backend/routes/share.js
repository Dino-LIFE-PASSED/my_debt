// ===== routes/share.js =====
// API สำหรับหน้า share link - ใครก็เข้าดูได้ถ้ามี token (read-only)

const express = require("express");
const supabase = require("../supabase");

const router = express.Router();

// GET /api/share/:token - ดึงข้อมูลหนี้จาก share token
// ใครก็เรียกได้โดยไม่ต้อง login แค่ต้องมี token ถูกต้อง
router.get("/:token", async (req, res) => {
  // หา debt ที่ตรงกับ token นี้
  const { data: debt, error } = await supabase
    .from("debts")
    .select("*")
    .eq("share_token", req.params.token)
    .single();

  if (error || !debt) {
    return res.status(404).json({ message: "ไม่พบข้อมูล หรือ link นี้ไม่ถูกต้อง" });
  }

  // ดึงประวัติการชำระ
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, date, note, image_url")
    .eq("debt_id", debt.id)
    .order("date", { ascending: false });

  const totalPaid = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Number(debt.amount) - totalPaid;

  // ไม่ส่ง share_token กลับไป (ซ่อนไว้)
  const { share_token, ...debtData } = debt;

  res.json({
    ...debtData,
    payments: payments || [],
    totalPaid,
    remaining,
    isPaid: remaining <= 0,
  });
});

module.exports = router;
