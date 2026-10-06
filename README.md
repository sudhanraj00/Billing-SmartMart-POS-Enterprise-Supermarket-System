# SmartMart POS - Supermarket Billing & Inventory Management System

![Version](https://img.shields.io/badge/version-1.0.0-emerald)
![License](https://img.shields.io/badge/license-UNLICENSED-blue)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-17%20passed-success)

A production-ready, touch-friendly Supermarket Point of Sale (POS) and Inventory Management System architected for small-to-medium supermarkets. Built with a fast cashier billing terminal, barcode scanner integration, atomic stock transactions, multi-tender payment processing, GST tax calculations, thermal receipt printing, and comprehensive audit logs.

---

## 🌟 Key Features

1. **High-Speed Touch & Scanner Billing Terminal (POS)**:
   - Continuous barcode input focus with USB hardware scanner support (keystroke emulation)
   - Real-time product search by name, barcode, SKU, category, or brand
   - Quantity adjustment with live available stock checking (prevents overselling)
   - Multi-tier discounts with manager PIN authorization
   - Multi-tender payments: Cash (with quick change calculator), UPI / QR, Card, Split Payment, and Store Credit (Pay Later)
   - Held / Parked carts: Suspend and resume transactions on the fly
   - POS Keyboard Shortcuts (`F2`: Focus Barcode, `F4`: Hold Bill, `F8`: Payment, `F9`: Complete Sale, `Esc`: Close Modal)
   - Dual receipt generation: Standard 80mm thermal receipt and A4 formal tax invoice

2. **Strict Inventory & Stock Movement Ledger**:
   - Double-entry stock ledger: Every stock alteration is recorded in `StockMovement` with previous balance, quantity change, new balance, movement type (`SALE`, `PURCHASE`, `RETURN_RESTOCK`, `ADJUSTMENT_DAMAGE`, `ADJUSTMENT_EXPIRED`, `ADJUSTMENT_WASTAGE`, `ADJUSTMENT_MANUAL`, `INITIAL`), reference ID, user, and timestamp
   - Real-time low-stock alerts and out-of-stock prevention
   - Expiring-soon alerts (configurable 30-day lookahead)
   - Manual stock adjustment with audit reasons (breakage, expiry, wastage, physical audit)
   - Supplier inward purchase entries that atomically increment inventory and update latest cost prices

3. **Tax & Invoicing Compliance Engine**:
   - Configurable tax rules (inclusive and exclusive tax pricing modes)
   - CGST, SGST, and IGST breakdown
   - Safe decimal arithmetic and round-off to the nearest rupee
   - Immutable historical invoices: Product prices, costs, and tax amounts are captured as snapshots on each invoice item; future product catalog changes never mutate past invoices

4. **Returns, Refunds & Voids**:
   - Invoice lookup by invoice number or customer phone
   - Full and partial line item returns with condition tracking (restockable vs damaged)
   - Automatic restocking of returnable items with stock ledger entries
   - Authorized invoice voiding requiring Admin or Manager PIN

5. **Cashier Shift Reconciliation**:
   - Cashier shift opening with opening register float
   - Live tracking of cash sales and cash refunds
   - Shift closing with counted cash, automatic variance calculation, and mandatory variance explanations

6. **Executive Dashboard & Business Reports**:
   - Real-time KPIs: Today's revenue, invoices count, estimated profit margin, items sold, low-stock count, customer dues
   - Interactive charts: 7-day revenue trend, top selling products, department breakdown
   - Reports: Sales by date range, sales by cashier, GST/tax liability summary, inventory asset valuation at cost vs retail
   - 1-Click CSV export for all reports and product catalogs

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Zustand |
| **Backend** | Node.js, Express, TypeScript, Zod, Helmet, CORS, Cookie-Parser, Winston |
| **Database** | PostgreSQL 16 (with dual-mode SQLite for zero-dependency local dev/tests), Prisma ORM |
| **Authentication** | JWT stored in secure HTTP-only cookies, Argon2/Bcrypt hashing |
| **Testing** | Vitest (13 backend integration/unit tests + 4 frontend unit tests) |
| **DevOps** | Docker, Docker Compose, Multi-stage Dockerfiles, Nginx reverse proxy |

---

## 👥 User Roles & Demo Credentials

> [!NOTE]
> All demo accounts share the default development password: `Password@123`.

| Role | Email | Password | Manager PIN | Access Scope |
|---|---|---|---|---|
| **Admin** | `admin@smartmart.com` | `Password@123` | `1234` | Full system access: POS, dashboard, products, stock, reports, users, settings, audit logs |
| **Cashier** | `cashier@smartmart.com` | `Password@123` | N/A | POS billing terminal, invoice search, shift management, customer quick add |
| **Inventory Manager** | `inventory@smartmart.com` | `Password@123` | N/A | Products catalog, inventory stock, adjustments, purchases, suppliers, valuation reports |

---

## 🚀 Quick Start Guide (Local Development)

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### 1. Installation
Clone the repository and install dependencies:
```bash
# In project root
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Database Setup & Seeding
SmartMart POS includes a realistic supermarket seed with 3 users, 32 products across 6 departments, categories, brands, suppliers, customers, and active shifts:
```bash
cd server
# Synchronize database schema (creates dev.db with all 24 tables)
npm run prisma:push

# Seed realistic supermarket catalog & demo accounts
npm run seed
cd ..
```

### 3. Run Development Servers
Start both backend and frontend concurrently:
```bash
npm run dev
```
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 🐳 Docker Production Setup

To run the complete production stack (PostgreSQL 16 + Express API + Nginx SPA):
```bash
# Start all containers in background
docker compose up -d

# View service logs
docker compose logs -f

# Stop containers
docker compose down
```
- Frontend will be available at [http://localhost:3000](http://localhost:3000)
- Backend will be available at [http://localhost:5000](http://localhost:5000)
- PostgreSQL will be running on port `5432` with persistent volume `smartmart_pgdata`

---

## 🧪 Running Automated Tests

Run the Vitest test suites across the project:
```bash
# Run server integration and unit tests (RBAC, Barcode, Atomic Checkout, Stock, Idempotency, Taxes)
cd server
npm test

# Run client cart and pricing calculation tests
cd ../client
npm test
```

---

## ⌨️ POS Keyboard Shortcuts

| Key | Action |
|---|---|
| **F2** | Immediately focus barcode scanner / search input |
| **F4** | Hold / Park active customer bill |
| **F8** | Open payment screen (Cash, UPI, Card, Split, Credit) |
| **F9** | Complete and submit sale transaction |
| **Escape** | Close active modal dialog |

---

## 🔒 Security Best Practices

- **HTTP-Only Cookies**: Authentication JWT tokens are stored exclusively in HTTP-only, secure, same-site cookies to eliminate XSS token theft.
- **Idempotency Protection**: Every checkout submission sends a unique idempotency key; duplicate requests return the original receipt without double-charging or deducting stock twice.
- **No Floating Point Currency Arithmetic**: All monetary calculations utilize standard 2-decimal arithmetic and banker's rounding to eliminate floating-point precision errors.
- **Audit Logging**: Every sensitive operation (price change, invoice void, return, manual stock correction, login) is recorded with IP address, user agent, before/after values, and timestamp.
