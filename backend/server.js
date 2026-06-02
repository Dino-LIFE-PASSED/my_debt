// ===== server.js =====
// ไฟล์หลักของ Backend - จุดเริ่มต้นของ server

require("dotenv").config(); // โหลดค่าจากไฟล์ .env ก่อนสิ่งอื่น

const express = require("express");
const cors    = require("cors");
const path    = require("path");

// นำเข้า routes ที่แยกไว้
const debtsRouter    = require("./routes/debts");
const paymentsRouter = require("./routes/payments");
const shareRouter    = require("./routes/share");

const app = express();
const PORT = 3009;

// --- Middleware ---
// อนุญาตให้เฉพาะ Frontend domain เรียกใช้ API ได้
// FRONTEND_URL ใส่ใน .env เช่น https://debt.yourdomain.com
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173", // สำหรับ local dev
].filter(Boolean);

app.use(cors({ origin: allowedOrigins }));

// ทำให้ Express อ่าน JSON จาก request body ได้
app.use(express.json());

// Serve รูปภาพที่อัพโหลด — เข้าถึงได้ที่ /uploads/ชื่อไฟล์.jpg
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Routes ---
// ทุก request ที่ขึ้นต้นด้วย /api/debts จะไปที่ routes/debts.js
app.use("/api/debts", debtsRouter);

// ทุก request ที่ขึ้นต้นด้วย /api/payments จะไปที่ routes/payments.js
app.use("/api/payments", paymentsRouter);

// share link - เปิดให้สาธารณชนเข้าถึงได้โดยใช้ token
app.use("/api/share", shareRouter);

// Route ทดสอบว่า Server ทำงานได้
app.get("/", (req, res) => {
  res.json({ message: "Debt Tracker API พร้อมใช้งานแล้ว!" });
});

// เริ่มต้น server
app.listen(PORT, () => {
  console.log(`Server กำลังทำงานที่ http://localhost:${PORT}`);
});
