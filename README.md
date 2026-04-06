# MO Marketplace Assessment

A full-stack marketplace assessment project with:

- Backend API: NestJS + TypeORM + PostgreSQL
- Frontend Web App: React + Vite + TypeScript
- Authentication: JWT access token + refresh token cookie
- Product domain: products, variants, filtering, pagination, quick-buy flow

## 1. Project Overview

This project implements a simple marketplace where authenticated users can:

- Register and log in
- Browse products with search/filter/pagination
- View product details and variants
- Perform quick-buy for a selected variant

Admin users can:

- Create products (including image upload)
- Update products and variants
- Delete products

## 2. Demo & API Docs

- Swagger: http://localhost:3000/api/docs
- Project demo: https://drive.google.com/file/d/1t3RA6hNHbl5f8dAZGZBO5vFJg3oBkgMy/view?usp=sharing

## 3. Repository Structure

```text
.
|-- db_dump/
|   `-- mo-marketplace-data.sql
|-- mo-marketplace-api/   # NestJS backend
`-- mo-marketplace-web/   # React frontend
```

## 4. Architecture & Approach

### Backend (mo-marketplace-api)

- Framework: NestJS (modular architecture)
- Data layer: TypeORM entities/repositories
- Database: PostgreSQL
- Auth:
  - Access token returned on login
  - Refresh token stored in HTTP-only cookie
  - Role-based access control via guards/decorators (`admin` and `user`)
- API docs: Swagger exposed at `/api/docs`

Main modules:

- `auth`: register/login/refresh/logout/me
- `users`: user persistence and refresh token updates
- `products`: CRUD, listing with filters, quick-buy, image upload integration
- `variants`: variant entity support
- `seed`: creates initial admin user from env on startup

### Frontend (mo-marketplace-web)

- Framework: React + Vite + TypeScript
- Routing: `react-router-dom` with private/admin route guards
- State: Zustand auth store
- API: Axios client with auto-attach bearer token and refresh retry flow
- UI: Tailwind-based components

### Request Flow (high-level)

1. User logs in via `/auth/login`
2. API returns access token + sets refresh cookie
3. Frontend stores access token and sends it in `Authorization` header
4. On 401, frontend attempts `/auth/refresh` and retries queued requests
5. Protected endpoints enforce JWT and role guards

## 5. Key Features

- JWT auth with refresh-token cookie strategy
- Role-based authorization (`admin` vs `user`)
- Product listing with:
  - search by name/description
  - filters by color/size/material
  - pagination metadata
- Product detail with variant selection
- Quick-buy endpoint that updates stock atomically
- Admin product management:
  - create
  - create with image upload
  - update
  - delete
- Startup admin seeding from environment variables

## 6. Assumptions

- PostgreSQL is available locally and accessible from the API.
- Database schema/data can be initialized either by:
  - TypeORM synchronization in non-production mode, or
  - importing the provided SQL dump.
- Cloudinary credentials are configured (required by current backend initialization).
- Frontend runs on `http://localhost:6001` (matches API CORS allowlist).
- Node.js and npm are installed.

## 7. Decisions & Trade-offs

- `synchronize: !isProduction` in TypeORM:
  - Decision: faster local setup for assessment.
  - Trade-off: not ideal for strict production migration workflows.

- Refresh token in HTTP-only cookie:
  - Decision: reduces direct JS access to refresh token.
  - Trade-off: requires correct CORS + credentials handling.

- Access token in frontend storage:
  - Decision: simple client-side auth state persistence.
  - Trade-off: any storage-based token strategy carries XSS exposure risk compared to fully cookie-based sessions.

- Cloudinary image upload support:
  - Decision: practical external image hosting.
  - Trade-off: introduces third-party dependency and env requirements.

- Quick-buy stock decrement via conditional SQL update:
  - Decision: avoids race conditions for stock checks/decrements.
  - Trade-off: keeps logic tied to DB-side update semantics.

## 8. Prerequisites

- Node.js 20+ (recommended)
- npm 10+ (recommended)
- PostgreSQL 14+ (recommended)
- Cloudinary account/API credentials

## 9. Environment Setup

Create these files:

- `mo-marketplace-api/.env`
- `mo-marketplace-web/.env`

### Backend env (`mo-marketplace-api/.env`)

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=mo_marketplace

JWT_SECRET=replace_with_secure_secret
JWT_EXPIRES_IN=5m
JWT_REFRESH_SECRET=replace_with_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

ADMIN_EMAIL=admin@mo.local
ADMIN_PASSWORD=Admin@12345

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=mo-marketplace
```

### Frontend env (`mo-marketplace-web/.env`)

```env
VITE_API_URL=http://localhost:3000/api
```

## 10. Database Setup

You can use the SQL dump if you want preloaded schema/data.

SQL dump path:

- `db_dump/mo-marketplace-data.sql`

Example import command (PostgreSQL):

```bash
psql -U postgres -d mo_marketplace -f db_dump/mo-marketplace-data.sql
```

If the database does not exist yet, create it first:

```bash
createdb -U postgres mo_marketplace
```

Notes:

- Ensure env DB credentials match your local database.
- In development mode, TypeORM can also create tables automatically (`synchronize` enabled).

## 11. Install Dependencies

From workspace root, install per project:

```bash
cd mo-marketplace-api
npm install

cd ../mo-marketplace-web
npm install
```

## 12. How To Run The Project

Open two terminals from workspace root.

### Terminal 1: Start API

```bash
cd mo-marketplace-api
npm run start:dev
```

API base URL:

- http://localhost:3000/api

Swagger:

- http://localhost:3000/api/docs

### Terminal 2: Start Web

```bash
cd mo-marketplace-web
npm run dev -- --port 6001
```

Web app URL:

- http://localhost:6001

## 13. Basic Verification Checklist

- API boots without env errors.
- Swagger opens at `http://localhost:3000/api/docs`.
- Web app opens at `http://localhost:6001`.
- Register/login works.
- Product list loads.
- Quick-buy updates stock.
- Admin can create/update/delete product.

## 14. Useful Commands

### API

```bash
npm run start:dev
npm run build
npm run test
npm run test:e2e
npm run lint
```

### Web

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## 15. Notes For Reviewers

- If you only need to inspect endpoints quickly, use Swagger first.
- If data is missing, import the SQL dump and restart the API.
- Ensure the frontend and API URLs/ports match the configured CORS and env values.
