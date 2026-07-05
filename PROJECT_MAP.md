# PROJECT MAP — Jarash Hotel Management System

## [TECH_STACK]

| Layer | Technology | Version |
|---|---|---|
| Backend | ASP.NET Core | 8.0 |
| ORM | Entity Framework Core | 8.0.13 |
| Frontend | React + TypeScript | 19.2.7 + 6.0 |
| Build | Vite | 8.1.0 |
| CSS | Tailwind CSS + shadcn/ui | 4.3.1 |
| Database | SQLite (dev) / PostgreSQL (prod) | — / 18 |
| Cache | Redis (configurable) | 8 |
| Auth | JWT (Microsoft.AspNetCore.Authentication.JwtBearer) | 8.0.13 |
| Reverse Proxy | Nginx | 1.30 |
| Container | Docker | 29.6 |
| Node.js | — | 24 |

## [SYSTEM_FLOW]

```
Client (Browser)
  │ HTTPS
  ▼
Nginx (Reverse Proxy, /api/* → API, /* → SPA)
  │
  ├── /api/* ───────────► ASP.NET Core API ──► SQLite/PostgreSQL
  │                            │                    │
  │                            ├── Redis Cache ─────┘
  │                            └── JWT Auth
  │
  └── /* ──────────────► React SPA (Vite build)
                               │
                               └── shadcn/ui (RTL, Dark theme)
```

### Auth Flow
```
Login → POST /api/auth/login → JWT (Access + Refresh) → Bearer header
```

### Cache Strategy
```
Redis: Session cache, Permission cache, Frequent lookup cache (TTL = 5-30 min)
       Not yet wired — infrastructure ready, integration pending.
```

## [ARCHITECTURE]

### Backend (Clean Architecture) — ✅ M2 COMPLETE
```
src/
├── Jarash.sln
├── Jarash.Api              → HTTP layer: Controllers, Middleware, Program.cs
│   ├── Controllers/
│   │   └── AuthController.cs   → login, register, refresh, logout
│   └── Middleware/
│       └── ExceptionMiddleware.cs → Global error handler
├── Jarash.Core              → Domain layer: Entities, Interfaces, DTOs
│   ├── Entities/
│   │   ├── User.cs
│   │   ├── Role.cs
│   │   ├── Permission.cs
│   │   ├── RolePermission.cs
│   │   └── RefreshToken.cs
│   ├── Interfaces/
│   │   ├── IJwtService.cs
│   │   └── IAuthService.cs
│   └── DTOs/
│       └── AuthDtos.cs
├── Jarash.Infrastructure    → Data & Services
│   ├── Data/
│   │   └── AppDbContext.cs       → EF Core context with seed data
│   ├── Services/
│   │   ├── JwtService.cs         → JWT generation & validation
│   │   └── AuthService.cs        → User auth (BCrypt)
│   └── DependencyInjection.cs    → Service registration
├── Dockerfile.api
├── Dockerfile.web
└── nginx.conf
```

### Frontend (Feature-based) — M1 + M3+ COMPLETE
```
Jarash.Web/src/
├── components/
│   ├── ui/         → Button, Card (shadcn-style)
│   └── layout/     → Topbar, RightSidebar, LeftSidebar, MainLayout, ProtectedRoute
├── pages/
│   ├── LoginPage.tsx           → Auth page
│   ├── Dashboard.tsx           → 5 cards
│   ├── SectionPage.tsx         → Placeholder for 7 stubs
│   ├── hotel/                  → Full hotel management (18 files)
│   ├── purchases/              → Full purchases (14 files)
│   ├── cash/                   → Full cash mgmt (9 files)
│   ├── accounts/               → Full accounts (11 files)
│   └── reports/                → Financial reports (10 files)
│       ├── FinancialReportsPage.tsx   → 9-tab page (balance sheet, income statement, trial balance, general ledger, general journal, account movements, AR, AP, cash flow)
│       ├── reportsTypes.ts            → Shared types for all report data
│       ├── reportsService.ts          → Computation from accounts/journal/cash/purchases/hotel data
│       ├── BalanceSheetReport.tsx
│       ├── IncomeStatementReport.tsx
│       ├── TrialBalanceReport.tsx
│       ├── GeneralLedgerReport.tsx
│       ├── GeneralJournalReport.tsx
│       ├── AccountMovementsReport.tsx
│       ├── AccountsReceivableReport.tsx
│       ├── AccountsPayableReport.tsx
│       └── CashFlowReport.tsx
├── lib/
│   ├── api.ts                  → HTTP client with auto-refresh
│   ├── auth-context.tsx        → Auth state provider
│   ├── utils.ts                → cn() helper
│   ├── logger.ts               → Async-safe logger
│   └── error-boundary.tsx      → React ErrorBoundary
├── App.tsx          → BrowserRouter + Routes (login + 13 protected routes)
├── main.tsx         → Entry point (wraps AuthProvider)
└── index.css        → Tailwind 4 + theme vars (RTL-ready)
```

### Database Schema
```
Users → Roles → RolePermissions → Permissions
Users → RefreshTokens
```

## [STATUS & PENDING]

| Item | Status | Milestone |
|---|---|---|
| Hotel page — rooms tab | ✅ COMPLETE | M3 |
| Hotel page — reservations tab | ✅ COMPLETE | M3 |
| Hotel page — services, invoices | ✅ COMPLETE | M3 |
| Purchases page — full section | ✅ COMPLETE | M3+ |
| Cash page — full section | ✅ COMPLETE | M3+ |
| Accounts page — full section | ✅ COMPLETE | M3+ |
| Financial reports — 9 report types | ✅ COMPLETE | M3+ |
| Fund reports — 7 report types | ✅ COMPLETE | M3+ |
| Cash reports — 7 report types | ✅ COMPLETE | M3+ |
| Inventory reports — 10 report types | ✅ COMPLETE | M3+ |
| Profit reports — 9 report types | ✅ COMPLETE | M3+ |
| Warehouses section — items, movements, counting, warehouses management | ✅ COMPLETE | M3+ |
| Database migrations per domain | PENDING | M3+ |
| Redis cache integration | PENDING | M2 |
| Unit/integration tests | PENDING | M4 |
| Settings section — 7 sub-tabs (company, users, invoices, currencies, backup, devices, system) | ✅ COMPLETE | M3+ |
| About page — SectionPage stub | ✅ COMPLETE | M3+ |

## [MILESTONE STATUS]

| Milestone | Status | Completed |
|---|---|---|
| M1 — UI Shell (Topbar + Sidebars + Dashboard + Routing) | ✅ COMPLETE | 2026-06-27 |
| M2 — Backend (API + Auth + Docker + DB) | ✅ COMPLETE | 2026-06-28 |
| M3+ — Feature Content per Section | ✅ COMPLETE | 2026-06-29 |

---
*Updated: 2026-06-29*
