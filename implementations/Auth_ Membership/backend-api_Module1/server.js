require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// ✅ FIXED: Jump to your friend's config folder
// From backend-api_Module1 -> go up 2 levels (..) (..) -> payment-service -> src -> config
const { initializeDatabase } = require('../../payment-service/src/config/database'); 

// ✅ FIXED: Jump to your friend's payment route
const paymentRoutes = require('../../payment-service/src/routes/payment');

const authRoutes = require('./src/routes/authRoutes');
const membershipRoutes = require('./src/routes/membershipRoutes');

// Trigger database setup from your friend's file
initializeDatabase();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Point to your own Frontend folder
app.use(express.static(path.join(__dirname, '../Frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/welcome.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/payments', paymentRoutes);

app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`🚀 FITPAY SYSTEM: ONLINE`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`=========================================\n`);
});