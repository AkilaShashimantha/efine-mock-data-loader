// server.js — e-Fine SL Digital Wallet Mock API entry point
require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const morgan    = require('morgan');

const connectDB      = require('./config/db');
const walletRoutes   = require('./routes/walletRoutes');
const errorHandler   = require('./middleware/errorHandler');
const { APP }        = require('./config/constants');

const app = express();

// ── Connect Database ─────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ── Health / root route (Render needs this) ───────────────
app.get('/', (req, res) => {
  res.json({
    service:   APP.NAME,
    status:    'running',
    version:   APP.VERSION,
    endpoints: {
      verify:  'POST /api/wallet/verify',
      vehicle: 'GET  /api/wallet/vehicle/:registrationNo',
      check:   'GET  /api/wallet/check/:nic',
      refresh: 'POST /api/wallet/refresh',
      health:  'GET  /api/wallet/health',
    },
  });
});

// ── Routes ───────────────────────────────────────────────
app.use('/api/wallet', walletRoutes);

// ── Global Error Handler ──────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Mock Data Loader running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
});
