# Assistant Grows Starter

A real full-stack starter refactor of the provided single-file HTML prototype into:

- **frontend**: React + TypeScript + Vite + React Router
- **backend**: Node.js + Express + TypeScript
- **database**: Prisma + SQLite
- **auth**: JWT + bcrypt password hashing
- **uploads**: local image uploads for Focus covers
- **collaboration**: add people to a Focus by phone number

## Why the date strategy uses `YYYY-MM-DD` strings

Task due dates are intentionally stored as **date-only strings** like `2026-04-02` instead of DateTime timestamps.

That avoids the classic timezone bug where:

- a user selects a calendar day in the browser,
- it gets serialized into UTC,
- then appears one day earlier or later when read back.

Because task due dates are a **calendar concept, not a moment-in-time concept**, this starter keeps them as stable date-only values on both frontend and backend.

## Project structure

```text
assistant-grows-starter/
  backend/
  frontend/
  uploads/
  README.md
```

## 1. Backend setup

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Backend runs on `http://localhost:4000`.

## 2. Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Uploaded files

Focus cover images are stored inside the top-level `uploads/` folder and served by the backend at `/uploads/<filename>`.

## Core endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`

### Focus

- `GET /api/focuses`
- `POST /api/focuses`
- `GET /api/focuses/:focusId`
- `PATCH /api/focuses/:focusId`
- `DELETE /api/focuses/:focusId`

Both `POST /api/focuses` and `PATCH /api/focuses/:focusId` support `collaboratorPhones` in multipart form data. Only already registered users can be added.

### Tasks

- `GET /api/focuses/:focusId/tasks?status=all|completed|incomplete&date=YYYY-MM-DD`
- `POST /api/focuses/:focusId/tasks`
- `PATCH /api/tasks/:taskId`
- `PATCH /api/tasks/:taskId/toggle`
- `DELETE /api/tasks/:taskId`

## Recommended next steps

1. Add refresh tokens and HTTP-only cookies.
2. Add admin module and subscription entities.
3. Add notes and files tables plus signed-upload flow.
4. Add AI chat module with per-Focus conversation history.
5. Move from SQLite to PostgreSQL by changing the Prisma datasource URL and running a new migration strategy.

## Important after this update

The Prisma schema now includes Focus collaborators. If you already created `dev.db`, run a fresh migration or reset the local database before starting the backend again.
