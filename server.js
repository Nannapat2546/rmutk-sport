const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// 🌟 1. สร้าง Pool สำหรับเชื่อมต่อ PostgreSQL (Reuse Connection)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,                   // กำหนด Connection สูงสุด
  idleTimeoutMillis: 30000,  // ตัดเมื่อไม่มีการใช้นาน 30 วินาที
  connectionTimeoutMillis: 5000, // รอต่อ DB ไม่เกิน 5 วินาที
});

// 🌟 2. API Ping สำหรับปลุก Backend บน Render (Warmup Endpoint)
app.get('/api/ping', (req, res) => {
  return res.status(200).json({ status: 'ok', message: 'Server is awake' });
});

// 🌟 3. API Login Staff
app.post('/api/login-staff', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    
    const userQuery = await pool.query(
      'SELECT id, full_name, email, password, account_type, is_active FROM users WHERE LOWER(email) = $1 AND account_type = $2 LIMIT 1',
      [cleanEmail, 'staff']
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ message: 'ไม่พบบัญชีผู้ใช้ในระบบ' });
    }

    const user = userQuery.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ message: 'บัญชีนี้ถูกระงับการใช้งาน' });
    }

    // ตรวจสอบรหัสผ่านแบบ Async
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    // ส่งข้อมูลผู้ใช้กลับไปฝั่งแอป
    delete user.password;
    return res.status(200).json({
      message: 'เข้าสู่ระบบสำเร็จ',
      user: user
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

// =========================================================================
// 🌟 4. [สำคัญมาก] วาง API ตัวอื่นๆ เดิมทั้งหมดของคุณไว้ตรงนี้
// (เช่น /api/reports/dashboard, /api/admin/users, /api/notify-overdue ฯลฯ)
// =========================================================================




// =========================================================================
// 🌟 5. Catch-all Route สำหรับจัดการ 404 (ต้องอยู่ ล่างสุด ถัดจาก API ทั้งหมดเสมอ)
// =========================================================================
app.get('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// 🌟 6. เปิดรับ Port บน Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
