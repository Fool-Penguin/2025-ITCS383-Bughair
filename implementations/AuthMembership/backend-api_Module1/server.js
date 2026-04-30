require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// ✅ FIXED: ดึงค่า Database จากเพื่อน Payment
const { initializeDatabase } = require('../../payment-service/src/config/database'); 
const { handleCourts } = require('../../reservation-service/backend/src/routes/courts');
const { handleAttendance } = require('../../reservation-service/backend/src/routes/attendance');

// ✅ FIXED: ดึง API Routes
const paymentRoutes = require('../../payment-service/src/routes/payment');
const authRoutes = require('./src/routes/authRoutes');
const membershipRoutes = require('./src/routes/membershipRoutes');

// Course-service routes (integrated into gateway)
const courseInitDb = require('../../course-service/src/config/initDb');
const courseRoutes = require('../../course-service/src/routes/courseRoutes');
const trainerRoutes = require('../../course-service/src/routes/trainerRoutes');
const reviewRoutes = require('../../course-service/src/routes/reviewRoutes');

// Admin-service (migrated from SQLite to Postgres)
const { adminApp } = require('../../Admin/backend/backend/server');
const seedAdminData = require('../../Admin/backend/backend/databaseSetup');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));


// ---------------------------------------------------------
// 🛣️ ส่วนการนำทางหน้าเว็บ (Page Routing) - *** ต้องอยู่ก่อน Static ***
// ---------------------------------------------------------

// หน้าแรกสุดเมื่อเปิด localhost:8080
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/welcome.html'));
});

// หน้า Dashboard สำหรับสมาชิกทั่วไป (Member)
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/Home.html'));
});

// หน้า Profile Edit
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/profile.html'));
});

// หน้า Forgot Password
app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/forgot-password.html'));
});

// หน้า Reset Password
app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/reset-password.html'));
});

// ✅ เพิ่มใหม่: หน้าเลือกสำหรับ Admin (admin_select.html)
app.get('/admin-select', (req, res) => {
    res.sendFile(path.join(__dirname, '../../reservation-service/frontend/admin_select.html'));
});

// หน้าจัดการสนามสำหรับ Admin (ไฟล์ของเพื่อน)
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../reservation-service/frontend/index.html'));
});


// ---------------------------------------------------------
// 🛠️ ส่วนการจัดการไฟล์หน้าบ้าน (Static Files)
// ---------------------------------------------------------

// 1. ชี้ไปที่โฟลเดอร์ frontend ของเราเอง
app.use(express.static(path.join(__dirname, '../frontend')));

// 2. ชี้ไปที่โฟลเดอร์ของเพื่อน
app.use(express.static(path.join(__dirname, '../../reservation-service/frontend')));


// ---------------------------------------------------------
// 🔌 ส่วนของ API (Backend Logic)
// ---------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/payments', paymentRoutes);

// Course & Trainer API (integrated from course-service)
app.use('/api/courses', courseRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/trainers', reviewRoutes);

// Admin-service API (Postgres — admin_svc schema)
app.use('/api/admin-svc', adminApp);

// 🌉 สะพานเชื่อม API ของเพื่อน (แก้ไขใหม่)
// ใช้ /^\/api\/courts/ เพื่อจับทุก Path ที่ขึ้นต้นด้วย /api/courts
app.all(/^\/api\/courts/, async (req, res) => {
    const url = req.originalUrl.split('?')[0]; //
    const method = req.method;
    const handled = await handleCourts(req, res, url, method);
    if (!handled && !res.headersSent) {
        res.status(404).json({ success: false, message: "Courts Route Not Found" });
    }
});

// สำหรับหน้า Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
    await handleCourts(req, res, '/api/dashboard/stats', 'GET'); //
});

// แก้ไขจุดเช็คอิน: ใช้ /^\/api\/attendance/ 
app.all(/^\/api\/attendance/, async (req, res) => {
    const url = req.originalUrl.split('?')[0]; //
    const method = req.method;
    const handled = await handleAttendance(req, res, url, method);
    if (!handled && !res.headersSent) {
        res.status(404).json({ success: false, message: "Attendance Route Not Found" });
    }
});

// เพิ่ม route สำหรับ reports
app.get('/api/reports/attendance', async (req, res) => {
    await handleAttendance(req, res, '/api/reports/attendance', 'GET');
});

app.use('/course-service', express.static(path.join(__dirname, '../../course-service')));
app.use('/payment-service', express.static(path.join(__dirname, '../../payment-service')));
app.use('/reservation-service', express.static(path.join(__dirname, '../../reservation-service')));
app.use('/Admin', express.static(path.join(__dirname, '../../Admin')));
app.use('/admin', express.static(path.join(__dirname, '../../Admin/front')));

// รันเซิร์ฟเวอร์ (DB seeds run in parallel; schema already lives in Supabase)
(async () => {
    try {
        await Promise.all([
            initializeDatabase(),     // payment_svc seeds (idempotent)
            courseInitDb(),           // course_svc seeds (idempotent)
            seedAdminData(),          // admin_svc seeds  (idempotent)
        ]);
    } catch (e) {
        console.error('DB seed failed (continuing — schema is already applied):', e.message);
    }
    app.listen(PORT, () => {
        console.log(`\n=========================================`);
        console.log(`FITPAY ELITE SYSTEM: ONLINE`);
        console.log(`MAIN URL: http://localhost:${PORT}`);
        console.log(`=========================================\n`);
    });
})();