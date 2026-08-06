# Implementation Plan - Full-Stack Banking Transaction System

Build a comprehensive Full-Stack Banking System consisting of an **Admin Cashier Panel** (physical bank operations, offline customer onboarding, cash deposits/withdrawals) and a **User Mobile Banking Panel** (online transfers with PIN security, balance check, transaction history), backed by a double-entry ledger database in MongoDB.

## User Review Required

> [!IMPORTANT]
> **Default Admin Credentials**:
> - **Email**: `admin@ledgerbank.com`
> - **Password**: `Admin@Ledger2026`
> - **Role**: `ADMIN` (Cashier Privileges)
>
> An automated database seeder will ensure these credentials are created safely when the server starts.

> [!NOTE]
> **Security & Workflow Enforcements**:
> 1. **Offline Account Creation**: Customers must be registered/onboarded by an Admin cashier first (or created via Admin Panel).
> 2. **Transaction PIN**: Every online transfer requires a valid 4-digit Transaction PIN. Users set their PIN after logging in.
> 3. **Account Number**: Every account gets a unique 10-digit account number (e.g. `ACCT-8492019482`).

---

## Proposed Changes

### Database Schemas & Models

#### [MODIFY] [user.model.js](file:///c:/Users/YAKEEN/Full_Stack/BACKEND-LEDGER/src/models/user.model.js)
- Add `role` field (`enum: ["ADMIN", "USER"]`, default `"USER"`).
- Add `transactionPin` field (`select: false`, hashed via bcrypt).
- Add helper method `comparePin(pin)` to verify 4-digit transaction PINs.

#### [MODIFY] [account.model.js](file:///c:/Users/YAKEEN/Full_Stack/BACKEND-LEDGER/src/models/account.model.js)
- Add `accountNumber` field (String, unique, indexed, auto-generated e.g. `ACC849201948`).

---

### Backend Logic & Middleware

#### [MODIFY] [auth.middleware.js](file:///c:/Users/YAKEEN/Full_Stack/BACKEND-LEDGER/src/middlewares/auth.middleware.js)
- Add `authAdminMiddleware` to enforce `ADMIN` role check for physical cashier operations.

#### [NEW] [admin.controller.js](file:///c:/Users/YAKEEN/Full_Stack/BACKEND-LEDGER/src/controllers/admin.controller.js) & [admin.routes.js](file:///c:/Users/YAKEEN/Full_Stack/BACKEND-LEDGER/src/routes/admin.routes.js)
- `POST /api/admin/onboard-customer`: Admin creates customer + bank account + deposits initial physical cash.
- `POST /api/admin/cash-deposit`: Cashier takes physical cash from customer & credits their account ledger.
- `POST /api/admin/cash-withdraw`: Cashier dispenses physical cash & debits user's account ledger.
- `GET /api/admin/stats`: Returns bank reserves, active accounts, total transactions.

#### [MODIFY] [auth.controller.js](file:///c:/Users/YAKEEN/Full_Stack/BACKEND-LEDGER/src/controllers/auth.controller.js)
- Add `setPinController`: Allows authenticated user to create or update their 4-digit Transaction PIN.

#### [MODIFY] [transaction.controller.js](file:///c:/Users/YAKEEN/Full_Stack/BACKEND-LEDGER/src/controllers/transaction.controller.js)
- Update `createTransaction` to require and verify `transactionPin` before executing online money transfer.

#### [NEW] [seedAdmin.js](file:///c:/Users/YAKEEN/Full_Stack/BACKEND-LEDGER/src/config/seedAdmin.js)
- Seed default admin account (`admin@ledgerbank.com` / `Admin@Ledger2026`) on database connect.

---

### Frontend Web Application (Admin & User Panels)

#### [NEW] [public/index.html](file:///c:/Users/YAKEEN/Full_Stack/BACKEND-LEDGER/public/index.html), [public/styles.css](file:///c:/Users/YAKEEN/Full_Stack/BACKEND-LEDGER/public/styles.css), [public/app.js](file:///c:/Users/YAKEEN/Full_Stack/BACKEND-LEDGER/public/app.js)
- Served directly by Express (`express.static("public")`).
- **Design System**: Premium glassmorphism dark mode with emerald green (#10B981) for credits, crimson (#EF4444) for debits, and indigo (#6366F1) accents.
- **Admin Panel View**:
  - Offline Customer Onboarding Form (Creates Customer, Account Number & Initial Physical Cash Deposit).
  - Cashier Counter (Physical Cash Deposit & Withdrawal).
  - Global System Audit & Bank Reserve Analytics.
- **User Mobile Banking View**:
  - Live Balance Card with Account Number & Copy button.
  - Quick Money Transfer modal with 4-digit PIN Pad / Input.
  - Set / Reset Transaction PIN section.
  - Interactive Filterable Transaction Ledger History.

---

## Verification Plan

### Automated Tests
- Syntax verification using `node -c` across all modified & new files.

### Manual Verification
1. **Admin Seed Check**: Start `server.js`, verify `admin@ledgerbank.com` is automatically created in MongoDB.
2. **Admin Cashier Operations**:
   - Log into Admin Panel (`admin@ledgerbank.com` / `Admin@Ledger2026`).
   - Onboard a new customer offline with ₹10,000 initial cash. Verify generated Account Number.
   - Perform physical cash deposit & withdrawal.
3. **User Mobile Banking Operations**:
   - Log into User Panel with customer credentials.
   - Set 4-digit Transaction PIN (`1234`).
   - Perform an online money transfer to another account, verifying that invalid PIN is rejected and valid PIN completes the transfer with double-entry ledger integrity.
