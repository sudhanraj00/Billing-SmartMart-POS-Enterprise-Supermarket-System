# SmartMart POS - Phase 1: Architecture & Technical Specification

## 1. System Architecture Overview

SmartMart POS is architected as an enterprise-grade, high-performance Supermarket Billing and Inventory Management System designed specifically for fast-paced retail checkout, strict stock integrity, tax compliance (GST & standard VAT/sales tax), auditability, and role-based segregation of duties.

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT TIER                                      |
|  React 18 + Vite + TypeScript + Tailwind CSS + Lucide Icons + Recharts            |
|  - Barcode Scanner Hardware Listener (Keystroke buffer + HID emulation)          |
|  - Hotkeys Engine (F2: Search/Barcode, F4: Hold, F8: Pay, F9: Checkout, Esc: Exit)|
|  - Thermal Receipt (80mm / 58mm canvas) & A4 PDF Invoice Generator                |
|  - Responsive Layout (Touch POS for Counter, Adaptive Mobile for Back-office)    |
|  - Zustand State Stores (Auth, POS Cart, Active Shift, Global Notifications)      |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / JSON REST API / Secure Cookies
+------------------------------------------v----------------------------------------+
|                                  SERVER TIER                                      |
|  Node.js + Express + TypeScript                                                   |
|  - Security Layer: Helmet, CORS Whitelisting, Rate Limiter, CSRF Guard            |
|  - Auth Layer: Argon2/Bcrypt Password Hashing, Signed HTTP-Only JWT Cookie        |
|  - Validation Layer: Zod Schemas for all Request Payloads & Params                |
|  - Controller -> Service -> Repository Layer Pattern                              |
|  - Atomic Concurrency Engine: Database Transactions + Idempotency Keys           |
|  - Tax & Decimal Engine: Bank-standard round-off & immutable snapshot persistence |
|  - Audit Log Interceptor: Automatic ledgering of sensitive POS/Inventory events   |
+------------------------------------------+----------------------------------------+
                                           | Prisma ORM (Connection Pool)
+------------------------------------------v----------------------------------------+
|                                 DATABASE TIER                                     |
|  PostgreSQL 16 (or local dev database)                                           |
|  - 24 Relational Models with Strict Foreign Key Constraints                       |
|  - High-precision Decimal(12, 2) arithmetic for currency and inventory stock     |
|  - Double-entry Stock Movement Ledger (Audit trail for every unit changed)        |
|  - Invoice Snapshots (Historical product price/tax never alters completed sales) |
+-----------------------------------------------------------------------------------+
```

---

## 2. Complete Database Schema (Prisma Models & Relations)

SmartMart POS utilizes 24 database entities configured with strict foreign key constraints, composite unique indexes, safe decimal representations, and cascading rules.

### 2.1 Entity Relationship Diagram (Summary)
- **User**: Authentication, Role (`ADMIN`, `CASHIER`, `INVENTORY_MANAGER`), hashed manager PIN.
- **Store**: Store profile, GSTIN, currency (`₹`/`INR`), receipt headers/footers, pricing mode (`INCLUSIVE` vs `EXCLUSIVE`), negative stock policy.
- **Customer**: Contact details, GSTIN, credit limit, outstanding credit balance.
- **Supplier**: Vendor details, payment terms, GSTIN.
- **Category & Brand**: Hierarchical catalog classification.
- **Product**: Barcode (unique), SKU (unique), unit type (`PIECE`, `KG`, `GRAM`, `LITRE`, `ML`, `PACKET`, `BOX`), cost price, selling price, tax rate, current stock, reorder level, expiry tracking.
- **ProductBatch**: Batch tracking with distinct expiry dates and lot numbers.
- **StockMovement**: Immutable audit ledger recording `previousQuantity`, `quantityChanged`, `newQuantity`, `movementType`, `referenceId`, `userId`, and `timestamp`.
- **Purchase & PurchaseItem**: Inward goods receipt from suppliers, auto-incrementing inventory.
- **HeldSale**: Parked customer carts with serialized item snapshots for instant recall.
- **Invoice & InvoiceItem**: Immutable sales transaction record containing line-level snapshot of price, cost, tax rate, CGST, SGST, IGST, discounts, and idempotency protection.
- **Payment**: Multi-tender payment records (`CASH`, `UPI`, `CARD`, `BANK_TRANSFER`, `CREDIT`).
- **Return & ReturnItem**: Return processing with restocking vs damage segregation and credit note generation.
- **CashierShift**: Shift reconciliation tracking opening cash, sales, returns, expected cash, actual counted cash, and variance.
- **TaxSetting**: Configurable GST and VAT rates.
- **AuditLog**: Comprehensive log of logins, price overrides, voids, refunds, stock adjustments.
- **AppSetting**: Key-value system configuration.

---

## 3. Project Folder Structure

```
smartmart-pos/
├── docker-compose.yml              # Production container orchestration (Postgres, Server, Client)
├── package.json                    # Monorepo root workspace configuration
├── README.md                       # Comprehensive deployment, run, and user guide
├── docs/                           # Architectural, API, and implementation documentation
│   └── PHASE_1_ARCHITECTURE.md     # System architecture specification
├── server/                         # Backend Application (Node.js, Express, TypeScript, Prisma)
│   ├── Dockerfile                  # Production multi-stage Docker container for API
│   ├── package.json                # Server dependencies & scripts
│   ├── tsconfig.json               # Server TypeScript compiler configuration
│   ├── prisma/
│   │   ├── schema.prisma           # Master PostgreSQL Prisma schema
│   │   └── seed.ts                 # Database seeder (users, 30+ products, categories, suppliers)
│   └── src/
│       ├── config/                 # Environment variables, database client, constants
│       │   ├── env.ts              # Zod-validated environment config
│       │   └── prisma.ts           # Shared PrismaClient singleton
│       ├── constants/              # System error codes, roles, tax definitions
│       ├── middleware/             # Express middlewares
│       │   ├── auth.middleware.ts  # JWT verification via HTTP-only cookie
│       │   ├── rbac.middleware.ts  # Role-based route guard
│       │   ├── validate.ts         # Zod schema request validation middleware
│       │   ├── error.middleware.ts # Standardized error handler with safe client responses
│       │   ├── audit.middleware.ts # Auto-logging for critical operations
│       │   └── rate-limiter.ts     # IP-based rate limiting on sensitive routes
│       ├── utils/                  # Domain utilities
│       │   ├── decimal.ts          # Safe decimal arithmetic & round-off helpers
│       │   ├── tax-calculator.ts   # GST (CGST/SGST/IGST) & inclusive/exclusive tax engine
│       │   ├── jwt.ts              # Cookie generation & JWT token signing/verification
│       │   └── logger.ts           # Structured Winston/Pino logger
│       ├── validators/             # Zod validation schemas
│       │   ├── auth.validator.ts   # Login, registration, PIN verification schemas
│       │   ├── product.validator.ts# Product, category, brand validation schemas
│       │   ├── inventory.validator.ts # Stock adjustment & purchase schemas
│       │   ├── pos.validator.ts    # Cart, discount, checkout & hold schemas
│       │   └── return.validator.ts # Return & void approval schemas
│       ├── services/               # Business logic layer
│       │   ├── auth.service.ts
│       │   ├── product.service.ts
│       │   ├── inventory.service.ts
│       │   ├── pos.service.ts
│       │   ├── invoice.service.ts
│       │   ├── return.service.ts
│       │   ├── shift.service.ts
│       │   ├── report.service.ts
│       │   └── audit.service.ts
│       ├── controllers/            # HTTP request/response handlers
│       │   ├── auth.controller.ts
│       │   ├── product.controller.ts
│       │   ├── inventory.controller.ts
│       │   ├── pos.controller.ts
│       │   ├── invoice.controller.ts
│       │   ├── return.controller.ts
│       │   ├── shift.controller.ts
│       │   ├── report.controller.ts
│       │   ├── user.controller.ts
│       │   └── setting.controller.ts
│       ├── routes/                 # REST API v1 routing tables
│       │   ├── index.ts            # Master API router mounting `/api/v1`
│       │   ├── auth.routes.ts
│       │   ├── product.routes.ts
│       │   ├── inventory.routes.ts
│       │   ├── pos.routes.ts
│       │   ├── invoice.routes.ts
│       │   ├── return.routes.ts
│       │   ├── shift.routes.ts
│       │   ├── report.routes.ts
│       │   ├── user.routes.ts
│       │   └── setting.routes.ts
│       ├── app.ts                  # Express application setup with middleware chain
│       └── server.ts               # HTTP server bootstrap & graceful shutdown hooks
└── client/                         # Frontend Application (React, Vite, TypeScript, Tailwind)
    ├── Dockerfile                  # Production Nginx container for SPA
    ├── nginx.conf                  # Nginx reverse proxy configuration
    ├── package.json                # Client dependencies & scripts
    ├── vite.config.ts              # Vite bundler configuration & proxy
    ├── tailwind.config.js          # Tailwind CSS design system configuration
    ├── postcss.config.js           # PostCSS configuration
    ├── index.html                  # HTML entry point with meta tags & Google Inter font
    └── src/
        ├── assets/                 # Icons, logo, receipt styles
        ├── types/                  # TypeScript interface definitions mirroring backend models
        ├── store/                  # Zustand state management
        │   ├── authStore.ts        # User credentials, active role, permissions
        │   ├── cartStore.ts        # POS cart items, customer, discount, tax calculations
        │   └── shiftStore.ts       # Active cashier shift status
        ├── services/               # Axios/Fetch API client wrappers
        │   ├── api.ts              # Central API client with automatic credentials
        │   ├── auth.service.ts
        │   ├── product.service.ts
        │   ├── pos.service.ts
        │   ├── invoice.service.ts
        │   └── report.service.ts
        ├── hooks/                  # Custom React hooks
        │   ├── useBarcodeScanner.ts# Hardware USB barcode listener
        │   ├── useHotkeys.ts       # POS keyboard shortcut bindings (F2, F4, F8, F9, Esc)
        │   └── useCurrency.ts      # Safe monetary formatter
        ├── components/             # Reusable UI component library
        │   ├── ui/                 # Accessible buttons, inputs, modals, badges, cards, tables
        │   ├── layout/             # Header, Sidebar, BottomNav, ProtectedRoute
        │   ├── pos/                # POS-specific widgets
        │   │   ├── BarcodeBar.tsx  # Persistent focus scanner input
        │   │   ├── ProductCatalog.tsx # Touch product tile selector
        │   │   ├── CartTable.tsx   # Responsive cart line items table
        │   │   ├── CartSummary.tsx # Totals, discount, tax, round-off breakdown
        │   │   ├── PaymentModal.tsx# Tender selector (Cash, UPI, Card, Split, Credit)
        │   │   ├── HeldSalesModal.tsx # Retrieve and park held bills
        │   │   ├── CustomerModal.tsx # Quick customer search/create
        │   │   ├── ManagerPinModal.tsx # Manager override for high discounts/voids
        │   │   └── ReceiptModal.tsx # Printable thermal receipt & A4 invoice preview
        │   └── common/             # Skeletons, empty states, error boundaries, toasts
        ├── pages/                  # Top-level view routes
        │   ├── LoginPage.tsx       # Secure credentials login
        │   ├── DashboardPage.tsx   # Admin executive dashboard with Recharts
        │   ├── PosPage.tsx         # High-speed cashier checkout terminal
        │   ├── ProductsPage.tsx    # Product catalog with filters, CSV import/export
        │   ├── ProductFormPage.tsx # Add/edit product with barcode generator
        │   ├── CategoriesPage.tsx  # Category and brand management
        │   ├── InventoryPage.tsx   # Stock tracking, low-stock, adjustments, movements
        │   ├── PurchasesPage.tsx   # Supplier stock-in entry
        │   ├── SuppliersPage.tsx   # Supplier vendor CRM
        │   ├── CustomersPage.tsx   # Customer management & credit ledger
        │   ├── InvoicesPage.tsx    # Sales history, thermal re-print, A4 view
        │   ├── ReturnsPage.tsx     # Returns, damaged items & void management
        │   ├── ReportsPage.tsx     # Sales, GST, profit, inventory reports with CSV export
        │   ├── ShiftPage.tsx       # Cashier shift opening, closing & reconciliation
        │   ├── UsersPage.tsx       # User management & cashier role assignment
        │   ├── SettingsPage.tsx    # Store details, tax rules, invoice formatting
        │   ├── AuditLogsPage.tsx   # System security & event audit log
        │   └── NotFoundPage.tsx    # 404 handler
        ├── App.tsx                 # Route declarations & auth state provider
        ├── main.tsx                # React DOM mount point
        └── index.css               # Global styles & thermal print media queries
```

---

## 4. API Endpoints Map (REST v1)

All endpoints are prefixed with `/api/v1`.

| Module | Method | Endpoint | RBAC Access | Purpose |
|---|---|---|---|---|
| **Auth** | `POST` | `/auth/login` | Public | Authenticate user, set HTTP-only cookie |
| | `POST` | `/auth/logout` | Authenticated | Clear auth cookie |
| | `GET` | `/auth/me` | Authenticated | Retrieve current session & permissions |
| | `POST` | `/auth/verify-pin` | Authenticated | Verify manager PIN for overrides |
| **Users** | `GET` | `/users` | `ADMIN` | List all users |
| | `POST` | `/users` | `ADMIN` | Create user (Cashier, Inventory Manager) |
| | `PUT` | `/users/:id` | `ADMIN` | Update user details or role |
| | `DELETE` | `/users/:id` | `ADMIN` | Deactivate/remove user |
| **Products** | `GET` | `/products` | `ADMIN`, `CASHIER`, `INVENTORY_MANAGER` | Search/filter products (pagination, query) |
| | `GET` | `/products/barcode/:barcode` | `ADMIN`, `CASHIER`, `INVENTORY_MANAGER` | Instant barcode lookup for POS scanner |
| | `GET` | `/products/:id` | `ADMIN`, `CASHIER`, `INVENTORY_MANAGER` | Get single product details |
| | `POST` | `/products` | `ADMIN`, `INVENTORY_MANAGER` | Create new product |
| | `PUT` | `/products/:id` | `ADMIN`, `INVENTORY_MANAGER` | Update product details |
| | `DELETE` | `/products/:id` | `ADMIN` | Soft delete product |
| | `POST` | `/products/bulk-import` | `ADMIN`, `INVENTORY_MANAGER` | Import products from CSV |
| | `GET` | `/products/export` | `ADMIN`, `INVENTORY_MANAGER` | Export products to CSV |
| **Categories** | `GET` | `/categories` | All Authenticated | List product categories |
| | `POST` | `/categories` | `ADMIN`, `INVENTORY_MANAGER` | Create product category |
| | `PUT` | `/categories/:id` | `ADMIN`, `INVENTORY_MANAGER` | Update product category |
| **Brands** | `GET` | `/brands` | All Authenticated | List brands |
| | `POST` | `/brands` | `ADMIN`, `INVENTORY_MANAGER` | Create brand |
| **Inventory** | `GET` | `/inventory/stock` | `ADMIN`, `INVENTORY_MANAGER` | Stock levels across products |
| | `GET` | `/inventory/low-stock` | `ADMIN`, `INVENTORY_MANAGER` | Products at or below reorder level |
| | `GET` | `/inventory/expiring` | `ADMIN`, `INVENTORY_MANAGER` | Products expiring within 30 days |
| | `GET` | `/inventory/movements` | `ADMIN`, `INVENTORY_MANAGER` | Audit ledger of all stock changes |
| | `POST` | `/inventory/adjust` | `ADMIN`, `INVENTORY_MANAGER` | Manual stock adjustment (damage, wastage) |
| **Purchases** | `GET` | `/purchases` | `ADMIN`, `INVENTORY_MANAGER` | List supplier purchase entries |
| | `POST` | `/purchases` | `ADMIN`, `INVENTORY_MANAGER` | Record purchase & atomically increment stock |
| **Suppliers** | `GET` | `/suppliers` | `ADMIN`, `INVENTORY_MANAGER` | List suppliers |
| | `POST` | `/suppliers` | `ADMIN`, `INVENTORY_MANAGER` | Create supplier |
| **Customers** | `GET` | `/customers` | All Authenticated | Search customers by phone or name |
| | `POST` | `/customers` | All Authenticated | Quick-create customer at POS |
| | `GET` | `/customers/:id/dues` | `ADMIN`, `CASHIER` | View customer outstanding credit ledger |
| **POS & Cart** | `POST` | `/pos/hold` | `ADMIN`, `CASHIER` | Park current cart (Hold Bill) |
| | `GET` | `/pos/held` | `ADMIN`, `CASHIER` | List held bills for active cashier/counter |
| | `DELETE` | `/pos/held/:id` | `ADMIN`, `CASHIER` | Resume or remove held bill |
| | `POST` | `/pos/checkout` | `ADMIN`, `CASHIER` | Atomic checkout, invoice creation, stock deduction |
| **Invoices** | `GET` | `/invoices` | All Authenticated | List invoices (with filters & search) |
| | `GET` | `/invoices/:id` | All Authenticated | Full invoice details (items, tax, payments) |
| | `POST` | `/invoices/:id/void` | `ADMIN` (or Manager PIN) | Void invoice with audit reason & stock restock |
| **Returns** | `POST` | `/returns` | `ADMIN`, `CASHIER` (w/ Approval) | Process full/partial return, credit note |
| | `GET` | `/returns` | `ADMIN`, `INVENTORY_MANAGER` | View return history & damaged item log |
| **Shifts** | `GET` | `/shifts/current` | `ADMIN`, `CASHIER` | Check active shift for current cashier |
| | `POST` | `/shifts/open` | `CASHIER` | Open shift with opening cash float |
| | `POST` | `/shifts/close` | `CASHIER` | Close shift with counted cash & variance note |
| | `GET` | `/shifts` | `ADMIN` | List all cashier shifts & audit differences |
| **Reports** | `GET` | `/reports/dashboard` | `ADMIN` | KPI metrics, sales trends, top products |
| | `GET` | `/reports/sales` | `ADMIN` | Sales summary by date, cashier, category |
| | `GET` | `/reports/tax` | `ADMIN` | GST/tax liability report (CGST, SGST, IGST) |
| | `GET` | `/reports/inventory` | `ADMIN`, `INVENTORY_MANAGER` | Valuation, dead stock, low stock report |
| | `GET` | `/reports/export` | `ADMIN` | Export report to CSV |
| **Settings** | `GET` | `/settings` | All Authenticated | Retrieve store profile & POS config |
| | `PUT` | `/settings` | `ADMIN` | Update store profile, tax rules, invoice format |
| **Audit** | `GET` | `/audit-logs` | `ADMIN` | Review security and transactional audit trail |

---

## 5. User Roles and RBAC Permission Matrix

| Feature / Action | Admin | Cashier | Inventory Manager |
|---|:---:|:---:|:---:|
| **Executive Dashboard & Financial Reports** | Yes | No | No |
| **POS Billing Screen & Scan Operations** | Yes | Yes | No (View only) |
| **Customer Search & Quick Creation** | Yes | Yes | Yes |
| **Hold & Resume Sales** | Yes | Yes | No |
| **Standard Cashier Discount (up to max configured %)** | Yes | Yes | No |
| **High Discount (> max configured %)** | Yes | Requires PIN | No |
| **Complete Checkout & Print Receipt** | Yes | Yes | No |
| **View Own Sales History** | Yes | Yes | No |
| **View All Sales & Financial Invoices** | Yes | No | No |
| **Void / Cancel Completed Invoice** | Yes | Requires Admin PIN | No |
| **Sales Return & Restocking** | Yes | Requires Admin PIN | View Only |
| **Open & Close Cashier Shift** | Yes | Yes | No |
| **View / Approve Cashier Shift Variances** | Yes | No | No |
| **Add / Edit / Delete Products** | Yes | No | Yes (No Delete) |
| **View Product Cost Price** | Yes | No | Yes |
| **Supplier & Purchase Management (Stock-In)** | Yes | No | Yes |
| **Stock Adjustments (Damage, Loss, Expiry)** | Yes | No | Yes |
| **Stock Movement Ledger Inspection** | Yes | No | Yes |
| **User & Cashier Credential Management** | Yes | No | No |
| **Store Details, GST Rates & Invoice Config** | Yes | No | No |
| **System Security & Audit Log Review** | Yes | No | No |

---

## 6. Core Business Rules & Technical Algorithms

### 6.1 Safe Monetary & Tax Calculation Engine
To prevent IEEE 754 floating point inaccuracies (e.g. `0.1 + 0.2 === 0.30000000000000004`), all financial figures are calculated with strict integer cent/paisa math or decimal precision libraries:
- **Inclusive Tax Pricing**:
  $$\text{Tax Base} = \frac{\text{Selling Price}}{1 + \frac{\text{Tax Rate}}{100}}$$
  $$\text{Tax Amount} = \text{Selling Price} - \text{Tax Base}$$
  $$\text{CGST} = \frac{\text{Tax Amount}}{2}, \quad \text{SGST} = \frac{\text{Tax Amount}}{2}$$
- **Exclusive Tax Pricing**:
  $$\text{Tax Base} = \text{Selling Price}$$
  $$\text{Tax Amount} = \text{Tax Base} \times \frac{\text{Tax Rate}}{100}$$
  $$\text{Line Total} = \text{Tax Base} + \text{Tax Amount}$$
- **Round-Off Logic**: Round-off adjustments are calculated to the nearest rupee/currency unit:
  $$\text{Round-Off} = \text{Round}(\text{Raw Grand Total}) - \text{Raw Grand Total}$$
  $$\text{Payable Grand Total} = \text{Raw Grand Total} + \text{Round-Off}$$

### 6.2 Atomic Concurrency & Stock Deduction
When a cashier completes a transaction:
1. An **Idempotency Key** is submitted by the client (UUID generated on checkout initiation).
2. The entire operation executes within a Prisma `$transaction`:
   - Verification of available stock for each line item. If any item has insufficient stock and `allowNegativeStock === false`, the transaction immediately aborts with `400 Bad Request (INSUFFICIENT_STOCK)`.
   - Creation of the `Invoice` and `InvoiceItem` records (preserving frozen snapshots of product name, cost price, selling price, and tax amounts).
   - Atomic decrement of `Product.currentStock`.
   - Insertion of corresponding rows into the immutable `StockMovement` table with type `SALE`.
   - Recording of all `Payment` tenders (Cash, UPI, Card, Credit).
   - If payment method includes `CREDIT`, atomic increment of `Customer.outstandingBalance`.
   - Deletion of the `HeldSale` if the checkout originated from a parked cart.

### 6.3 Immutable Historical Invoices
A supermarket invoice is a legal record. Even if an administrator subsequently changes a product's name, selling price, or tax bracket, past invoices remain untouched because all critical product and tax snapshots are stored directly on the `InvoiceItem` record.

### 6.4 Manager PIN Override Security
- Sensitive POS actions (discount exceeding cashier threshold, voiding an invoice, or processing cash refunds) trigger a Manager PIN prompt on the client.
- The server validates the hashed manager PIN via `/api/v1/auth/verify-pin` before allowing the privileged operation.
- Every override generates an entry in `AuditLog` containing the manager's user ID, cashier's user ID, reason, and timestamp.
