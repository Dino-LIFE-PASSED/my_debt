# บันทึกหนี้สิน (My Debt Tracker)

ระบบบันทึกหนี้สินส่วนตัว - จดหนี้ที่ยืมมา และบันทึกหลักฐานการชำระ

## Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: React (Vite)
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage (เก็บรูปหลักฐานการโอน)

## ขั้นตอนเริ่มต้น (ครั้งแรก)

### ขั้นที่ 1 - ตั้งค่า Supabase

1. สร้าง Project ที่ [supabase.com](https://supabase.com)

2. **สร้าง Tables**: ไปที่ **SQL Editor** → วางเนื้อหาจากไฟล์ `supabase_schema.sql` → กด **Run**

3. **สร้าง Storage Bucket**: ไปที่ **Storage** → **New bucket**
   - ชื่อ bucket: `payment-images`
   - เปิด **Public bucket** (เพื่อให้เข้าถึงรูปได้จาก URL)

4. **หา API Keys**: ไปที่ **Settings → API**
   - คัดลอก **Project URL**
   - คัดลอก **service_role** key (ไม่ใช่ anon key)

### ขั้นที่ 2 - ตั้งค่า Environment Variables

```bash
cd backend
cp .env.example .env
```

แก้ไขไฟล์ `.env`:
```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...  ← ใส่ service_role key
```

### ขั้นที่ 3 - ติดตั้ง packages

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

## วิธีรัน (ต้องเปิด 2 terminal)

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

เปิดเบราว์เซอร์ที่ **http://localhost:5173**

## โครงสร้างไฟล์

```
my_debt/
├── supabase_schema.sql       ← SQL สำหรับสร้าง Tables ใน Supabase
├── backend/
│   ├── .env.example          ← ตัวอย่างไฟล์ environment variables
│   ├── server.js             ← จุดเริ่มต้น Express server (port 3001)
│   ├── supabase.js           ← ตั้งค่าการเชื่อมต่อ Supabase
│   └── routes/
│       ├── debts.js          ← API จัดการหนี้สิน
│       └── payments.js       ← API จัดการการชำระ + อัพโหลดรูป
└── frontend/src/
    ├── App.jsx               ← Routes
    ├── pages/
    │   ├── DebtListPage      ← หน้าแรก รายการหนี้ทั้งหมด
    │   ├── AddDebtPage       ← เพิ่มหนี้ใหม่
    │   ├── DebtDetailPage    ← รายละเอียด + ประวัติการชำระ
    │   └── AddPaymentPage    ← บันทึกหลักฐานโอนเงิน
    └── components/
        └── Navbar.jsx
```

## API Endpoints

| Method | URL | คำอธิบาย |
|--------|-----|---------|
| GET | /api/debts | ดึงรายการหนี้ทั้งหมด |
| GET | /api/debts/:id | ดึงหนี้รายการเดียว + ประวัติชำระ |
| POST | /api/debts | เพิ่มหนี้ใหม่ |
| DELETE | /api/debts/:id | ลบหนี้ |
| POST | /api/payments | บันทึกการชำระ + อัพโหลดรูป |
| DELETE | /api/payments/:id | ลบการชำระ + ลบรูป |
