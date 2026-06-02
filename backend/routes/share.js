// ===== routes/share.js =====
// API สำหรับหน้า share link - read-only, ใครก็เข้าดูได้ถ้ามี token

const express = require("express");
const supabase = require("../supabase");
// ใช้ enrichDebt จาก debts.js เพื่อไม่ต้องเขียน calculation ซ้ำ
const { enrichDebt } = require("./debts");

const router = express.Router();

router.get("/:token", async (req, res) => {
  const { data: debt, error } = await supabase
    .from("debts")
    .select("*")
    .eq("share_token", req.params.token)
    .single();

  if (error || !debt) {
    return res.status(404).json({ message: "Link not found or invalid" });
  }

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, date, note, image_url")
    .eq("debt_id", debt.id)
    .order("date", { ascending: false });

  const { share_token, ...debtData } = debt;
  const enriched = enrichDebt(debtData, payments || []);

  res.json({ ...enriched, payments: payments || [] });
});

module.exports = router;
