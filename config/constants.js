// ─────────────────────────────────────────────────────────
// config/constants.js
// Central constants — mock_data_loader backend
// ─────────────────────────────────────────────────────────

const APP = {
  NAME:    'e-Fine SL Digital Wallet API',
  VERSION: '1.0.0',
  PORT:    process.env.PORT || 5001,
  ENV:     process.env.NODE_ENV || 'development',
};

const HTTP = {
  OK:           200,
  CREATED:      201,
  BAD_REQUEST:  400,
  FORBIDDEN:    403,
  NOT_FOUND:    404,
  SERVER_ERROR: 500,
};

const DOCUMENT_STATUS = {
  VALID:     'VALID',
  EXPIRED:   'EXPIRED',
  ACTIVE:    'ACTIVE',
  CANCELLED: 'CANCELLED',
  PASS:      'PASS',
  FAIL:      'FAIL',
};

const LICENSE_STATUS = {
  VALID:     'VALID',
  EXPIRED:   'EXPIRED',
  SUSPENDED: 'SUSPENDED',
};

const VEHICLE_CLASSES = {
  MOTOR_CAR:     'MOTOR CAR',
  MOTOR_LORRY:   'MOTOR LORRY',
  MOTOR_CYCLE:   'MOTOR CYCLE',
  THREE_WHEELER: 'THREE WHEELER',
  GOODS_VEHICLE: 'GOODS VEHICLE',
  BUS:           'BUS',
};

const FUEL_TYPES = {
  PETROL:   'Petrol',
  DIESEL:   'Diesel',
  ELECTRIC: 'Electric',
  HYBRID:   'Hybrid',
  CNG:      'CNG',
};

const INSURANCE_TYPES = {
  THIRD_PARTY:   'THIRD_PARTY',
  COMPREHENSIVE: 'COMPREHENSIVE',
  VIP:           'VIP',
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const NIC_REGEX = {
  OLD: /^[0-9]{9}[VXvx]$/,   // 9 digits + V or X
  NEW: /^[0-9]{12}$/,         // 12 digits
};

const EXPIRY_WARNING_DAYS = 30; // warn if expiring within 30 days

module.exports = {
  APP,
  HTTP,
  DOCUMENT_STATUS,
  LICENSE_STATUS,
  VEHICLE_CLASSES,
  FUEL_TYPES,
  INSURANCE_TYPES,
  BLOOD_GROUPS,
  NIC_REGEX,
  EXPIRY_WARNING_DAYS,
};
