# AssemblyFlow ERP

**Manufacturing • Storage • Delivery • Tracking**

A complete Manufacturing ERP web application for tracking door leaves, door frames, assemblies, storage movements, deliveries, returns, and complete door lifecycle history.

## Tech Stack

### Frontend
- React 19 + TypeScript
- Tailwind CSS 4 + ShadCN-style UI components
- React Query, React Hook Form, Zod
- Recharts for dashboard analytics
- Dark/Light theme support

### Backend
- Node.js + Express 5
- PostgreSQL + Prisma ORM
- JWT Authentication
- Zod validation, Multer file uploads
- Barcode generation (Code128)
- Excel/CSV/PDF report exports

## Modules

1. **Dashboard** - KPI cards, charts, recent activity, quick actions
2. **Ready For Assembly** - Door leaves & frames grouped by date
3. **Door Assembly** - Assembly completion, barcode generate/print/scan
4. **FIPS Tracking** - Document upload and status workflow
5. **Quality Check** - QC approval (required before storage)
6. **BH Storage** - Post-QC storage with bulk move actions
7. **Storage Management** - Multi-location bulk movements
8. **Delivery / Collection** - Delivery notes and history
9. **Site Management** - Track doors at sites, bulk returns
10. **Returns Management** - Return from any location to BH
11. **Movement History** - Timeline and table views
12. **Reports** - Export to Excel, CSV, PDF

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+ (or use Docker)

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

API runs at `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

### Default Login

- **Email:** admin@assemblyflow.com
- **Password:** admin123

## Business Flow

```
Door Leaf + Door Frame
    ↓
Ready For Assembly
    ↓
Door Assembly → Barcode Generation
    ↓
FIPS Submission → Quality Check
    ↓
BH Storage → Camden / Site / Container
    ↓
Delivery / Collection
    ↓
Return (if required) → Back To BH Storage
```

Every movement is logged in the Movement History module.

## API Endpoints

| Module | Base Path |
|--------|-----------|
| Auth | `/api/auth` |
| Dashboard | `/api/dashboard` |
| Ready For Assembly | `/api/ready-for-assembly` |
| Assemblies | `/api/assemblies` |
| FIPS | `/api/fips` |
| Quality Checks | `/api/quality-checks` |
| Storage | `/api/storage` |
| Deliveries | `/api/deliveries` |
| Sites | `/api/sites` |
| Returns | `/api/returns` |
| Movements | `/api/movements` |
| Reports | `/api/reports` |

## Project Structure

```
assemblyflow-erp/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── prisma/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── layouts/
│       ├── pages/
│       ├── routes/
│       ├── services/
│       └── types/
└── docker-compose.yml
```

## Production Notes

- Change `JWT_SECRET` in backend `.env`
- Use `npm run db:migrate` for production migrations
- Build frontend: `cd frontend && npm run build`
- Serve frontend static files via nginx or Express
