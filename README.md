# Orbit — Full Stack SaaS Dashboard

A polished business workspace built with **Next.js App Router, React, TypeScript and SQLite**. Created as a hiring portfolio project, with working server APIs and persistent data.

ระบบบริหารธุรกิจสำหรับโชว์ผลงานสมัครงาน มี Login, Dashboard, CRUD โปรเจกต์และผู้ใช้, กราฟ และสิทธิ์ Admin/User พร้อม API และฐานข้อมูลจริง

## Features

- Login/logout with signed, expiring HttpOnly cookies and salted scrypt password hashes.
- Admin/User authorization enforced on the server. Users can access only their own projects.
- Project CRUD, ownership assignment, status tracking, search and CSV export.
- Admin-only team CRUD and role management. Self-modification is blocked to prevent admin lockout.
- Analytics derived from database records: portfolio value, monthly project budgets, and status distribution.
- Responsive dashboard, empty states, form validation and accessible action labels.
- Persistent SQLite storage, parameterized queries, same-origin mutation checks and login throttling.

## Run locally

Use Node.js 22 LTS or newer.

```bash
npm install
cp .env.example .env.local
# Set SESSION_SECRET to a random secret (required for production).
npm run dev
```

Open http://localhost:3000. The first database access creates and seeds `data/orbit.sqlite` automatically.

| Role  | Email            | Password      |
| ----- | ---------------- | ------------- |
| Admin | admin@orbit.demo | OrbitDemo123! |
| User  | user@orbit.demo  | OrbitDemo123! |

Demo credentials are intentionally public. Use fictional data. Replace demo accounts and disable automatic seeding before using this project for an actual business.

## Checks

```bash
npm test
npm run build
npm start
```

With the app running, run `node tests/api-smoke.mjs` to verify login, project and team CRUD, and role enforcement against the actual APIs.

## Architecture

`app/page.tsx` contains the interactive workspace. `app/api/session` handles authentication; `app/api/[resource]` handles projects and users. `lib/auth.ts` resolves sessions against current database roles on every request. `lib/db.ts` loads SQLite through sql.js and saves database changes atomically to disk. `lib/security.mjs` contains independently tested password and session helpers.

| API                                 | Access                                  |
| ----------------------------------- | --------------------------------------- |
| GET/POST/DELETE /api/session        | Session lookup / login / logout         |
| GET/POST/PATCH/DELETE /api/projects | Admin: all projects; User: own projects |
| GET/POST/PATCH/DELETE /api/users    | Admin only                              |

## Deployment

Deploy on a **single Node.js process with a persistent writable disk**, for example a VPS or a container host with a volume. Set `SESSION_SECRET` and `DATA_DIR`, then run `npm run build` and `npm start` behind HTTPS. This file-backed database is unsuitable for ephemeral serverless filesystems or multiple application replicas. For horizontal scaling, replace the storage layer with PostgreSQL and use a shared rate limiter.

A Dockerfile is included. Build with `docker build -t orbit .`, then run `docker run -p 3000:3000 -v orbit-data:/app/data -e SESSION_SECRET=your-random-secret orbit`. Configure HTTPS at your reverse proxy before signing in to a production deployment. GitHub Actions runs unit tests, a production build, and real API smoke tests on each push.

## Portfolio walkthrough

1. Sign in as Admin and inspect the overview charts.
2. Create a project and assign it to Jamie Chen.
3. Edit its status and budget; observe the analytics update.
4. Add a team member and set their role.
5. Sign out and enter the User demo; only Jamie's projects are visible and the Team menu is hidden.
6. Search projects and export the filtered records as CSV.

## Scope

This is a portfolio application, not a production SaaS offering. Budgets represent project value, not recognized revenue. There is no billing integration, email invitation delivery, password recovery, or multi-tenant isolation. Login throttling is per process and resets on restart. Demo seed dates are fixed; new records use their actual creation date. Fonts use Google Fonts with system fallbacks.
