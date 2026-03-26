// routes/walletRoutes.js — All wallet route definitions
const express        = require('express');
const router         = express.Router();
const walletController = require('../controllers/walletController');

// POST /api/wallet/verify      — Verify identity + load full wallet
router.post('/verify',  walletController.verifyIdentity);

// GET  /api/wallet/vehicle/:registrationNo?nic= — Single vehicle docs
router.get('/vehicle/:registrationNo', walletController.getSingleVehicle);

// GET  /api/wallet/check/:nic  — Quick summary/badge check
router.get('/check/:nic',  walletController.checkDocumentValidity);

// POST /api/wallet/refresh     — Cache-busting re-fetch
router.post('/refresh', walletController.refreshWalletData);

// GET  /api/wallet/health      — Health check
router.get('/health',  walletController.healthCheck);

module.exports = router;
