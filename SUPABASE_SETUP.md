# Supabase Setup Guide — KongBeng AI

ขั้นตอนการสร้างและตั้งค่า Supabase สำหรับ KongBeng AI

---

## Step 1: สร้าง Supabase Project

1. ไปที่ **https://supabase.com** → คลิก **Start your project**
2. Login ด้วย GitHub
3. คลิก **New project**
4. กรอกข้อมูล:
   - **Name**: `kongbeng-ai`
   - **Database Password**: ตั้งรหัสผ่านให้แข็งแกร่ง (บันทึกไว้!)
   - **Region**: **Southeast Asia (Singapore)** — ใกล้ที่สุดสำหรับไทย
5. คลิก **Create new project** → รอ ~2 นาที

---

## Step 2: หา API Keys

เมื่อ project พร้อมแล้ว:

1. ไปที่ **Settings** (ซ้ายล่าง) → **API**
2. คัดลอกค่าเหล่านี้:

```
Project URL:   https://xxxxxxxxxxxxx.supabase.co
anon public:   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 3: หา Database Connection Strings

1. ไปที่ **Settings** → **Database**
2. เลื่อนลงหา **Connection string** → เลือก **URI**
3. คัดลอก 2 URLs:

**Transaction pooler (port 6543)** — ใช้สำหรับ `DATABASE_URL`:
```
postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Direct connection (port 5432)** — ใช้สำหรับ `DIRECT_URL`:
```
postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

---

## Step 4: อัปเดต .env (local dev)

แก้ไขไฟล์ `.env` ใน project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL="postgresql://postgres.xxx:YOUR-PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:YOUR-PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
TYPHOON_API_KEY=sk-IzlF18VQKdgkCEIcRaqOgzM6tgIKwXrATbGg4IXL2vuCwTae
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 5: Push Prisma Schema → Supabase

รัน command นี้ครั้งเดียว (หรือทุกครั้งที่แก้ schema):

```bash
# Option A: รันผ่าน Docker (ถ้า app รันอยู่)
docker compose exec app npx prisma db push

# Option B: รัน Node.js โดยตรง (ต้องติดตั้ง Node.js)
npm run db:push
```

คุณจะเห็น:
```
✔ Your database is now in sync with your Prisma schema. Done in 291ms
```

---

## Step 6: สร้าง Admin User

1. ไปที่ **Supabase Dashboard** → **Authentication** → **Users**
2. คลิก **Add user** → **Create new user**
3. กรอก:
   - **Email**: อีเมลของคุณ
   - **Password**: รหัสผ่าน (จำไว้เพื่อ login `/admin`)
4. คลิก **Create user**

---

## Step 7: ทดสอบ Login

1. เปิด http://localhost:3000/login
2. Login ด้วย email + password ที่สร้างไว้
3. จะ redirect ไปยัง `/admin` dashboard

---

## Step 8: รัน Docker ด้วย Supabase (Production)

เมื่อมี Supabase credentials แล้ว ให้ rebuild Docker:

```bash
# อัปเดต .env ด้วยค่าจริง ก่อน rebuild
docker compose down
docker compose up --build -d
```

ตรวจสอบ logs:
```bash
docker compose logs -f app
docker compose logs -f migrate
```

---

## Step 9: Row Level Security (RLS) — สำหรับ Production

เพิ่มความปลอดภัยใน Supabase Dashboard → **Table Editor** → เลือกตาราง → **RLS**:

```sql
-- ให้ทุกคนอ่าน stocks ที่ published
CREATE POLICY "Public can read published stocks"
ON public.stocks FOR SELECT
USING (is_published = true);

-- Prisma ใช้ service role ในการ write (ผ่าน DATABASE_URL)
```

---

## Quick Reference — Docker Commands

```bash
# เริ่ม containers
docker compose up -d

# ดู logs
docker compose logs -f

# หยุด containers
docker compose down

# Rebuild หลังแก้โค้ด
docker compose build app && docker compose up -d

# เข้า shell ใน container
docker compose exec app sh

# ดู containers ที่รันอยู่
docker ps
```

---

## ปัญหาที่พบบ่อย

| ปัญหา | วิธีแก้ |
|---|---|
| `Can't reach database` | ตรวจสอบว่า Docker containers รันอยู่: `docker ps` |
| `Invalid JWT` | ตรวจสอบ `SUPABASE_ANON_KEY` ใน `.env` |
| Login ไม่ผ่าน | ตรวจสอบว่า user ถูกสร้างใน Supabase Auth |
| Schema ไม่ sync | รัน `npx prisma db push` ใหม่ |
| Port 3000 ถูกใช้งาน | เปลี่ยน port ใน `docker-compose.yml`: `"3001:3000"` |
