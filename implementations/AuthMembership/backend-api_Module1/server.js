require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { initializeDatabase } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const membershipRoutes = require('./src/routes/membershipRoutes');

initializeDatabase();

function tryLoadOptionalModule(loader, label) {
    try {
        return loader();
    } catch (error) {
        console.warn(`[startup] ${label} unavailable: ${error.message}`);
        return null;
    }
}

const paymentRoutes = tryLoadOptionalModule(
    () => require('../../payment-service/src/routes/payment'),
    'payment routes'
);
const courtsRoutes = tryLoadOptionalModule(
    () => require('../../reservation-service/backend/src/routes/courts'),
    'courts routes'
);
const attendanceRoutes = tryLoadOptionalModule(
    () => require('../../reservation-service/backend/src/routes/attendance'),
    'attendance routes'
);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());


// ---------------------------------------------------------
// 🛣️ ส่วนการนำทางหน้าเว็บ (Page Routing) - *** ต้องอยู่ก่อน Static ***
// ---------------------------------------------------------

// หน้าแรกสุดเมื่อเปิด localhost:8080
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/welcome.html'));
});

// หน้า Dashboard สำหรับสมาชิกทั่วไป (Member)
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Home.html'));
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

// 1. ชี้ไปที่โฟลเดอร์ Frontend ของเราเอง
app.use(express.static(path.join(__dirname, '../Frontend')));

// 2. ชี้ไปที่โฟลเดอร์ของเพื่อน
app.use(express.static(path.join(__dirname, '../../reservation-service/frontend')));


// ---------------------------------------------------------
// 🔌 ส่วนของ API (Backend Logic)
// ---------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/membership', membershipRoutes);

if (paymentRoutes) {
    app.use('/api/payments', paymentRoutes);
}

if (courtsRoutes?.handleCourts) {
    app.all(/^\/api\/courts/, async (req, res) => {
        const url = req.originalUrl.split('?')[0];
        const method = req.method;
        const handled = await courtsRoutes.handleCourts(req, res, url, method);
        if (!handled && !res.headersSent) {
            res.status(404).json({ success: false, message: 'Courts Route Not Found' });
        }
    });

    app.get('/api/dashboard/stats', async (req, res) => {
        await courtsRoutes.handleCourts(req, res, '/api/dashboard/stats', 'GET');
    });
}

if (attendanceRoutes?.handleAttendance) {
    app.all(/^\/api\/attendance/, async (req, res) => {
        const url = req.originalUrl.split('?')[0];
        const method = req.method;
        const handled = await attendanceRoutes.handleAttendance(req, res, url, method);
        if (!handled && !res.headersSent) {
            res.status(404).json({ success: false, message: 'Attendance Route Not Found' });
        }
    });

    app.get('/api/reports/attendance', async (req, res) => {
        await attendanceRoutes.handleAttendance(req, res, '/api/reports/attendance', 'GET');
    });
}

app.use('/course-service', express.static(path.join(__dirname, '../../course-service')));
app.use('/payment-service', express.static(path.join(__dirname, '../../payment-service')));
app.use('/reservation-service', express.static(path.join(__dirname, '../../reservation-service')));
app.use('/Admin', express.static(path.join(__dirname, '../../Admin')));

// รันเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`🚀 FITPAY ELITE SYSTEM: ONLINE`);
    console.log(`🔗 MAIN URL: http://localhost:${PORT}`);
    console.log(`=========================================\n`);
});