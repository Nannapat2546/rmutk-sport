const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt'); 
const nodemailer = require('nodemailer'); 
const { Resend } = require('resend');
const Tesseract = require('tesseract.js'); // 🌟 เพิ่มไลบรารี OCR ของจริง

const app = express();
app.use(cors());
// 📍 ตั้งค่า limit เป็น 50mb เพื่อให้รองรับการส่งรูปภาพ Base64 ขนาดใหญ่ได้
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ===========================================================================
// 🌟 เพิ่ม Route สำหรับหน้าแรก (แก้ Error Cannot GET /)
// ===========================================================================
app.get('/', (req, res) => {
  res.send('RMUTK Sport API is running!');
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ใช้สำหรับเชื่อมต่อบน Render อัตโนมัติ
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false, 
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'project65',
  password: process.env.DB_PASSWORD || '0807780787',
  port: process.env.DB_PORT || 5432,
});

// ===========================================================================
// 🌟 สคริปต์อัปเดตฐานข้อมูลอัตโนมัติ (เพิ่มตาราง Staffs หากไม่มี)
// ===========================================================================
const initDB = async () => {
  try {
    await pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS original_qty INT DEFAULT 0;`);
    await pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_partial BOOLEAN DEFAULT false;`);
    await pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS return_condition VARCHAR(50) DEFAULT 'ใช้งาน';`);
    await pool.query(`UPDATE transactions SET original_qty = qty WHERE original_qty = 0 OR original_qty IS NULL;`);
    
    // สร้างตาราง staffs หากยังไม่มี (สำหรับเพิ่มเจ้าหน้าที่)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staffs (
        id SERIAL PRIMARY KEY,
        account_id INT REFERENCES accounts(id) ON DELETE CASCADE,
        full_name VARCHAR(100) NOT NULL,
        department VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // สร้างตาราง admins หากยังไม่มี
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        account_id INT REFERENCES accounts(id) ON DELETE CASCADE,
        full_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Database schema verified.');
  } catch (err) {
    console.error('DB Init Error:', err.message);
  }
};
initDB();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const otpStorage = {};

// 🌟 ตั้งค่า Resend (ใช้ process.env.RESEND_API_KEY)
const resend = new Resend(process.env.RESEND_API_KEY);

// ===========================================================================
// [1] API สำหรับจัดการ หมวดหมู่อุปกรณ์ และ คลังอุปกรณ์
// ===========================================================================
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipment_categories ORDER BY created_at ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'ดึงข้อมูลหมวดหมู่ไม่สำเร็จ' });
  }
});

app.post('/api/categories', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query('INSERT INTO equipment_categories (name) VALUES ($1) RETURNING *', [name]);
    res.status(201).json({ message: 'เพิ่มหมวดหมู่สำเร็จ', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'ชื่อหมวดหมู่อาจซ้ำ หรือเกิดข้อผิดพลาด' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM equipment_categories WHERE id = $1', [req.params.id]);
    res.status(200).json({ message: 'ลบหมวดหมู่สำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถลบได้ เนื่องจากอาจมีอุปกรณ์ใช้งานหมวดหมู่นี้อยู่' });
  }
});

app.get('/api/inventory', async (req, res) => {
  try {
    const query = `
      SELECT 
        i.id, 
        i.item_name, 
        i.image_url,
        c.name as category_name,
        (i.stock - 
         COALESCE((SELECT SUM(qty) FROM transactions t WHERE t.inventory_id = i.id AND t.return_date IS NULL), 0) - 
         COALESCE((SELECT SUM(qty) FROM transactions t WHERE t.inventory_id = i.id AND t.return_condition = 'ชำรุด'), 0)
        ) as stock,
        (i.stock - 
         COALESCE((SELECT SUM(qty) FROM transactions t WHERE t.inventory_id = i.id AND t.return_date IS NULL), 0) - 
         COALESCE((SELECT SUM(qty) FROM transactions t WHERE t.inventory_id = i.id AND t.return_condition = 'ชำรุด'), 0)
        ) as available_qty
      FROM inventory i
      LEFT JOIN equipment_categories c ON i.category_id = c.id
      WHERE i.active = true OR i.active IS NULL
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) { 
    res.status(500).json({ message: 'ดึงข้อมูลคลังอุปกรณ์ไม่สำเร็จ' }); 
  }
});

app.post('/api/inventory', async (req, res) => {
  const { equipment_code, category_id, item_name, stock, status, image_url } = req.body;
  try {
    const query = `
      INSERT INTO inventory (equipment_code, category_id, item_name, stock, status, image_url)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `;
    const values = [equipment_code, category_id, item_name, stock, status, image_url];
    const result = await pool.query(query, values);
    res.status(201).json({ message: 'เพิ่มอุปกรณ์ใหม่สำเร็จ', data: result.rows[0] });
  } catch (error) {
    console.error("Insert Inventory Error:", error);
    res.status(500).json({ message: 'ไม่สามารถเพิ่มอุปกรณ์ได้ รหัสอุปกรณ์อาจซ้ำกับที่มีอยู่แล้ว' });
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `DELETE FROM inventory WHERE id = $1`;
    await pool.query(query, [id]);
    res.status(200).json({ message: 'ลบอุปกรณ์สำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'ลบอุปกรณ์ไม่สำเร็จ อาจมีรายการยืม-คืนค้างอยู่' });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  const { equipment_code, category_id, item_name, stock, status, image_url } = req.body;
  try {
    const query = `
      UPDATE inventory 
      SET equipment_code = $1, category_id = $2, item_name = $3, stock = $4, status = $5, image_url = $6
      WHERE id = $7 RETURNING *
    `;
    const values = [equipment_code, category_id, item_name, stock, status, image_url, id];
    await pool.query(query, values);
    res.status(200).json({ message: 'อัปเดตข้อมูลอุปกรณ์เรียบร้อยแล้ว' });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถอัปเดตข้อมูลได้ หรือรหัสอาจซ้ำ' });
  }
});

app.get('/api/inventory/manage', async (req, res) => {
  try {
    const query = `
      SELECT 
        i.id, 
        i.equipment_code, 
        i.item_name, 
        i.stock, 
        i.status, 
        i.image_url, 
        c.name as category_name,
        COALESCE(
          (SELECT SUM(qty) FROM transactions t WHERE t.inventory_id = i.id AND t.return_date IS NULL), 
          0
        ) as borrowed_qty,
        COALESCE(
          (SELECT SUM(qty) FROM transactions t WHERE t.inventory_id = i.id AND t.return_condition = 'ชำรุด'), 
          0
        ) as broken_qty,
        (i.stock - 
         COALESCE((SELECT SUM(qty) FROM transactions t WHERE t.inventory_id = i.id AND t.return_date IS NULL), 0) - 
         COALESCE((SELECT SUM(qty) FROM transactions t WHERE t.inventory_id = i.id AND t.return_condition = 'ชำรุด'), 0)
        ) as available_qty
      FROM inventory i
      LEFT JOIN equipment_categories c ON i.category_id = c.id
      WHERE i.active = true OR i.active IS NULL
      ORDER BY i.id DESC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'ดึงข้อมูลคลังอุปกรณ์ไม่สำเร็จ' });
  }
});

// ===========================================================================
// [2] API ระบบสมาชิกและการเข้าสู่ระบบ
// ===========================================================================
app.post('/api/request-otp', async (req, res) => {
  const { email, type, studentId } = req.body; 
  if (!email) return res.status(400).json({ message: 'กรุณาระบุอีเมล' });
  
  if (type === 'student') {
    if (!email.endsWith('@mail.rmutk.ac.th')) {
      return res.status(400).json({ message: 'นักศึกษาต้องใช้อีเมลของมหาวิทยาลัย (@mail.rmutk.ac.th) เท่านั้น' });
    }
    const emailPrefix = email.split('@')[0];
    if (studentId && emailPrefix !== studentId) {
      return res.status(400).json({ message: 'รหัสนักศึกษาไม่ตรงกับอีเมลที่ใช้งาน' });
    }
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStorage[email] = { otp, expires: Date.now() + 5 * 60000 };

  const emailHtmlTemplate = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      <div style="background-color: #00A87E; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">RMUTK Sports & Fitness</h1>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">ยืนยันการสมัครสมาชิก</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
          สวัสดีครับ,<br><br>
          คุณได้ทำการขอรหัส OTP เพื่อใช้ในการยืนยันอีเมลสำหรับสมัครเข้าใช้งาน <b>ระบบจัดการศูนย์กีฬาและฟิตเนส มหาวิทยาลัยเทคโนโลยีราชมงคลกรุงเทพ</b>
        </p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px; border: 1px dashed #d1d5db;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">รหัสยืนยัน OTP ของคุณคือ</p>
          <div style="font-size: 42px; font-weight: bold; color: #1e3a8a; letter-spacing: 8px; margin: 0;">${otp}</div>
        </div>
        <p style="color: #ef4444; font-size: 14px; margin-bottom: 8px;"><b>⚠️ ข้อควรระวัง:</b> รหัสนี้มีอายุการใช้งานเพียง 5 นาที</p>
      </div>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>', 
      to: email, 
      subject: `รหัสยืนยัน OTP ของคุณคือ ${otp} - RMUTK Sports`,
      html: emailHtmlTemplate
    });
    res.status(200).json({ message: 'ส่งรหัส OTP ไปที่อีเมลเรียบร้อยแล้ว', debugOtp: otp }); 
  } catch (error) {
    res.status(200).json({ message: 'ระบบส่งอีเมลขัดข้องชั่วคราว (แต่สร้าง OTP สำเร็จ)', debugOtp: otp });
  }
});

app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const storedOtpData = otpStorage[email];

  if (!storedOtpData) return res.status(400).json({ message: 'ไม่พบการขอ OTP หรือรหัสหมดอายุแล้ว' });
  if (storedOtpData.expires < Date.now()) {
    delete otpStorage[email];
    return res.status(400).json({ message: 'รหัส OTP หมดอายุแล้ว กรุณาขอใหม่' });
  }
  if (storedOtpData.otp !== otp) return res.status(400).json({ message: 'รหัส OTP ไม่ถูกต้อง' });

  res.status(200).json({ message: 'รหัส OTP ถูกต้อง' });
});

app.post('/api/register/student', async (req, res) => {
  const { studentId, name, faculty, major, phone, email, password, otp, profileImage } = req.body; 

  const storedOtpData = otpStorage[email];
  if (!storedOtpData || storedOtpData.otp !== otp || storedOtpData.expires < Date.now()) {
    return res.status(400).json({ message: 'รหัส OTP ไม่ถูกต้อง หรือหมดอายุแล้ว' });
  }

  try {
    delete otpStorage[email];
    const passwordHash = await bcrypt.hash(password, 10);
    const query = `
      WITH new_account AS (
        INSERT INTO accounts (account_type, email, password_hash) VALUES ('student', $1, $2) RETURNING id
      )
      INSERT INTO students (account_id, student_id, full_name, faculty, major, phone, profile_image) 
      SELECT id, $3, $4, $5, $6, $7, $8 FROM new_account RETURNING *;
    `;
    await pool.query(query, [email, passwordHash, studentId, name, faculty, major, phone, profileImage]);
    res.status(201).json({ message: 'สมัครสมาชิกนักศึกษาสำเร็จเรียบร้อย' });
  } catch (error) {
    res.status(500).json({ message: 'อีเมล/รหัส นศ. นี้ถูกใช้ไปแล้ว หรือไม่สามารถบันทึกได้' });
  }
});

app.post('/api/register/outsider', async (req, res) => {  
  const { citizenId, name, phone, email, password, idCardImage, profileImage } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const query = `
      WITH new_account AS (
        INSERT INTO accounts (account_type, email, password_hash) VALUES ('external', $1, $2) RETURNING id
      )
      INSERT INTO externals (account_id, citizen_id, full_name, phone, id_card_image, profile_image) 
      SELECT id, $3, $4, $5, $6, $7 FROM new_account RETURNING *;
    `;
    await pool.query(query, [email, passwordHash, citizenId, name, phone, idCardImage, profileImage]);
    res.status(201).json({ message: 'สมัครสมาชิกบุคคลภายนอกสำเร็จเรียบร้อย' });
  } catch (error) {
    res.status(500).json({ message: 'อีเมล/รหัสบัตรประชาชน นี้ถูกใช้ไปแล้ว หรือไม่สามารถบันทึกได้' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const accountResult = await pool.query(`SELECT id, account_type, password_hash, is_active FROM accounts WHERE email = $1`, [email]);
    if (accountResult.rows.length === 0) return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    
    const account = accountResult.rows[0];
    if (!account.is_active) return res.status(403).json({ message: 'บัญชีนี้ถูกระงับการใช้งาน' });

    let isPasswordMatch = account.password_hash.startsWith('$') 
        ? await bcrypt.compare(password, account.password_hash) 
        : (password === account.password_hash);

    if (!isPasswordMatch) return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    let userData = { accountId: account.id, email: email, role: account.account_type };

    if (account.account_type === 'student') {
      const studentResult = await pool.query(`SELECT student_id, full_name, faculty, major, phone FROM students WHERE account_id = $1`, [account.id]);
      if (studentResult.rows.length > 0) userData = { ...userData, ...studentResult.rows[0] }; 
    } else if (account.account_type === 'external') {
      const externalResult = await pool.query(`SELECT citizen_id, full_name, phone FROM externals WHERE account_id = $1`, [account.id]);
      if (externalResult.rows.length > 0) userData = { ...userData, ...externalResult.rows[0] };
    }

    res.status(200).json({ message: 'เข้าสู่ระบบสำเร็จ', role: account.account_type, user: userData });
  } catch (error) {
    res.status(500).json({ message: 'เซิร์ฟเวอร์มีปัญหา ไม่สามารถเข้าสู่ระบบได้' });
  }
});

app.post('/api/login-staff', async (req, res) => {
  const { email, password } = req.body;
  try {
    const accountResult = await pool.query(`SELECT id, email, account_type, password_hash, is_active, can_manage_inventory FROM accounts WHERE email = $1 AND account_type = 'staff'`, [email]);
    if (accountResult.rows.length === 0) return res.status(401).json({ message: 'อีเมลเจ้าหน้าที่ไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึง' });

    const account = accountResult.rows[0];
    if (!account.is_active) return res.status(403).json({ message: 'บัญชีเจ้าหน้าที่นี้ถูกระงับการใช้งาน' });

    let isPasswordMatch = account.password_hash.startsWith('$') 
        ? await bcrypt.compare(password, account.password_hash) 
        : (password === account.password_hash);

    if (!isPasswordMatch) return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    const staffResult = await pool.query(`SELECT full_name, department FROM staffs WHERE account_id = $1`, [account.id]);
    let staffData = staffResult.rows.length > 0 ? staffResult.rows[0] : {};

    res.status(200).json({ 
      message: 'เข้าสู่ระบบเจ้าหน้าที่สำเร็จ', 
      role: account.account_type,
      user: { accountId: account.id, email: account.email, canManageInventory: account.can_manage_inventory, ...staffData }
    });
  } catch (error) {
    res.status(500).json({ message: 'เซิร์ฟเวอร์มีปัญหา ไม่สามารถเข้าสู่ระบบได้' });
  }
});

app.post('/api/login-admin', async (req, res) => {
  const { email, password } = req.body;
  try {
    const accountResult = await pool.query(`SELECT id, email, account_type, password_hash, is_active FROM accounts WHERE email = $1 AND account_type = 'admin'`, [email]);
    if (accountResult.rows.length === 0) return res.status(401).json({ message: 'อีเมลผู้ดูแลระบบไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึง' });

    const account = accountResult.rows[0];
    if (!account.is_active) return res.status(403).json({ message: 'บัญชีผู้ดูแลระบบนี้ถูกระงับการใช้งาน' });

    let isPasswordMatch = account.password_hash.startsWith('$') 
        ? await bcrypt.compare(password, account.password_hash) 
        : (password === account.password_hash);

    if (!isPasswordMatch) return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    const adminResult = await pool.query(`SELECT full_name FROM admins WHERE account_id = $1`, [account.id]);
    let adminName = adminResult.rows.length > 0 ? adminResult.rows[0].full_name : 'Super Admin';

    res.status(200).json({ 
      message: 'เข้าสู่ระบบผู้ดูแลระบบสำเร็จ', 
      role: account.account_type,
      user: { accountId: account.id, email: account.email, name: adminName }
    });
  } catch (error) {
    res.status(500).json({ message: 'เซิร์ฟเวอร์มีปัญหา ไม่สามารถเข้าสู่ระบบได้' });
  }
});

// ===========================================================================
// [3] API ยืมคืน และ ฟิตเนส
// ===========================================================================
app.get('/api/users/scan/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const query = `
      SELECT a.id as account_id, a.account_type, 
             s.student_id, s.full_name as student_name, s.profile_image as student_img,
             e.citizen_id, e.full_name as external_name, e.profile_image as external_img
      FROM accounts a 
      LEFT JOIN students s ON a.id = s.account_id 
      LEFT JOIN externals e ON a.id = e.account_id
      WHERE s.student_id = $1 OR e.citizen_id = $1 OR a.id::text = $1
    `;
    const result = await pool.query(query, [code]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'ไม่พบข้อมูลสมาชิก' });

    const user = result.rows[0];

    const settingsResult = await pool.query('SELECT fitness_fee_student, fitness_fee_external FROM system_settings LIMIT 1');
    const settings = settingsResult.rows[0] || { fitness_fee_student: 5, fitness_fee_external: 20 };

    const role = user.account_type === 'student' ? 'นักศึกษา' : 'บุคคลภายนอก';
    const name = user.account_type === 'student' ? user.student_name : user.external_name;
    const codeId = user.account_type === 'student' ? user.student_id : user.citizen_id;
    const fee = user.account_type === 'student' ? settings.fitness_fee_student : settings.fitness_fee_external;
    const profileImg = user.account_type === 'student' ? user.student_img : user.external_img;

    res.status(200).json({ id: user.account_id, account_id: user.account_id, name, role: user.account_type, role_th: role, code_id: codeId, fee, avatar: profileImg || '' });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
});

app.post('/api/borrow', async (req, res) => {
  const client = await pool.connect();
  try {
    const borrower_id = req.body.borrower_account_id || req.body.account_id || req.body.user_id;
    const inv_id = req.body.inventory_id || req.body.item_id || req.body.equipment_id;
    const req_qty = parseInt(req.body.qty || req.body.amount || req.body.borrowed_qty || 1);

    if (!borrower_id || !inv_id) {
      return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน (รหัสผู้ใช้ หรือ รหัสอุปกรณ์สูญหาย)' });
    }

    await client.query('BEGIN');

    const userCheck = await client.query(`
      SELECT a.id as account_id 
      FROM accounts a
      LEFT JOIN students s ON a.id = s.account_id
      WHERE a.id::text = $1 OR s.id::text = $1 OR s.student_id = $1
      LIMIT 1
    `, [String(borrower_id)]);

    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้งานในระบบ' });
    }
    const realAccountId = userCheck.rows[0].account_id;

    const colCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions'
    `);
    const columns = colCheck.rows.map(r => r.column_name);

    const colUser = columns.includes('borrower_account_id') ? 'borrower_account_id' : (columns.includes('user_id') ? 'user_id' : 'account_id');
    const colInv = columns.includes('inventory_id') ? 'inventory_id' : 'item_id';
    
    let qtyField = 'qty';
    if (!columns.includes('qty') && columns.includes('amount')) qtyField = 'amount';
    if (!columns.includes('qty') && !columns.includes('amount') && columns.includes('borrowed_qty')) qtyField = 'borrowed_qty';

    let insertCols = [colUser, colInv, qtyField];
    let insertVals = [realAccountId, inv_id, req_qty];
    let placeholders = ['$1', '$2', '$3'];

    if (columns.includes('original_qty')) {
      insertCols.push('original_qty');
      insertVals.push(req_qty);
      placeholders.push(`$${insertVals.length}`);
    }

    if (columns.includes('promised_return_date')) {
      insertCols.push('promised_return_date');
      placeholders.push(`CURRENT_DATE + INTERVAL '1 day'`);
    } else if (columns.includes('expected_return_date')) {
      insertCols.push('expected_return_date');
      placeholders.push(`CURRENT_DATE + INTERVAL '1 day'`);
    }

    const dynamicQuery = `
      INSERT INTO transactions (${insertCols.join(', ')}) 
      VALUES (${placeholders.join(', ')})
    `;

    await client.query(dynamicQuery, insertVals);
    await client.query('COMMIT');
    
    res.status(201).json({ message: 'บันทึกการยืมอุปกรณ์สำเร็จ!' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Auto-Detect Borrow Error:", error.message);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + error.message });
  } finally {
    client.release();
  }
});

app.get('/api/returns/pending/:account_id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT t.id as transaction_id, t.inventory_id, t.qty as borrowed_qty, t.created_at as borrow_date, inv.item_name FROM transactions t JOIN inventory inv ON t.inventory_id = inv.id WHERE t.borrower_account_id = $1 AND t.return_date IS NULL ORDER BY t.created_at DESC LIMIT 1`, [req.params.account_id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'ไม่มีรายการค้างคืน' });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'ดึงข้อมูลค้างคืนไม่สำเร็จ' });
  }
});

app.post('/api/return', async (req, res) => {
  const { transaction_id, normal_qty, broken_qty, borrowed_qty, new_expected_date } = req.body;
  const normal = parseInt(normal_qty) || 0;
  const broken = parseInt(broken_qty) || 0;
  const borrowed = parseInt(borrowed_qty) || 0;
  const remaining = borrowed - (normal + broken);
  
  try {
    await pool.query('BEGIN');
    
    if (broken > 0) {
      await pool.query(`
        INSERT INTO transactions (borrower_account_id, inventory_id, qty, original_qty, created_by, created_by_type, promised_return_date, return_date, return_condition, is_partial, created_at)
        SELECT borrower_account_id, inventory_id, $1, $1, created_by, created_by_type, promised_return_date, now(), 'ชำรุด', true, created_at
        FROM transactions WHERE id = $2
      `, [broken, transaction_id]);
    }

    if (normal > 0) {
      await pool.query(`
        INSERT INTO transactions (borrower_account_id, inventory_id, qty, original_qty, created_by, created_by_type, promised_return_date, return_date, return_condition, is_partial, created_at)
        SELECT borrower_account_id, inventory_id, $1, $1, created_by, created_by_type, promised_return_date, now(), 'ใช้งาน', true, created_at
        FROM transactions WHERE id = $2
      `, [normal, transaction_id]);
    }

    if (remaining <= 0) {
      await pool.query(`DELETE FROM transactions WHERE id = $1`, [transaction_id]);
    } else {
      if (new_expected_date) {
        await pool.query(`UPDATE transactions SET qty = $1, original_qty = $1, promised_return_date = $2, is_partial = true WHERE id = $3`, [remaining, new_expected_date, transaction_id]);
      } else {
        await pool.query(`UPDATE transactions SET qty = $1, original_qty = $1, is_partial = true WHERE id = $2`, [remaining, transaction_id]);
      }
    }
    
    await pool.query('COMMIT');
    res.status(200).json({ message: 'บันทึกส่งคืนสำเร็จ' });
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({ message: 'บันทึกการคืนไม่สำเร็จ' });
  }
});

app.post('/api/fitness-usage', async (req, res) => {
  const { user_account_id, service_fee, payment_type, staff_id } = req.body;
  try {
    await pool.query(`INSERT INTO fitness_usage (user_account_id, service_fee, payment_type, processed_by) VALUES ($1, $2, $3, $4)`, [user_account_id, service_fee, payment_type, staff_id]);
    res.status(201).json({ message: 'บันทึกการเข้าใช้ฟิตเนสสำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถบันทึกได้' });
  }
});

app.post('/api/inventory/:id/repair', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE transactions SET return_condition = 'ซ่อมแล้ว' WHERE inventory_id = $1 AND return_condition = 'ชำรุด'`, [id]);
    res.status(200).json({ message: 'เคลียร์ยอดชำรุดสำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการซ่อมแซม' });
  }
});

// ===========================================================================
// [4] API อื่นๆ (รายงาน, จัดการแอดมิน, เปลี่ยนรหัสผ่าน ฯลฯ)
// ===========================================================================
app.get('/api/members', async (req, res) => {
  try {
    const query = `
      SELECT a.id, a.account_type, a.email, a.created_at, s.student_id as code, s.full_name as name, 'นักศึกษา' as role, s.faculty, s.major, s.phone FROM accounts a JOIN students s ON a.id = s.account_id WHERE a.account_type = 'student'
      UNION
      SELECT a.id, a.account_type, a.email, a.created_at, e.citizen_id as code, e.full_name as name, 'บุคคลภายนอก' as role, '-' as faculty, '-' as major, e.phone FROM accounts a JOIN externals e ON a.id = e.account_id WHERE a.account_type = 'external'
      ORDER BY id DESC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'ดึงข้อมูลไม่สำเร็จ' });
  }
});

app.get('/api/reports/dashboard', async (req, res) => {
  try {
    const borrowRes = await pool.query(`SELECT t.id as transaction_id, a.email, COALESCE(s.full_name, e.full_name) as member_name, inv.item_name as equipment, COALESCE(t.return_condition, 'ใช้งาน') as equipment_status, GREATEST(t.qty, t.original_qty) as amount, t.created_at as borrow_date, t.return_date as return_date, t.promised_return_date as expected_return_date FROM transactions t JOIN inventory inv ON t.inventory_id = inv.id LEFT JOIN accounts a ON t.borrower_account_id = a.id LEFT JOIN students s ON t.borrower_account_id = s.account_id LEFT JOIN externals e ON t.borrower_account_id = e.account_id WHERE t.return_date IS NOT NULL ORDER BY t.return_date DESC LIMIT 50`);
    
    const pendingRes = await pool.query(`SELECT t.id as transaction_id, a.email, COALESCE(s.full_name, e.full_name) as member_name, inv.item_name as equipment, 'ใช้งาน' as equipment_status, GREATEST(t.qty, t.original_qty) as amount, t.qty as pending_amount, t.created_at as borrow_date, t.promised_return_date as expected_return_date FROM transactions t JOIN inventory inv ON t.inventory_id = inv.id LEFT JOIN accounts a ON t.borrower_account_id = a.id LEFT JOIN students s ON t.borrower_account_id = s.account_id LEFT JOIN externals e ON t.borrower_account_id = e.account_id WHERE t.return_date IS NULL ORDER BY t.created_at ASC`);
    
    const popularRes = await pool.query(`SELECT c.name as category_name, inv.item_name as equipment, COUNT(t.id) as borrow_count FROM transactions t JOIN inventory inv ON t.inventory_id = inv.id LEFT JOIN equipment_categories c ON inv.category_id = c.id GROUP BY c.name, inv.item_name ORDER BY borrow_count DESC LIMIT 10`);
    const fitnessRes = await pool.query(`SELECT COALESCE(s.full_name, e.full_name) as member_name, a.account_type as role, f.check_in_time, f.service_fee, f.payment_type FROM fitness_usage f JOIN accounts a ON f.user_account_id = a.id LEFT JOIN students s ON a.id = s.account_id LEFT JOIN externals e ON a.id = e.account_id ORDER BY f.check_in_time DESC LIMIT 50`);
    
    res.status(200).json({ borrowReport: borrowRes.rows, pendingReport: pendingRes.rows, popularReport: popularRes.rows, fitnessReport: fitnessRes.rows });
  } catch (error) {
    res.status(500).json({ message: 'ดึงข้อมูลรายงานไม่สำเร็จ' });
  }
});

app.get('/api/history/:account_id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT t.id, inv.item_name as equipment, GREATEST(t.qty, t.original_qty) as amount, t.created_at as borrow_date, t.return_date, t.promised_return_date as expected_return_date, COALESCE(t.return_condition, 'ใช้งาน') as equipment_status FROM transactions t JOIN inventory inv ON t.inventory_id = inv.id WHERE t.borrower_account_id = $1 ORDER BY t.created_at DESC`, [req.params.account_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'ดึงข้อมูลประวัติไม่สำเร็จ' });
  }
});

app.get('/api/fitness-history/:account_id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, check_in_time, service_fee, payment_type FROM fitness_usage WHERE user_account_id = $1 ORDER BY check_in_time DESC`, [req.params.account_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'ดึงข้อมูลประวัติไม่สำเร็จ' });
  }
});

app.post('/api/change-password', async (req, res) => {
  const { accountId, oldPassword, newPassword } = req.body;
  try {
    const accountResult = await pool.query(`SELECT id, password_hash FROM accounts WHERE id = $1`, [accountId]);
    if (accountResult.rows.length === 0) return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้งาน' });

    const account = accountResult.rows[0];
    let isPasswordMatch = account.password_hash.startsWith('$') ? await bcrypt.compare(oldPassword, account.password_hash) : (oldPassword === account.password_hash);
    if (!isPasswordMatch) return res.status(400).json({ message: 'รหัสผ่านเดิมไม่ถูกต้อง' });

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE accounts SET password_hash = $1 WHERE id = $2`, [newPasswordHash, accountId]);
    res.status(200).json({ message: 'อัปเดตรหัสผ่านสำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'เปลี่ยนรหัสผ่านไม่สำเร็จ' });
  }
});

app.get('/api/admin/dashboard-stats', async (req, res) => {
  const { mode = 'daily', month = 'all' } = req.query;
  
  try {
    let fitFilter = "DATE(check_in_time) = CURRENT_DATE";
    let transFilter = "DATE(t.created_at) = CURRENT_DATE";
    let rawTransFilter = "DATE(created_at) = CURRENT_DATE";

    if (mode === 'monthly') {
      if (month === 'all') {
        fitFilter = "EXTRACT(YEAR FROM check_in_time) = EXTRACT(YEAR FROM CURRENT_DATE)";
        transFilter = "EXTRACT(YEAR FROM t.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)";
        rawTransFilter = "EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)";
      } else {
        const m = parseInt(month);
        fitFilter = `EXTRACT(YEAR FROM check_in_time) = EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(MONTH FROM check_in_time) = ${m}`;
        transFilter = `EXTRACT(YEAR FROM t.created_at) = EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(MONTH FROM t.created_at) = ${m}`;
        rawTransFilter = `EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(MONTH FROM created_at) = ${m}`;
      }
    }

    const fitnessRes = await pool.query(`SELECT COUNT(*) as total_users, COALESCE(SUM(service_fee), 0) as total_revenue, COALESCE(SUM(CASE WHEN payment_type = 'cash' THEN service_fee ELSE 0 END), 0) as cash, COALESCE(SUM(CASE WHEN payment_type = 'qr' THEN service_fee ELSE 0 END), 0) as qr FROM fitness_usage WHERE ${fitFilter}`);
    const borrowRes = await pool.query(`SELECT COALESCE(SUM(qty), 0) as total FROM transactions WHERE ${rawTransFilter}`);
    
    const pendingRes = await pool.query(`SELECT COALESCE(SUM(qty), 0) as total FROM transactions WHERE return_date IS NULL`);
    const overdueRes = await pool.query(`SELECT COUNT(*) as total FROM transactions WHERE return_date IS NULL AND DATE(promised_return_date) < CURRENT_DATE`);
    
    const popularEqRes = await pool.query(`SELECT inv.item_name as label, SUM(t.qty) as value FROM transactions t JOIN inventory inv ON t.inventory_id = inv.id WHERE ${transFilter} GROUP BY inv.item_name ORDER BY value DESC LIMIT 5`);
    
    let chartBar = [];
    let peakUsage = { label: '-', value: 0 };
    
    if (mode === 'daily') {
      const chartRes = await pool.query(`SELECT EXTRACT(HOUR FROM check_in_time) as label_val, COUNT(*) as count FROM fitness_usage WHERE ${fitFilter} GROUP BY label_val`);
      chartBar = [
        { label: '07:00', value: 0 }, { label: '09:00', value: 0 }, { label: '11:00', value: 0 }, { label: '13:00', value: 0 }, 
        { label: '15:00', value: 0 }, { label: '17:00', value: 0 }, { label: '19:00', value: 0 }, { label: '21:00', value: 0 }
      ];
      chartRes.rows.forEach(row => {
         let h = parseInt(row.label_val);
         let slotIndex = chartBar.findIndex(c => parseInt(c.label.split(':')[0]) === (h % 2 !== 0 ? h : h - 1));
         if(slotIndex !== -1) chartBar[slotIndex].value += parseInt(row.count);
      });
    } else {
      if (month === 'all') {
        const chartRes = await pool.query(`SELECT EXTRACT(MONTH FROM check_in_time) as label_val, COUNT(*) as count FROM fitness_usage WHERE ${fitFilter} GROUP BY label_val`);
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        chartBar = months.map((m) => ({ label: m, value: 0 }));
        chartRes.rows.forEach(row => {
          let mIndex = parseInt(row.label_val) - 1;
          if (chartBar[mIndex]) chartBar[mIndex].value += parseInt(row.count);
        });
      } else {
        const chartRes = await pool.query(`SELECT EXTRACT(DAY FROM check_in_time) as label_val, COUNT(*) as count FROM fitness_usage WHERE ${fitFilter} GROUP BY label_val`);
        chartBar = Array.from({length: 31}, (_, i) => ({ label: `${i+1}`, value: 0 }));
        chartRes.rows.forEach(row => {
          let dIndex = parseInt(row.label_val) - 1;
          if (chartBar[dIndex]) chartBar[dIndex].value += parseInt(row.count);
        });
      }
    }

    chartBar.forEach(c => { if(c.value > peakUsage.value) { peakUsage = { label: c.label, value: c.value }; } });

    res.status(200).json({
      fitnessUsers: parseInt(fitnessRes.rows[0].total_users), revenue: parseInt(fitnessRes.rows[0].total_revenue),
      cash: parseInt(fitnessRes.rows[0].cash), qr: parseInt(fitnessRes.rows[0].qr),
      borrowed: parseInt(borrowRes.rows[0].total), notReturned: parseInt(pendingRes.rows[0].total),
      overdue: parseInt(overdueRes.rows[0].total), chartBar: chartBar,
      peakUsage: peakUsage,
      popularEquipment: popularEqRes.rows.map(r => ({ label: r.label, value: parseInt(r.value) })) 
    });

  } catch (error) {
    res.status(500).json({ message: 'ดึงข้อมูลสถิติไม่สำเร็จ' });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const query = `
      SELECT a.id, a.email, a.account_type, a.is_active, a.can_borrow, a.can_manage_inventory, a.can_manage_users, a.can_access_fitness, COALESCE(s.full_name, e.full_name, st.full_name, ad.full_name) as full_name, TO_CHAR(a.created_at, 'YYYY-MM-DD') as register_date
      FROM accounts a LEFT JOIN students s ON a.id = s.account_id LEFT JOIN externals e ON a.id = e.account_id LEFT JOIN staffs st ON a.id = st.account_id LEFT JOIN admins ad ON a.id = ad.account_id ORDER BY a.created_at DESC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'ดึงข้อมูลไม่สำเร็จ' });
  }
});

app.put('/api/admin/users/:id/permissions', async (req, res) => {
  const { id } = req.params;
  const { field, value } = req.body; 
  try {
    await pool.query(`UPDATE accounts SET ${field} = $1 WHERE id = $2 RETURNING id`, [value, id]);
    res.status(200).json({ message: 'อัปเดตสิทธิ์สำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'อัปเดตสิทธิ์ไม่สำเร็จ' });
  }
});

app.get('/api/admin/users/:id/detail', async (req, res) => {
  try {
    const query = `
      SELECT a.id, a.account_type, s.student_id, s.full_name as student_name, s.faculty, s.major, s.phone as student_phone, s.profile_image as student_img,
             e.citizen_id, e.full_name as external_name, e.phone as external_phone, e.id_card_image, e.profile_image as external_img, st.full_name as staff_name, st.department, ad.full_name as admin_name
      FROM accounts a LEFT JOIN students s ON a.id = s.account_id LEFT JOIN externals e ON a.id = e.account_id LEFT JOIN staffs st ON a.id = st.account_id LEFT JOIN admins ad ON a.id = ad.account_id WHERE a.id = $1
    `;
    const result = await pool.query(query, [req.params.id]);
    const u = result.rows[0];
    res.status(200).json({ phone: u.student_phone || u.external_phone || '-', student_id: u.student_id || '', faculty: u.faculty || '', major: u.major || '', citizen_id: u.citizen_id || '', profile_image: u.student_img || u.external_img || '', id_card_image: u.id_card_image || '' });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
});

app.get('/api/admin/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM system_settings LIMIT 1');
    let data = result.rows[0];
    
    if (!data) {
      const defaultPromptPay = '0994150630'; 
      await pool.query(
        `INSERT INTO system_settings (id, fitness_fee_student, fitness_fee_external, promptpay_no) 
         VALUES (1, 5, 20, $1)`, 
        [defaultPromptPay]
      );
      
      data = { 
        fitness_fee_student: 5, 
        fitness_fee_external: 20, 
        promptpay_no: defaultPromptPay 
      };
    } else if (!data.promptpay_no) {
      data.promptpay_no = data.promptpay || data.promptpay_number || data.phone || '0994150630';
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Settings GET API Error:", error.message);
    res.status(500).json({ message: 'ดึงข้อมูลไม่สำเร็จ' });
  }
});

app.put('/api/admin/settings', async (req, res) => {
  const { fitness_fee_student, fitness_fee_external, max_borrow_days, max_borrow_items, accept_qr, promptpay_no } = req.body;
  try {
    const check = await pool.query('SELECT id FROM system_settings LIMIT 1');
    
    if (check.rows.length === 0) {
       await pool.query(
         `INSERT INTO system_settings (id, fitness_fee_student, fitness_fee_external, max_borrow_days, max_borrow_items, accept_qr, promptpay_no) 
          VALUES (1, $1, $2, $3, $4, $5, $6)`, 
         [fitness_fee_student, fitness_fee_external, max_borrow_days, max_borrow_items, accept_qr, promptpay_no]
       );
    } else {
       const rowId = check.rows[0].id;
       await pool.query(
         `UPDATE system_settings 
          SET fitness_fee_student = $1, fitness_fee_external = $2, max_borrow_days = $3, max_borrow_items = $4, accept_qr = $5, promptpay_no = $6 
          WHERE id = $7`, 
         [fitness_fee_student, fitness_fee_external, max_borrow_days, max_borrow_items, accept_qr, promptpay_no, rowId]
       );
    }
    res.status(200).json({ message: 'บันทึกสำเร็จ' });
  } catch (error) {
    console.error("Settings PUT API Error:", error.message);
    res.status(500).json({ message: 'อัปเดตไม่สำเร็จ' });
  }
});

app.get('/api/recent-activities', async (req, res) => {
  try {
    let allActivities = [];

    try {
      const fitRes = await pool.query(`
        SELECT f.*, COALESCE(s.full_name, a.email, 'สมาชิก') as member_name 
        FROM fitness_usage f 
        LEFT JOIN accounts a ON f.user_account_id = a.id 
        LEFT JOIN students s ON a.id = s.account_id 
        ORDER BY f.check_in_time DESC LIMIT 10
      `);
      fitRes.rows.forEach(row => {
        allActivities.push({
          type: 'fitness',
          id: `fit_${row.id || Math.random()}`,
          title: `เข้าฟิตเนส: ${row.member_name}`,
          detail: `ชำระค่าบริการ ${row.service_fee || 0} บาท`,
          date: row.check_in_time,
          staffName: 'เจ้าหน้าที่'
        });
      });
    } catch (err) {
      console.log('⚠️ Fitness Error:', err.message);
    }

    try {
      const transRes = await pool.query(`
        SELECT t.*, i.item_name as equipment_name, COALESCE(s.full_name, a.email, 'สมาชิก') as member_name 
        FROM transactions t 
        LEFT JOIN inventory i ON t.inventory_id = i.id 
        LEFT JOIN accounts a ON t.borrower_account_id = a.id 
        LEFT JOIN students s ON a.id = s.account_id 
        ORDER BY t.borrow_date DESC LIMIT 20
      `);
      
      transRes.rows.forEach(row => {
        const borrowQty = parseInt(row.borrowed_qty ?? row.amount ?? row.qty ?? 0);
        const normalQty = parseInt(row.normal_qty ?? row.returned_qty ?? borrowQty);
        const brokenQty = parseInt(row.broken_qty ?? row.broken_amount ?? 0);
        const totalReturned = normalQty + brokenQty;
        const equipName = row.equipment_name || row.item_name || 'อุปกรณ์';

        allActivities.push({
          type: 'borrow',
          id: `bor_${row.transaction_id || row.id || Math.random()}`,
          title: `ยืมอุปกรณ์: ${row.member_name}`,
          detail: `ยืม ${equipName} จำนวน ${borrowQty} ชิ้น`,
          date: row.borrow_date,
          staffName: 'เจ้าหน้าที่'
        });

        if (row.return_date) {
          let notifType = 'return';
          let notifTitle = `คืนอุปกรณ์: ${row.member_name}`;
          let notifDetail = `คืน ${equipName} (ปกติ ${normalQty}, ชำรุด ${brokenQty})`;

          if (totalReturned > 0 && totalReturned < borrowQty) {
            notifType = 'partial_return';
            notifTitle = `คืนบางส่วน: ${row.member_name}`;
            notifDetail = `คืน ${equipName} (ปกติ ${normalQty}, ชำรุด ${brokenQty}) *ค้างส่งอีก ${borrowQty - totalReturned} ชิ้น`;
          }

          allActivities.push({
            type: notifType,
            id: `ret_${row.transaction_id || row.id || Math.random()}`,
            title: notifTitle,
            detail: notifDetail,
            date: row.return_date,
            staffName: 'เจ้าหน้าที่'
          });
        }
      });
    } catch (err) {
      console.log('⚠️ Transaction Error:', err.message);
    }

    allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(allActivities.slice(0, 30));

  } catch (error) {
    console.error("❌ API Error:", error);
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลประวัติได้' });
  }
});

// 🌟 เพิ่ม Route สำหรับสร้างบัญชีเจ้าหน้าที่ (POST /api/admin/create-staff)
app.post('/api/admin/create-staff', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const query = `
      WITH new_account AS (
        INSERT INTO accounts (account_type, email, password_hash) VALUES ($1, $2, $3) RETURNING id
      )
      INSERT INTO staffs (account_id, full_name, department) 
      SELECT id, $4, 'เจ้าหน้าที่ทั่วไป' FROM new_account RETURNING *;
    `;
    await pool.query(query, [role || 'staff', email, passwordHash, name]);
    res.status(201).json({ message: 'สร้างบัญชีเจ้าหน้าที่เรียบร้อยแล้ว' });
  } catch (error) {
    res.status(500).json({ message: 'อีเมลนี้ถูกใช้งานไปแล้ว หรือเกิดข้อผิดพลาด' });
  }
});

// 🌟 เพิ่ม Route สำหรับลบผู้ใช้งาน (DELETE /api/admin/users/:id)
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM accounts WHERE id = $1', [req.params.id]);
    res.status(200).json({ message: 'ลบผู้ใช้งานสำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถลบผู้ใช้งานได้' });
  }
});

// ===========================================================================
// [5] API สำหรับ OCR (อ่านตัวอักษรจากภาพบัตรประชาชน ของจริง 100%)
// ===========================================================================
app.post('/api/ocr', async (req, res) => { 
  try {
    // ดึงข้อมูลรูปภาพจาก Request (รองรับกรณีส่งเป็น Base64 เข้ามา)
    const imageData = req.body.image || req.body.base64 || req.body.uri;

    if (!imageData) {
      return res.status(400).json({ message: 'ไม่พบข้อมูลรูปภาพ', text: '' });
    }

    // เริ่มกระบวนการอ่านข้อความจากรูปภาพ (ภาษาไทย + อังกฤษ)
    const { data: { text } } = await Tesseract.recognize(
      imageData,
      'tha+eng' // กำหนดภาษาที่ต้องการอ่าน
    );

    // ส่งข้อความที่อ่านได้กลับไปให้ Frontend
    res.status(200).json({ text: text.trim() });
  } catch (error) {
    console.error('OCR Process Error:', error);
    res.status(500).json({ message: 'อ่านข้อความไม่สำเร็จ', text: '' });
  }
});

app.get('/api/notifications/:account_id', async (req, res) => { res.status(200).json([]); });

app.post('/api/notify-overdue', async (req, res) => {
  const { transaction_id, email, memberName, equipment } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'ไม่พบอีเมลของผู้ใช้ในระบบ' });
  }

  try {
    const mailOptions = {
      from: '"ระบบศูนย์กีฬา RMUTK" <655021000097@mail.rmutk.ac.th>',
      to: email,
      subject: `[แจ้งเตือน] เกินกำหนดส่งคืนอุปกรณ์กีฬา (${equipment})`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ccc; border-radius: 10px;">
          <h2 style="color: #EF4444;">แจ้งเตือนอุปกรณ์ค้างส่ง</h2>
          <p>เรียนคุณ <b>${memberName}</b>,</p>
          <p>ระบบพบว่าท่านยังไม่ได้ทำการส่งคืนอุปกรณ์ <b>${equipment}</b> ซึ่งขณะนี้เกินกำหนดระยะเวลาแล้ว</p>
          <p>รบกวนนำอุปกรณ์มาติดต่อคืนที่ศูนย์กีฬาโดยเร็วที่สุดครับ</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'ส่งแจ้งเตือนสำเร็จ' });
  } catch (error) {
    console.error('Notify Error:', error);
    res.status(500).json({ message: 'ระบบส่งอีเมลขัดข้อง กรุณาลองใหม่' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend รันที่พอร์ต ${PORT}`));
