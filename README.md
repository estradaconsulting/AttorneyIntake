# Hogan4Eviction — Client Intake Web App

Web-based intake system for the Law Office of Thomas M. Hogan, replacing the PDF intake pack with a fully digital multi-step form.

**Stack:** ASP.NET Core 8 (C#) · React 18 + TypeScript + Vite · Azure SQL / SQL Server · Docker

---

## Quick Start — Frontend Only (no backend needed for UI development)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

The frontend will gracefully degrade when the API is unavailable (fee calculator will show an offline message).

---

## Full Stack — Docker Compose (recommended)

```bash
# 1. Copy env file
cp .env.example .env
# Edit .env if you want a different SA password

# 2. Start everything
docker-compose up --build

# Services:
#   Frontend  →  http://localhost:3000
#   API       →  http://localhost:5000
#   Swagger   →  http://localhost:5000/swagger
#   SQL Server → localhost:1433
```

---

## Full Stack — Local Development (without Docker)

### Prerequisites
- .NET 8 SDK
- Node.js 20+
- SQL Server or LocalDB

### Backend
```bash
cd backend

# Restore packages
dotnet restore

# Apply database migrations
dotnet ef database update --project src/Hogan4Eviction.Infrastructure --startup-project src/Hogan4Eviction.API

# Run the API
dotnet run --project src/Hogan4Eviction.API
# API: http://localhost:5000  |  Swagger: http://localhost:5000/swagger
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

---

## Add a New EF Core Migration

```bash
cd backend
dotnet ef migrations add <MigrationName> \
  --project src/Hogan4Eviction.Infrastructure \
  --startup-project src/Hogan4Eviction.API
```

---

## Project Structure

```
AttorneyIntake/
├── docker-compose.yml          # Full stack orchestration
├── .env.example                # Environment variable template
├── backend/
│   ├── Hogan4Eviction.sln
│   └── src/
│       ├── Hogan4Eviction.API/           # ASP.NET Core Web API
│       │   ├── Controllers/
│       │   │   ├── IntakeCasesController.cs   # CRUD for intake cases
│       │   │   ├── DocumentsController.cs     # File uploads
│       │   │   └── FeesController.cs          # Fee calculator endpoint
│       │   ├── Program.cs                # DI, CORS, Swagger, migrations
│       │   ├── appsettings.json
│       │   └── Dockerfile
│       ├── Hogan4Eviction.Core/          # Domain logic (no I/O)
│       │   ├── Models/                   # EF entities
│       │   ├── DTOs/                     # API request/response shapes
│       │   ├── Enums/                    # OwnerType, NoticeType, etc.
│       │   ├── Interfaces/               # IRepo, IStorage, IFeeCalc
│       │   └── Services/
│       │       └── FeeCalculatorService.cs   # Pure 2025 fee logic
│       └── Hogan4Eviction.Infrastructure/
│           ├── Data/AppDbContext.cs       # EF Core + Azure SQL
│           ├── Repositories/             # IntakeCaseRepository
│           ├── Services/
│           │   ├── LocalDocumentStorageService.cs   # Dev
│           │   └── AzureBlobStorageService.cs       # Production
│           └── DependencyInjection.cs    # Storage provider switch
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── types/intake.ts               # All TypeScript types + enums
    │   ├── services/api.ts               # Axios API calls
    │   ├── components/
    │   │   ├── layout/Header.tsx         # Branded header
    │   │   ├── common/                   # FormField, StepIndicator
    │   │   └── intake/
    │   │       ├── IntakeWizard.tsx      # Step orchestrator
    │   │       └── steps/
    │   │           ├── Step1_OwnerInfo.tsx
    │   │           ├── Step2_ManagerInfo.tsx
    │   │           ├── Step3_PropertyInfo.tsx   # Tenants, rent history, AB1482
    │   │           ├── Step4_EvictionCause.tsx  # Notice, UD-101, CIV-100
    │   │           ├── Step5_NoticeRequest.tsx  # Page 6 of intake pack
    │   │           ├── Step6_FeeReview.tsx      # Live fee calculator
    │   │           ├── Step7_Documents.tsx      # PDF uploads
    │   │           └── Step8_Confirmation.tsx   # Agreement + submit
    │   └── index.css                     # Tailwind + brand styles
    ├── Dockerfile
    ├── nginx.conf
    └── package.json
```

---

## Azure Integration Hooks (Future)

All Azure integration points are pre-wired — just set the environment variables:

| Feature | Config Key | Notes |
|---|---|---|
| Azure SQL | `ConnectionStrings:DefaultConnection` | Replace LocalDB connection string |
| Azure Blob Storage | `Azure:BlobStorage:ConnectionString` + `Storage:Provider=Azure` | Toggle in `DependencyInjection.cs` |
| Azure Key Vault | `Azure:KeyVault:Uri` | Inject secrets at runtime |
| Azure AD / Entra | Uncomment in `Program.cs` | Adds `[Authorize]` to staff routes |

---

## MVP Roadmap (Next Features)

- [ ] Staff admin dashboard (case list, status updates, notes)
- [ ] Email notifications on submission (SendGrid / Azure Communication Services)
- [ ] E-signature integration (DocuSign or Azure)
- [ ] Azure AD login for staff portal
- [ ] Auto-populate court forms (UD-101, CIV-100, UD-120) from intake data
- [ ] Credit card authorization form (Stripe / Square — no raw card data stored)
- [ ] Consultation scheduling integration
