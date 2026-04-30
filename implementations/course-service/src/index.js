require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initDb = require('./config/initDb');
const courseRoutes = require('./routes/courseRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'course-trainer-service', version: '1.0.0', db: 'Postgres (Supabase)' });
});

app.use('/api/courses', courseRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/trainers', reviewRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

(async () => {
  try {
    await initDb();
  } catch (e) {
    console.error('Seed failed (continuing — schema is already applied via _migration):', e.message);
  }
  app.listen(PORT, () => {
    console.log(`Course & Trainer Service running on http://localhost:${PORT}`);
  });
})();

module.exports = app;
