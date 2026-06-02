-- ===== supabase_schema.sql =====
-- วิธีใช้: เปิด Supabase Dashboard → SQL Editor → วาง SQL นี้แล้วกด Run

-- ตาราง: debts (รายการหนี้)
CREATE TABLE debts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lender      TEXT NOT NULL,                              -- ชื่อเจ้าหนี้
  amount      NUMERIC NOT NULL,                          -- จำนวนเงินที่ยืม
  description TEXT DEFAULT '',                           -- หมายเหตุ
  date        DATE NOT NULL,                             -- วันที่ยืม
  share_token UUID DEFAULT gen_random_uuid() UNIQUE,     -- token สำหรับแชร์ link ให้เจ้าหนี้
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ถ้ามีตาราง debts อยู่แล้ว ให้ run คำสั่งนี้แทน:
-- ALTER TABLE debts ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- ตาราง: payments (หลักฐานการชำระหนี้)
CREATE TABLE payments (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id   UUID REFERENCES debts(id) ON DELETE CASCADE, -- ถ้าลบหนี้ จะลบการชำระทั้งหมดด้วย
  amount    NUMERIC NOT NULL,     -- จำนวนเงินที่ชำระ
  date      DATE NOT NULL,        -- วันที่ชำระ
  note      TEXT DEFAULT '',      -- หมายเหตุ
  image_url TEXT,                 -- URL รูปหลักฐาน (จาก Supabase Storage)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
