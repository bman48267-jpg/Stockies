# Stockies — Indian Investment Research Platform

> A professional, production-quality web application for researching Indian stocks and mutual funds,
> screening investments, and tracking personal portfolios.

---

## ⚠️ Disclaimer

Stockies provides financial data and analytical tools for informational purposes only.
It is not investment advice.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Data Fetching | TanStack Query v5 + Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Routing | React Router v7 |
| Backend | Python 3.11 + FastAPI + SQLAlchemy 2 + Alembic |
| Database | SQLite (dev) / PostgreSQL-compatible (prod) |
| Validation | Pydantic v2 |
| HTTP Client | httpx |
| Testing | pytest (backend) |

---

## Features

- **Stock Research** — Real-time quotes, charts, fundamentals, ownership data
- **Stock Screener** — Filter by PE, ROE, ROCE, debt, growth, and 15+ metrics
- **Mutual Funds** — NAV history, CAGR, rolling returns, performance analytics
- **Fund Comparison** — Side-by-side comparison across AMCs and categories
- **Portfolio Overlap** — Common holdings analysis across fund schemes
- **SIP Calculator** — Normal and step-up SIP with expense ratio modelling
- **Portfolio Tracker** — Stock and MF transactions with P&L and XIRR
- **Exports** — CSV, Excel, and TXT portfolio reports

---

## Project Structure

```
D:/Stockies/
├── frontend/          React + Vite + TypeScript
│   └── src/
│       ├── api/       Axios client + API calls
│       ├── components/ Reusable UI components
│       ├── constants/  App-wide constants
│       ├── hooks/      Custom React hooks (useTheme, etc.)
│       ├── layouts/    AppLayout, PortfolioLayout, Header
│       ├── pages/      One file per route
│       ├── types/      TypeScript types for all entities
│       └── utils/      Formatting helpers (Indian locale)
│
├── backend/           FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/routes/   FastAPI route handlers
│   │   ├── core/         Config, logging, security
│   │   ├── db/
│   │   │   ├── database.py
│   │   │   └── models/   SQLAlchemy ORM models
│   │   ├── schemas/      Pydantic request/response schemas
│   │   ├── services/     Business logic
│   │   ├── providers/    External data provider adapters
│   │   ├── calculations/ CAGR, SIP, XIRR, rolling returns
│   │   └── utils/        Market hours, date/time helpers
│   ├── alembic/       Database migrations
│   ├── tests/         pytest test suite
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your values:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description |
|---|---|
| `SECRET_KEY` | JWT signing key (generate with `openssl rand -hex 32`) |
| `DATABASE_URL` | SQLite (dev) or PostgreSQL URL |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `STOCK_DATA_PROVIDER` | `yfinance` (default) |
| `MF_DATA_PROVIDER` | `mfapi` (default) |

---

## Setup

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env

# Run migrations (or tables auto-created in dev)
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend available at: http://localhost:5173

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

---

## Data Providers

| Data Type | Provider | Notes |
|---|---|---|
| Stock quotes | yfinance | Free, NSE (`.NS`) and BSE (`.BO`) supported |
| Stock fundamentals | yfinance | Available fields only; "Data unavailable" shown otherwise |
| Mutual fund NAV | MFAPI.in | Free AMFI data |
| MF holdings | AMFI/provider | Requires configured provider |

All providers are abstracted behind interfaces in `backend/app/providers/`.
Swap providers without touching business logic.

---

## Development Phases

| Phase | Focus | Status |
|---|---|---|
| 1 | Project scaffold, routing, basic UI shell | ✅ Complete |
| 2 | Database models, migrations, repositories | ✅ Complete |
| 3 | Provider architecture, caching | ⏳ Pending |
| 4 | Stocks — search, quote, history, fundamentals | ⏳ Pending |
| 5 | Stock screener | ⏳ Pending |
| 6 | Mutual funds | ⏳ Pending |
| 7 | MF comparison + overlap | ⏳ Pending |
| 8 | SIP calculator | ✅ Complete (functional preview) |
| 9 | Portfolio — transactions, holdings, P&L | ⏳ Pending |
| 10 | XIRR implementation | ⏳ Pending |
| 11 | Portfolio analytics + charts | ⏳ Pending |
| 12 | Exports — CSV, Excel, TXT | ⏳ Pending |
| 13 | Authentication — JWT | ⏳ Pending |
| 14 | Polish — responsive, dark/light, a11y | ⏳ Pending |
| 15 | Final QA | ⏳ Pending |

---

## Known Limitations (Phase 1)

- No real market data yet — providers integrated in Phase 3/4
- Authentication not yet implemented — Phase 13
- Portfolio is read-only shell — Phase 9
- Stock screener is UI-only — Phase 5
