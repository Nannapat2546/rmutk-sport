const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());
app.use(cors());

// 🌟 1. สร้าง Pool ไว้นอก Route เพื่อเชื่อมต่อ DB ค้างไว้ตลอดเวลา (Reuse Connection)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,                   // กำหนด Connection สูงสุด
  idleTimeoutMillis: 30000,  // ตัดเมื่อไม่มีการใช้นาน 30 วินาที
  connectionTimeoutMillis: 5000, // รอต่อ DB ไม่เกิน 5 วินาที
});

// 🌟 2. API Login Staff (ปรับปรุงประสิทธิภาพ)
app.post('/api/login-staff', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  try {
    // ดึงเฉพาะข้อมูลที่จำเป็น และใช้อีเมลตัวพิมพ์เล็ก
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

    // 🌟 3. ตรวจสอบรหัสผ่านแบบ Async (ไม่บล็อก Event Loop)
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    // ส่งข้อมูลผู้ใช้กลับไปฝั่งแอป
    delete user.password; // ไม่ส่ง password กลับไป
    return res.status(200).json({
      message: 'เข้าสู่ระบบสำเร็จ',
      user: user
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});
