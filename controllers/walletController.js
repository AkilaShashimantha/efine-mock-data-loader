// controllers/walletController.js — All wallet endpoint handlers
const DriverWallet = require('../models/DriverWallet');
const Vehicle      = require('../models/Vehicle');
const {
  HTTP,
  DOCUMENT_STATUS,
  LICENSE_STATUS,
  NIC_REGEX,
  EXPIRY_WARNING_DAYS,
} = require('../config/constants');

// ────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────

/** Returns true if the NIC matches old (9V/X) or new (12 digit) format */
const isValidNic = (nic) =>
  NIC_REGEX.OLD.test(nic) || NIC_REGEX.NEW.test(nic);

/**
 * Given a JS Date (or null), compute:
 *  - isExpired        {Boolean}
 *  - daysUntilExpiry  {Number}
 *  - validityBadge    {String}  VALID | EXPIRING SOON | EXPIRED
 */
const computeValidity = (expiryDate) => {
  if (!expiryDate) return { isExpired: false, daysUntilExpiry: null, validityBadge: DOCUMENT_STATUS.VALID };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffMs   = expiry - today;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isExpired = diffDays < 0;

  let validityBadge;
  if (isExpired) {
    validityBadge = DOCUMENT_STATUS.EXPIRED;
  } else if (diffDays <= EXPIRY_WARNING_DAYS) {
    validityBadge = 'EXPIRING SOON';
  } else {
    validityBadge = DOCUMENT_STATUS.VALID;
  }

  return { isExpired, daysUntilExpiry: Math.max(0, diffDays), validityBadge };
};

/** Build a fully-enriched emission doc */
const enrichEmission = (cert) => {
  if (!cert) return null;
  const plain = cert.toObject ? cert.toObject() : { ...cert };
  const v = computeValidity(plain.validTill);
  return {
    ...plain,
    ...v,
    statusBadge: plain.overallStatus,   // PASS or FAIL
  };
};

/** Build a fully-enriched insurance doc */
const enrichInsurance = (cert) => {
  if (!cert) return null;
  const plain = cert.toObject ? cert.toObject() : { ...cert };
  const v = computeValidity(plain.periodOfCoverEnd);
  return {
    ...plain,
    ...v,
    statusBadge: v.isExpired ? DOCUMENT_STATUS.EXPIRED : plain.status,
  };
};

/** Build a fully-enriched revenue license doc */
const enrichRevenue = (lic) => {
  if (!lic) return null;
  const plain = lic.toObject ? lic.toObject() : { ...lic };
  const v = computeValidity(plain.expiryDate);
  return {
    ...plain,
    ...v,
    statusBadge: v.isExpired ? DOCUMENT_STATUS.EXPIRED : plain.status,
  };
};

/** Build summary counters across all documents */
const buildSummary = (licenseStatus, vehicles) => {
  const today = new Date();
  let valid = 0, expired = 0, needsRenewal = 0;

  // count driving license
  if (licenseStatus === LICENSE_STATUS.SUSPENDED || licenseStatus === LICENSE_STATUS.EXPIRED) {
    expired++;
  } else {
    valid++;
  }

  for (const v of vehicles) {
    const docs = [v.documents.emission, v.documents.insurance, v.documents.revenueLicense];
    for (const d of docs) {
      if (!d) continue;
      if (d.isExpired) {
        expired++;
      } else if (d.daysUntilExpiry !== null && d.daysUntilExpiry <= EXPIRY_WARNING_DAYS) {
        needsRenewal++;
        valid++;
      } else {
        valid++;
      }
      // emission FAIL also counts as an issue
      if (d.statusBadge === DOCUMENT_STATUS.FAIL) expired++;
    }
  }

  let overallStatus;
  if (licenseStatus === LICENSE_STATUS.SUSPENDED || expired > 0) {
    overallStatus = 'HAS_EXPIRED';
  } else if (needsRenewal > 0) {
    overallStatus = 'HAS_ISSUES';
  } else {
    overallStatus = 'ALL_VALID';
  }

  return {
    totalVehicles: vehicles.length,
    validDocuments: valid,
    expiredDocuments: expired,
    documentsNeedingRenewal: needsRenewal,
    overallStatus,
  };
};

/** Format a populated vehicle document */
const formatVehicle = (v) => ({
  registrationNo:  v.registrationNo,
  make:            v.make,
  model:           v.model,
  year:            v.yearOfMfg,
  vehicleClass:    v.vehicleClass,
  fuelType:        v.fuelType,
  color:           v.color,
  seatingCapacity: v.seatingCapacity,
  documents: {
    emission:       enrichEmission(v.emissionCertificate),
    insurance:      enrichInsurance(v.insuranceCertificate),
    revenueLicense: enrichRevenue(v.revenueLicense),
  },
});

// ────────────────────────────────────────────────────────
// ENDPOINT 1: POST /api/wallet/verify
// ────────────────────────────────────────────────────────
exports.verifyIdentity = async (req, res, next) => {
  try {
    const { nic, licenseNumber } = req.body;

    // ── Validate inputs ───────────────────────────────────
    if (!nic || !licenseNumber) {
      return res.status(HTTP.BAD_REQUEST).json({
        success: false,
        message: 'nic and licenseNumber are required',
      });
    }

    const normalizedNic     = nic.trim().toUpperCase();
    const normalizedLicense = licenseNumber.trim().toUpperCase();

    if (!isValidNic(normalizedNic)) {
      return res.status(HTTP.BAD_REQUEST).json({
        success: false,
        message: 'Invalid NIC format. Use old format (9 digits + V/X) or new format (12 digits)',
      });
    }

    // ── Query DB ──────────────────────────────────────────
    const wallet = await DriverWallet
      .findOne({ nic: normalizedNic, licenseNumber: normalizedLicense })
      .populate('vehicles');

    if (!wallet) {
      return res.status(HTTP.NOT_FOUND).json({
        success: false,
        message: 'No wallet found for the provided NIC and License Number',
      });
    }

    // ── Format driving license with live badge ────────────
    const dlRaw = wallet.drivingLicense.toObject ? wallet.drivingLicense.toObject() : { ...wallet.drivingLicense };
    const dlValidity = computeValidity(dlRaw.expiryDate);
    const drivingLicense = {
      ...dlRaw,
      ...dlValidity,
      statusBadge: dlRaw.status,
    };

    // ── Format vehicles ───────────────────────────────────
    const vehicles = wallet.vehicles.map(formatVehicle);

    // ── Summary ───────────────────────────────────────────
    const summary = buildSummary(dlRaw.status, vehicles);

    res.status(HTTP.OK).json({
      success: true,
      wallet: {
        owner: {
          nic:           wallet.nic,
          licenseNumber: wallet.licenseNumber,
          fullName:      wallet.fullName,
          dateOfBirth:   wallet.dateOfBirth,
          address:       wallet.address,
          phoneNumber:   wallet.phoneNumber,
          bloodGroup:    wallet.bloodGroup,
          photo:         wallet.photo,
        },
        drivingLicense,
        vehicles,
        summary,
      },
    });

  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────
// ENDPOINT 2: GET /api/wallet/vehicle/:registrationNo
// ────────────────────────────────────────────────────────
exports.getSingleVehicle = async (req, res, next) => {
  try {
    const { registrationNo } = req.params;
    const { nic }            = req.query;

    if (!nic) {
      return res.status(HTTP.BAD_REQUEST).json({
        success: false,
        message: 'nic is required as a query parameter',
      });
    }

    const normalizedNic = nic.trim().toUpperCase();

    if (!isValidNic(normalizedNic)) {
      return res.status(HTTP.BAD_REQUEST).json({
        success: false,
        message: 'Invalid NIC format',
      });
    }

    const vehicle = await Vehicle.findOne({
      registrationNo: registrationNo.trim().toUpperCase(),
    });

    if (!vehicle) {
      return res.status(HTTP.NOT_FOUND).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    if (vehicle.ownerNic !== normalizedNic) {
      return res.status(HTTP.FORBIDDEN).json({
        success: false,
        message: 'This vehicle is not registered to your NIC',
      });
    }

    res.status(HTTP.OK).json({
      success: true,
      vehicle: formatVehicle(vehicle),
    });

  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────
// ENDPOINT 3: GET /api/wallet/check/:nic
// ────────────────────────────────────────────────────────
exports.checkDocumentValidity = async (req, res, next) => {
  try {
    const normalizedNic = req.params.nic.trim().toUpperCase();

    if (!isValidNic(normalizedNic)) {
      return res.status(HTTP.BAD_REQUEST).json({
        success: false,
        message: 'Invalid NIC format',
      });
    }

    const wallet = await DriverWallet
      .findOne({ nic: normalizedNic })
      .populate('vehicles');

    if (!wallet) {
      return res.status(HTTP.NOT_FOUND).json({
        success: false,
        message: 'No wallet found for this NIC',
      });
    }

    const vehicles = wallet.vehicles.map(formatVehicle);
    const dlStatus = wallet.drivingLicense?.status || LICENSE_STATUS.VALID;
    const summary  = buildSummary(dlStatus, vehicles);

    res.status(HTTP.OK).json({
      success: true,
      nic:     wallet.nic,
      summary,
    });

  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────
// ENDPOINT 4: POST /api/wallet/refresh
// ────────────────────────────────────────────────────────
exports.refreshWalletData = async (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  return exports.verifyIdentity(req, res, next);
};

// ────────────────────────────────────────────────────────
// ENDPOINT 5: GET /api/wallet/health
// ────────────────────────────────────────────────────────
exports.healthCheck = (req, res) => {
  const mongoose = require('mongoose');
  res.status(HTTP.OK).json({
    status:    'OK',
    database:  mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    service:   'mock_data_loader',
  });
};
