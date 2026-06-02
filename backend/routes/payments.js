// ===== routes/payments.js =====
// รูปภาพเก็บใน /app/uploads บน server (persistent volume)

const express = require("express");
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const supabase = require("../supabase");

const router = express.Router();

// โฟลเดอร์เก็บรูป — ใช้ path นี้ผูกกับ Persistent Volume ใน Dokploy
const UPLOAD_DIR = path.join(__dirname, "../uploads");

// สร้างโฟลเดอร์ถ้ายังไม่มี
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ตั้งค่า multer ให้บันทึกไฟล์ลง disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Images only"), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// POST /api/payments — บันทึกการชำระ + อัพโหลดรูป
router.post("/", upload.single("image"), async (req, res) => {
  const { debtId, amount, date, note } = req.body;

  if (!debtId || !amount || !date) {
    return res.status(400).json({ message: "Please fill in debt ID, amount, and date" });
  }

  const { data: debt } = await supabase
    .from("debts").select("id").eq("id", debtId).single();

  if (!debt) return res.status(404).json({ message: "Debt not found" });

  // ถ้ามีรูป ให้เก็บ path สัมพัทธ์ไว้ใน database
  // เช่น /uploads/1234567890-receipt.jpg
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const { data: newPayment, error } = await supabase
    .from("payments")
    .insert({ debt_id: debtId, amount: Number(amount), date, note: note || "", image_url: imageUrl })
    .select()
    .single();

  if (error) return res.status(500).json({ message: error.message });

  res.status(201).json(newPayment);
});

// DELETE /api/payments/:id — ลบการชำระ + ลบไฟล์รูปออกจาก disk
router.delete("/:id", async (req, res) => {
  const { data: payment } = await supabase
    .from("payments").select("image_url").eq("id", req.params.id).single();

  // ลบไฟล์รูปออกจาก disk ถ้ามี
  if (payment?.image_url) {
    const filePath = path.join(__dirname, "..", payment.image_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  const { error } = await supabase.from("payments").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ message: error.message });

  res.json({ message: "Payment deleted" });
});

module.exports = router;
