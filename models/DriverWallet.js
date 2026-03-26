// models/DriverWallet.js — Driver identity and license
const mongoose = require('mongoose');
const { LICENSE_STATUS, BLOOD_GROUPS } = require('../config/constants');

// ── Driving License sub-schema ───────────────────────────
const DrivingLicenseSchema = new mongoose.Schema({
  licenseNo:        { type: String },
  issueDate:        { type: Date },
  expiryDate:       { type: Date },
  vehicleClasses:   [{ type: String }],
  issuingAuthority: { type: String },
  restrictions:     { type: String },
  status:           { type: String, enum: Object.values(LICENSE_STATUS) },
}, { _id: false });

// ── DriverWallet (main schema) ────────────────────────────
const DriverWalletSchema = new mongoose.Schema({
  nic: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
    uppercase: true,
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
    uppercase: true,
  },
  fullName:    { type: String, required: true },
  dateOfBirth: { type: Date },
  address:     { type: String },
  phoneNumber: { type: String },
  email:       { type: String },
  bloodGroup:  { type: String, enum: BLOOD_GROUPS },
  photo:       { type: String, default: 'https://placeholder.com/driver-photo.png' },

  drivingLicense: DrivingLicenseSchema,

  vehicles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' }],
}, { timestamps: true });

module.exports = mongoose.model('DriverWallet', DriverWalletSchema);
