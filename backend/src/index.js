require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const { startAlertEngine } = require('./utils/alertEngine');

const app = express();

connectDB();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  message: { success: false, message: 'Trop de requêtes. Veuillez patienter.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Trop de tentatives de connexion.' } });
app.use('/api/v1/auth/login', authLimiter);

app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/foreigners', require('./routes/foreigners'));
app.use('/api/v1/movements', require('./routes/movements'));
app.use('/api/v1/infractions', require('./routes/infractions'));
app.use('/api/v1/alerts', require('./routes/alerts'));
app.use('/api/v1/blacklist', require('./routes/blacklist'));
app.use('/api/v1/corrections', require('./routes/corrections'));
app.use('/api/v1/reports', require('./routes/reports'));
app.use('/api/v1/audit', require('./routes/audit'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/border-posts', require('./routes/borderPosts'));
app.use('/api/v1/notifications', require('./routes/notifications'));

app.get('/api/v1/health', (req, res) => res.json({
  success: true,
  message: 'DGM SIMN API v1.0 — Opérationnel',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV,
}));

app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} introuvable.` }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Erreur serveur interne.', ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Serveur DGM SIMN démarré sur le port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API: http://localhost:${PORT}/api/v1`);
  if (process.env.NODE_ENV !== 'test') startAlertEngine();
});

module.exports = app;
