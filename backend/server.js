// ===== server.js =====
// ไฟล์หลักของ Backend - จุดเริ่มต้นของ server

require("dotenv").config(); // โหลดค่าจากไฟล์ .env ก่อนสิ่งอื่น

const express = require("express");
const cors = require("cors");

// นำเข้า routes ที่แยกไว้
const debtsRouter    = require("./routes/debts");
const paymentsRouter = require("./routes/payments");
const shareRouter    = require("./routes/share");

const app = express();
const PORT = 3009;

// --- Middleware ---
// อนุญาตให้ Frontend (React) เรียกใช้ API ได้
app.use(cors());

// ทำให้ Express อ่าน JSON จาก request body ได้
app.use(express.json());

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
