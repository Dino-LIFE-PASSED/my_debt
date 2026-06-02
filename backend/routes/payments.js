// ===== routes/payments.js =====
// จัดการ API เกี่ยวกับการชำระหนี้ (เพิ่มหลักฐาน, ลบ)
// รูปภาพจะถูกอัพโหลดไปยัง Supabase Storage

const express = require("express");
const multer = require("multer");
const supabase = require("../supabase");

const router = express.Router();

// ใช้ memoryStorage เพราะเราจะส่งรูปต่อไปยัง Supabase Storage
// (ไม่บันทึกลงเครื่องอีกต่อไป)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("รองรับเฉพาะไฟล์รูปภาพเท่านั้น"), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // จำกัด 5MB
});

// POST /api/payments - บันทึกหลักฐานการชำระหนี้
router.post("/", upload.single("image"), async (req, res) => {
  const { debtId, amount, date, note } = req.body;

  if (!debtId || !amount || !date) {
    return res
      .status(400)
      .json({ message: "กรุณาระบุ ID หนี้, จำนวนเงิน, และวันที่" });
  }

  // ตรวจสอบว่าหนี้นี้มีอยู่จริง
  const { data: debt } = await supabase
    .from("debts")
    .select("id")
    .eq("id", debtId)
    .single();

  if (!debt) {
    return res.status(404).json({ message: "ไม่พบรายการหนี้นี้" });
  }

  // อัพโหลดรูปภาพไปยัง Supabase Storage (ถ้ามีรูป)
  let imageUrl = null;

  if (req.file) {
    // ตั้งชื่อไฟล์ให้ไม่ซ้ำกัน
    const fileName = `${Date.now()}-${req.file.originalname}`;

    // อัพโหลดไฟล์ไปที่ bucket ชื่อ "payment-images"
    const { error: uploadError } = await supabase.storage
      .from("payment-images")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (uploadError) {
      return res.status(500).json({ message: "อัพโหลดรูปไม่สำเร็จ: " + uploadError.message });
    }

    // ดึง URL สาธารณะของรูปที่อัพโหลด
    const { data: urlData } = supabase.storage
      .from("payment-images")
      .getPublicUrl(fileName);

    imageUrl = urlData.publicUrl;
  }

  // บันทึกข้อมูลการชำระลง database
  const { data: newPayment, error } = await supabase
    .from("payments")
    .insert({
      debt_id: debtId,
      amount: Number(amount),
      date,
      note: note || "",
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.status(201).json(newPayment);
});

// DELETE /api/payments/:id - ลบหลักฐานการชำระ
router.delete("/:id", async (req, res) => {
  // ดึงข้อมูลการชำระก่อน เพื่อเอา URL รูปมาลบ
  const { data: payment } = await supabase
    .from("payments")
    .select("image_url")
    .eq("id", req.params.id)
    .single();

  // ลบรูปจาก Supabase Storage (ถ้ามี)
  if (payment?.image_url) {
    // ดึงชื่อไฟล์จาก URL เช่น ".../payment-images/12345-receipt.jpg" → "12345-receipt.jpg"
    const fileName = payment.image_url.split("/payment-images/")[1];
    await supabase.storage.from("payment-images").remove([fileName]);
  }

  // ลบข้อมูลจาก database
  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", req.params.id);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json({ message: "ลบหลักฐานการชำระสำเร็จ" });
});

module.exports = router;
