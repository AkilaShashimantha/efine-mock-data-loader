# e-Fine SL — Digital Wallet Mock Data API

A standalone Node.js REST API serving digital wallet mock documents
(Driving License, Emission Certificate, Insurance, Revenue License)
for the e-Fine SL traffic management mobile app.

This service is completely **separate** from the main `backend_api`.
It uses its own MongoDB database (`efine_mock_wallet`) and has **no
authentication** — identity is verified using NIC + License Number only.

---

## Local Setup

```bash
# 1. Clone and enter directory
cd mock_data_loader

# 2. Install dependencies
npm install

# 3. Create .env (copy from example)
cp .env.example .env
# Edit .env with your MongoDB URI

# 4. Seed mock data
npm run seed:wallet

# 5. Start development server
npm run dev
```

Server runs on `http://localhost:5001`

---

## API Endpoints

### POST `/api/wallet/verify`
Verify driver identity and load full digital wallet.

**Request body:**
```json
{
  "nic": "199012345678",
  "licenseNumber": "B1234567"
}
```

**Success (200):**
```json
{
  "success": true,
  "wallet": {
    "owner": { "nic": "...", "fullName": "...", "bloodGroup": "B+" },
    "drivingLicense": { "status": "VALID", "validityBadge": "VALID", "daysUntilExpiry": 365 },
    "vehicles": [
      {
        "registrationNo": "NCLD5469",
        "documents": {
          "emission":       { "overallStatus": "PASS", "validityBadge": "VALID" },
          "insurance":      { "status": "ACTIVE", "daysUntilExpiry": 275 },
          "revenueLicense": { "status": "VALID" }
        }
      }
    ],
    "summary": {
      "totalVehicles": 1,
      "validDocuments": 4,
      "expiredDocuments": 0,
      "documentsNeedingRenewal": 0,
      "overallStatus": "ALL_VALID"
    }
  }
}
```

**Error (404):**
```json
{ "success": false, "message": "No wallet found for the provided NIC and License Number" }
```

---

### GET `/api/wallet/vehicle/:registrationNo?nic=<NIC>`
Get all documents for a single vehicle.

**Error (403):**
```json
{ "success": false, "message": "This vehicle is not registered to your NIC" }
```

---

### GET `/api/wallet/check/:nic`
Quick summary check (for dashboard badge).

**Success (200):**
```json
{
  "success": true,
  "nic": "199012345678",
  "summary": { "overallStatus": "ALL_VALID", "expiredDocuments": 0 }
}
```

---

### POST `/api/wallet/refresh`
Same as `/verify` but with `Cache-Control: no-store` header.

---

### GET `/api/wallet/health`
Service health check.

```json
{ "status": "OK", "database": "connected", "service": "mock_data_loader" }
```

---

## Seeded Test Drivers

| Driver | NIC | License | Status |
|--------|-----|---------|--------|
| M.A. Shashimantha | 199012345678 | B1234567 | All valid |
| K.P. Jayawardena  | 198756789012 | A9876543 | 3 vehicles, mixed |
| R.M. Perera       | 200034567890 | C5678901 | License SUSPENDED |
| A.H. Fernando     | 197890123456 | D2345678 | All EXPIRED |

---

## Deploy to Render

1. Push this folder to a **separate GitHub repository**
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your repository
4. Set these environment variables:
   - `MONGODB_URI` — your Atlas connection string with `/efine_mock_wallet` database
   - `NODE_ENV` = `production`
5. Build command: `npm install`
6. Start command: `node server.js`

The `render.yaml` file in this repo configures this automatically.

---

## Flutter App Connection

The Flutter app calls **two separate backends**:

```dart
// Main API (fines, auth, users)
const String mainApiUrl = 'https://backend-api.onrender.com/api';

// Wallet API (this service)
const String walletApiUrl = 'https://efine-mock-data-loader.onrender.com/api/wallet';
```

Use `lib/services/wallet_service.dart` for all wallet-related API calls.
