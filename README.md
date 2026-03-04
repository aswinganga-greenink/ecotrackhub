# 🌿 CarbonTrackHub

A full-stack carbon emissions tracking and prediction platform for Gram Panchayats. Built with **FastAPI** (backend) and
**React + Vite** (frontend).

---

## 📁 Project Structure

```
ecotrackhub/
├── backend/ # FastAPI backend
│ ├── main.py # API routes and app entry point
│ ├── models.py # SQLAlchemy database models
│ ├── schemas.py # Pydantic request/response schemas
│ ├── calculations.py # Emission calculation logic + DB seeding
│ ├── ai_service.py # Gemini AI prediction integration
│ ├── auth.py # Password hashing and JWT utilities
│ ├── dependencies.py # FastAPI dependency injection (auth guards)
│ ├── database.py # SQLAlchemy engine and session setup
│ ├── email_service.py # OTP email delivery via SMTP
│ ├── migrate_otp.py # Migration: adds OTP verifications table
│ ├── init_db.py # Standalone DB initializer (one-time use)
│ ├── kerala_panchayats.json# Panchayat reference data
│ ├── requirements.txt # Python dependencies
│ ├── .env # Environment variables (not committed)
│ └── carbontrackhub.db # SQLite database (auto-created)
│
├── src/ # React frontend
│ ├── pages/
│ │ ├── Login.tsx # Login page
│ │ ├── SignUp.tsx # Registration wizard (OTP + firm type)
│ │ ├── Dashboard.tsx # User home with emission overview
│ │ ├── DataEntry.tsx # Monthly data submission form
│ │ ├── Analytics.tsx # Charts, trends, CSV/PDF export
│ │ ├── Predictions.tsx # AI forecast with localStorage caching
│ │ └── AdminPanel.tsx # Admin dashboard and user management
│ ├── components/
│ │ ├── dashboard/
│ │ │ ├── EmissionChart.tsx # Monthly trend line/bar chart
│ │ │ └── SectorPieChart.tsx # Sector-wise pie chart
│ │ └── admin/
│ │ ├── PanchayatData.tsx # Emission data table (with firm type)
│ │ └── ReportExport.tsx # CSV + PDF export (Admin panel)
│ ├── contexts/
│ │ └── AuthContext.tsx # Auth state, login, signup, logout
│ ├── lib/
│ │ ├── api.ts # HTTP client with token management
│ │ └── carbonCalculations.ts # Frontend emission helpers
│ └── types/
│ └── carbon.ts # TypeScript interfaces
│
└── ML_Model/ # Keras-based ML model (reference)
└── carbon_emission_model.keras
```

---

## ⚙️ Environment Variables (`.env`)

Create `backend/.env` with the following:

```env
GEMINI_API_KEY=your_gemini_api_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=your_email@gmail.com
```

> **Note:** Admin credentials are **always synced from `.env` on startup**. Change them in `.env` and restart the
backend to apply.

---

## 🚀 Running the Project

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### Frontend

```bash
npm install
npm run dev
```

Frontend runs at: `http://localhost:8080` (or 8081 if 8080 is occupied)

---

## 🧮 Emission Calculations

All emission factors follow the **GHG Protocol** and IPCC guidelines.

### Emission Factors Used

| Source | Factor | Unit |
|--------|--------|------|
| Electricity | 0.716 kg CO₂e | per kWh |
| Diesel | 2.68 kg CO₂e | per litre |
| Petrol | 2.32 kg CO₂e | per litre |
| Waste (landfill) | 0.586 kg CO₂e | per kg |
| Water (treatment) | 0.000344 kg CO₂e | per litre |

### Offset Factors

| Source | Factor | Unit |
|--------|--------|------|
| Trees planted | 21.77 kg CO₂ | per tree per year (÷12 for monthly) |
| Solar generation | 0.716 kg CO₂ | per unit (kWh) offset |

### Formulas

```
Total Emissions (kg CO₂e) =
(electricity_kwh × 0.716)
+ (diesel_liters × 2.68)
+ (petrol_liters × 2.32)
+ (waste_kg × 0.586)
+ (water_liters × 0.000344)

Total Offsets (kg CO₂e) =
(trees_planted × 21.77 / 12)
+ (solar_units × 0.716)

Net Carbon Footprint = Total Emissions − Total Offsets

Carbon Status:
Net ≤ 0 → ✅ Carbon Neutral
Net > 0 → ❌ Emitting
```

---

## 📊 Charts

| Component | Location | Description |
|-----------|----------|-------------|
| Monthly Trend Chart | `src/components/dashboard/EmissionChart.tsx` | Line/bar chart of monthly emissions vs offsets |
| Sector Pie Chart | `src/components/dashboard/SectorPieChart.tsx` | Pie chart of emission share by sector |
| Analytics Charts | `src/pages/Analytics.tsx` | Recharts-based trend and sector analysis |

---

## 📤 CSV & PDF Export

| Location | What it exports |
|----------|----------------|
| `src/components/admin/ReportExport.tsx` | **Admin panel** — CSV with all user/firm/emission data; PDF via HTML print
dialog |
| `src/pages/Analytics.tsx` → `handleExport()` | **Analytics page** — CSV of monthly trend data; PDF with sector + trend
tables |

**CSV includes:** Month, Year, User, Organization Type, Organization Name, Electricity, Diesel, Petrol, Waste (kg),
Water (L), Solar Units, Trees Planted, Total Emissions (kg CO₂), Total Offsets (kg CO₂)

**PDF export** opens a styled, print-ready page in a new tab. Use **Ctrl+P → Save as PDF** to download.

---

## 🤖 AI Predictions (Gemini)

- Uses **Google Gemini 2.5 Flash** via `google-generativeai`
- Predictions are **cached in `localStorage`** keyed on a data fingerprint (record count + last entry ID)
- AI is only re-called when **new data is submitted** (fingerprint changes)
- Forecast **starts from the month after the last submitted data entry**, not today's date
- Requires at least one month of data to generate a prediction

---

## 🔐 Authentication

- JWT-based with `python-jose`
- Passwords hashed with `passlib[argon2]` (requires `argon2-cffi`)
- OTP verification via email before account creation
- Roles: `admin` (full access) and `user` (own data only)

---

## 🏢 User Registration Fields

| Field | Description |
|-------|-------------|
| Username | Unique login name |
| Email | Used for OTP delivery |
| Password | Min length enforced |
| Organization Type | school, industry, shop, household, office, NGO, other |
| Organization Name | Free text (e.g. "St. Mary's School") |

---

## 📦 Key Dependencies

### Backend (`requirements.txt`)
- `fastapi`, `uvicorn[standard]` — API server
- `sqlalchemy`, `sqlmodel` — ORM and models
- `passlib[bcrypt]`, `argon2-cffi` — Password hashing
- `python-jose[cryptography]` — JWT tokens
- `google-generativeai` — Gemini AI
- `python-dotenv` — Environment variable loading

### Frontend
- `react`, `vite` — UI framework and bundler
- `recharts` — Charts (pie, line, bar)
- `lucide-react` — Icons
- `shadcn/ui` — UI component library
- `react-router-dom` — SPA routing
- `axios` / `fetch` — API communication

---

## 🗄️ Database

SQLite database (`carbontrackhub.db`) stored in the `backend/` directory. Path is resolved dynamically relative to
`database.py` — **no hardcoded paths**.

Tables:
- `users` — user accounts with firm_type and firm_name
- `panchayats` — local government units
- `monthly_data` — monthly resource usage entries
- `emission_factors` — configurable GHG factors
- `carbon_metrics` — cached monthly aggregates
- `otp_verifications` — temporary OTP tokens

---

## 📝 Data Entry

Users submit monthly readings via the **Data Entry** page:

| Input | Unit |
|-------|------|
| Electricity consumed | kWh |
| Diesel used | Litres |
| Petrol used | Litres |
| Solid waste generated | kg |
| Water consumed | Litres |
| Solar energy generated | Units (kWh) |
| Trees planted | Count |

Available years: **2025, 2026**