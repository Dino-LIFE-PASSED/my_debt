-- ===== supabase_schema.sql =====
-- วิธีใช้: เปิด Supabase Dashboard → SQL Editor → วาง SQL นี้แล้วกด Run

-- ตาราง: debts (รายการหนี้)
CREATE TABLE debts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lender        TEXT NOT NULL,                              -- ชื่อเจ้าหนี้
  amount        NUMERIC NOT NULL,                          -- เงินต้น (principal)
  description   TEXT DEFAULT '',                           -- หมายเหตุ
  date          DATE NOT NULL,                             -- วันที่ยืม
  payment_type  TEXT DEFAULT 'lump_sum',                   -- 'lump_sum' หรือ 'monthly'
  interest_rate NUMERIC DEFAULT 0,                         -- ดอกเบี้ย % ต่อเดือน
  due_date      DATE,                                      -- วันครบกำหนด
  share_token   UUID DEFAULT gen_random_uuid() UNIQUE,     -- token สำหรับแชร์ link ให้เจ้าหนี้
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ถ้ามีตาราง debts อยู่แล้ว ให้ run คำสั่งเหล่านี้แทน:
-- ALTER TABLE debts ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid() UNIQUE;
-- ALTER TABLE debts ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'lump_sum';
-- ALTER TABLE debts ADD COLUMN IF NOT EXISTS interest_rate NUMERIC DEFAULT 0;
-- ALTER TABLE debts ADD COLUMN IF NOT EXISTS due_date DATE;

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
