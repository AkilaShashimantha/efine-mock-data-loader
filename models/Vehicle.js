// models/Vehicle.js — Vehicle with embedded sub-schemas
const mongoose = require('mongoose');
const { DOCUMENT_STATUS, INSURANCE_TYPES, FUEL_TYPES, VEHICLE_CLASSES } = require('../config/constants');

// ── Emission Certificate ──────────────────────────────────
const EmissionCertificateSchema = new mongoose.Schema({
  serialNo:      { type: String },
  systemNo:      { type: String },
  dateOfIssue:   { type: Date },
  validTill:     { type: Date },
  testCentre:    { type: String },
  inspector:     { type: String },
  instrumentNo:  { type: String },
  lane:          { type: Number },
  testFee:       { type: Number },
  testStartTime: { type: String },
  testEndTime:   { type: String },
  odometer:      { type: Number },
  referenceNo:   { type: String },
  readings: {
    idle: {
      rpm:  { type: Number },
      hc:   { type: Number },
      co:   { type: Number },
      o2:   { type: Number },
      co2:  { type: Number },
    },
    rpm2500: {
      rpm:  { type: Number },
      hc:   { type: Number },
      co:   { type: Number },
      o2:   { type: Number },
      co2:  { type: Number },
    },
    oilTemp: { type: String },
  },
  standards: {
    hc: { type: Number },
    co: { type: Number },
  },
  overallStatus:  { type: String, enum: [DOCUMENT_STATUS.PASS, DOCUMENT_STATUS.FAIL] },
  issuingOffice:  { type: String },
  qrCodeData:     { type: String },
  issuingCompany: { type: String },
}, { _id: false });

// ── Insurance Certificate ─────────────────────────────────
const InsuranceCertificateSchema = new mongoose.Schema({
  certificateType:    { type: String, enum: Object.values(INSURANCE_TYPES) },
  policyNo:           { type: String },
  insuredName:        { type: String },
  insuredAddress:     { type: String },
  insurer:            { type: String },
  insurerAddress:     { type: String },
  periodOfCoverStart: { type: Date },
  periodOfCoverEnd:   { type: Date },
  coverageType:       { type: String },
  premiumAmount:      { type: Number },
  status:             { type: String, enum: [DOCUMENT_STATUS.ACTIVE, DOCUMENT_STATUS.EXPIRED, DOCUMENT_STATUS.CANCELLED] },
  vehicleNo:          { type: String },
  make:               { type: String },
  model:              { type: String },
  engineNo:           { type: String },
  chassisNo:          { type: String },
  seatingCapacity:    { type: Number },
  issuingBranch:      { type: String },
  agentName:          { type: String },
}, { _id: false });

// ── Revenue License ───────────────────────────────────────
const RevenueLicenseSchema = new mongoose.Schema({
  licenseNo:        { type: String },
  issueDate:        { type: Date },
  expiryDate:       { type: Date },
  issuingAuthority: { type: String },
  annualFee:        { type: Number },
  status:           { type: String, enum: [DOCUMENT_STATUS.VALID, DOCUMENT_STATUS.EXPIRED] },
}, { _id: false });

// ── Vehicle (main schema) ─────────────────────────────────
const VehicleSchema = new mongoose.Schema({
  ownerNic:        { type: String, index: true },
  registrationNo:  { type: String, required: true, unique: true, index: true },
  make:            { type: String },
  model:           { type: String },
  yearOfMfg:       { type: Number },
  vehicleClass:    { type: String, enum: Object.values(VEHICLE_CLASSES) },
  chassisNo:       { type: String },
  engineNo:        { type: String },
  fuelType:        { type: String, enum: Object.values(FUEL_TYPES) },
  color:           { type: String },
  seatingCapacity: { type: Number },
  tareWeight:      { type: Number },

  emissionCertificate:  EmissionCertificateSchema,
  insuranceCertificate: InsuranceCertificateSchema,
  revenueLicense:       RevenueLicenseSchema,
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);
