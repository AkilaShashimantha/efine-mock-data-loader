// seed/seedWallet.js — Idempotent database seeder
require('dotenv').config();
const mongoose   = require('mongoose');
const DriverWallet = require('../models/DriverWallet');
const Vehicle      = require('../models/Vehicle');
const mockDrivers  = require('./walletSeedData');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // ── Drop existing data (idempotent) ──────────────────
    await DriverWallet.deleteMany({});
    await Vehicle.deleteMany({});
    console.log('🗑️  Cleared DriverWallet and Vehicle collections');

    let driverCount  = 0;
    let vehicleCount = 0;

    // ── Insert vehicles first, then link to driver ────────
    for (const data of mockDrivers) {
      const vehicleIds = [];

      for (const vData of data.vehicles) {
        vData.ownerNic = data.driver.nic;
        const vehicle = await Vehicle.create(vData);
        vehicleIds.push(vehicle._id);
        vehicleCount++;
      }

      await DriverWallet.create({
        ...data.driver,
        vehicles: vehicleIds,
      });

      driverCount++;
    }

    console.log(`\n✅ Seeded ${driverCount} drivers with ${vehicleCount} vehicles total`);
    console.log('\n📋 Drivers seeded:');
    mockDrivers.forEach((d) => {
      console.log(`   • ${d.driver.fullName}  (${d.driver.nic}) — ${d.vehicles.length} vehicle(s)`);
    });

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seed();
