# 🌟 SMARTPOS — Enterprise Multi-Tenant SaaS POS Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ed.svg)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-99%2F99%20Passed-brightgreen.svg)]()

**SMARTPOS** is a high-performance, enterprise-grade, multi-tenant Software-as-a-Service Point of Sale (POS) and Enterprise Resource Planning (ERP) platform architected specifically for the Uzbekistan market, designed to compete with industry leaders like **Poster POS** and **EasyTrade**.

---

## 🎯 Target Verticals
- 🛒 Grocery Stores & Supermarkets
- 👗 Clothing & Apparel Boutiques
- 📱 Electronics & Mobile Accessories Shops
- 🏗️ Construction & Hardware Stores
- 📦 Wholesale Distributors
- ☕ Cafes & Quick Service Restaurants

---

## 🚀 Key Highlights & Capabilities

### 1. Multi-Tenant SaaS Architecture
- **Strict Data Isolation**: Every SQL query is strictly scoped by `business_id`. Cross-tenant data leakage is prevented at both the database and ORM layers.
- **Hierarchical Structure**: `Business` -> `Branches` -> `Warehouses` -> `Cash Registers` -> `Users`.
- **RBAC**: 7 fine-grained roles (`super_admin`, `business_owner`, `administrator`, `manager`, `cashier`, `warehouse_manager`, `accountant`) with an auditable permissions matrix.

### 2. High-Speed POS Checkout Terminal
- **Keyboard & Barcode Optimized**: Instant search by barcode, SKU, or name (`F2` focus, `F4` payment, `F8` hold, `F9` resume, `Esc` clear).
- **Payment Flexibility**: Cash, Terminal Card, Split Payments (Cash + Card), and Customer Credit/Debt (`Nasiya`).
- **Thermal Receipt Printing**: Instant ESC/POS rendering with 58mm and 80mm preview modes.
- **Offline Mode Engine**: Built-in IndexedDB storage caching products and queuing offline transactions with automatic background synchronization upon network recovery.

### 3. Inventory & Warehouse Logistics
- **Multi-Warehouse Support**: Branch-to-branch and warehouse-to-warehouse stock transfers with confirmation.
- **Stock Movement Ledger**: Complete auditable historical ledger tracking `purchase_in`, `sale_out`, `transfer_in`, `transfer_out`, `adjustment`, `write_off`, and `return_in`.
- **Stock Safeguard**: Prevents negative inventory unless explicitly permitted by business policy.

### 4. Supplier & Purchase Management
- Supplier debt tracking (`Nasiya`) with one-click debt repayment.
- Draft & Received purchase order workflows with automatic stock receipt into target warehouses.

### 5. Customer CRM & Loyalty Engine
- Customer purchase history, loyalty point accumulation, and balance ledger.
- Dedicated customer debt repayment tracking.

### 6. Financial Management & P&L
- Real-time **Profit & Loss (P&L)** calculation: Revenue, Cost of Goods Sold (COGS), Gross Profit, Operating Expenses, Net Profit, and Customer Debts.
- Cashier shift management: Opening float, cash-in/out, expected vs. counted cash reconciliation.

### 7. SaaS Subscriptions & Super Admin Dashboard
- Tiered subscription plans (`START`, `BUSINESS`, `PRO`, `ENTERPRISE`).
- Super Admin controls: Tenant management, account activation/suspension, plan pricing editor, and global revenue metrics.

### 8. Uzbekistan Fiscal & Payment Integrations
- **Payme**: Full JSON-RPC 2.0 Merchant API (`CheckPerformTransaction`, `CreateTransaction`, `PerformTransaction`, `CancelTransaction`, `CheckTransaction`).
- **Click**: Complete Merchant Webhook handler with MD5 signature validation for `Prepare` (Action 0) and `Complete` (Action 1).
- **Soliq / OFD Fiscalization**: DSQ-compliant fiscal receipt builder with standard MXIK (IKPU) package codes and 12% QQS (VAT).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, React Router v7, Zustand, Recharts, TanStack Query |
| **Backend** | Node.js 22, Express 5, TypeScript, Sequelize ORM 6, Zod, JWT, bcryptjs, Helmet, Multer |
| **Database** | PostgreSQL 17 (Normalized multi-tenant schema with 30+ tables), Redis 7 |
| **DevOps** | Multi-stage Docker, Docker Compose, Nginx Reverse Proxy |

---

## 🔑 Default Credentials

### Platform Super Admin
- **URL**: `http://localhost:5173/admin`
- **Email**: `super@smartpos.uz`
- **Password**: `Admin@123`

### Demo Business Owner (Korzinka Supermarket)
- **URL**: `http://localhost:5173/login`
- **Email**: `owner@korzinka.uz`
- **Password**: `Password123!`

---

## 💻 Quick Start Guide

### Option 1: Docker Deployment (Recommended for Production)

```bash
# 1. Clone repository
git clone <repo-url>
cd "pos system"

# 2. Copy and customize production environment
cp .env.production.example .env

# 3. Start all services (PostgreSQL 17, Redis 7, Backend, Frontend Nginx)
docker compose up -d --build

# Application will be accessible at:
# Frontend SPA: http://localhost
# Backend API:  http://localhost:5000/api
```

---

### Option 2: Local Development

#### 1. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Setup PostgreSQL database (Default: localhost:5432, database: smartpos)
# Run migrations & seed data:
npm run seed

# Start development server
npm run dev
# Server running at http://localhost:5000
```

#### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
# Client running at http://localhost:5173
```

---

## 🧪 Automated Test Suite (99 / 99 Passed)

Run the full end-to-end integration and isolation test suite:

```bash
cd backend

# Run individual test suites
npx tsx src/tests/authAndTenant.test.ts          # 12 passed
npx tsx src/tests/productsAndBranches.test.ts    # 12 passed
npx tsx src/tests/inventoryAndPurchases.test.ts # 14 passed
npx tsx src/tests/posAndSales.test.ts           # 17 passed
npx tsx src/tests/crmAndFinance.test.ts         # 10 passed
npx tsx src/tests/reportsAndEmployees.test.ts   # 11 passed
npx tsx src/tests/adminAndSubscriptions.test.ts # 11 passed
npx tsx src/tests/paymentsAndOffline.test.ts     # 12 passed

# Total: 99 passed, 0 failed
```

---

## 📂 Project Structure

```
pos-system/
├── backend/
│   ├── src/
│   │   ├── config/             # DB, Environment, CORS
│   │   ├── database/
│   │   │   ├── migrations/     # PostgreSQL schema migrations
│   │   │   ├── models/         # 30+ Sequelize models with typed associations
│   │   │   └── seed.ts         # Seed data (Roles, Permissions, Plans, Super Admin)
│   │   ├── middleware/         # Auth, Tenant isolation, Rate limiters, Error handler
│   │   ├── modules/            # Domain modules (Auth, Product, Inventory, POS, etc.)
│   │   │   ├── paymentGateway/ # Payme JSON-RPC, Click MD5, Soliq OFD Fiscalization
│   │   │   ├── sale/           # Checkout, Cart calculation, Returns, Shifts
│   │   │   ├── finance/        # Expenses, Cash movements, P&L statement
│   │   │   └── ...
│   │   ├── tests/              # 8 comprehensive automated test suites (99 tests)
│   │   └── server.ts           # Application entrypoint
│   └── Dockerfile              # Multi-stage production container
├── frontend/
│   ├── src/
│   │   ├── components/         # Modals, Skeletons, Receipts, UI elements
│   │   ├── lib/                # IndexedDB offline engine, Axios client, Utils
│   │   ├── pages/              # 15 complete dashboard & POS views
│   │   ├── router/             # React Router v7 routes with guards
│   │   └── store/              # Zustand state stores (Auth, POS cart, Shifts)
│   ├── nginx.conf              # SPA routing & caching configuration
│   └── Dockerfile              # Multi-stage Vite build + Nginx host
├── docker-compose.yml          # Production multi-service orchestration
└── nginx.conf                  # Main reverse proxy configuration
```

---

## 🛡️ Security & Compliance
- **Data Isolation**: Multi-tenant access controls enforce strict tenant boundaries across every SQL query.
- **Password Security**: Strong bcrypt hashing with 10 salt rounds.
- **Session Security**: Dual-token architecture (15-min JWT access token + 7-day revolving refresh tokens).
- **Payment Verification**: Payme and Click MD5 signature verification preventing transaction spoofing.
- **Audit Trails**: Built-in `audit_logs` tracking sensitive administrative and financial transactions.

---

## 📄 License
Commercial proprietary software — designed and built for enterprise deployment in Uzbekistan.
