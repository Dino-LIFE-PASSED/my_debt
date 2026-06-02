// ===== supabase.js =====
// ไฟล์ตั้งค่าการเชื่อมต่อกับ Supabase
// ไฟล์อื่นจะ import supabase จากที่นี่

const { createClient } = require("@supabase/supabase-js");

// โหลดค่าจากไฟล์ .env
require("dotenv").config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// ตรวจสอบว่าใส่ค่าใน .env แล้วหรือยัง
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("กรุณาสร้างไฟล์ .env และใส่ค่า SUPABASE_URL และ SUPABASE_SERVICE_KEY");
  process.exit(1);
}

// สร้าง Supabase client ใช้ service key เพื่อให้มีสิทธิ์เต็มจาก backend
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

module.exports = supabase;
