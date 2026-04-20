# Innovation Center Platform

Full-stack MOMAH innovation platform with:

- bilingual Arabic and English UI
- role-based authentication and authorization
- challenge creation and lifecycle management
- public and partner idea submission
- ministry review workflows
- admin-only user management
- in-app notifications
- optional email notifications
- OpenAI-powered chatbot and translation actions
- PostgreSQL persistence for cloud hosting

## Stack

- React + Vite frontend
- Express backend
- PostgreSQL database
- OpenAI API for chatbot and translation

## Local Run

1. Install Node.js 18+.
2. Run `npm install`
3. Add secrets in `.env.local`
4. Run `npm run dev`

The frontend runs on Vite in development and proxies `/api` to the Express backend on port `4000`.

## PostgreSQL

The app now uses PostgreSQL and reads connection settings from either:

- `DATABASE_URL`
- or `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

It also expects:

- `DB_SCHEMA`
- `PGSSL`

The current target schema for Railway is `momah`.

## One-Time Migration From SQLite

If you have existing local SQLite data and want to copy it into PostgreSQL:

```powershell
npm run db:migrate:postgres
```

This migrates the local SQLite database from `server/data/innovation-center.db` into the configured PostgreSQL schema.

## Demo Ministry Accounts

- `admin@momah.sa` / `Admin123!`
- `director@momah.sa` / `Director123!`
- `staff@momah.sa` / `Staff123!`
- `expert@momah.sa` / `Expert123!`
- `sector@momah.sa` / `Sector123!`

You can also register your own account as:

- `public_user`
- `partner_entity`

## Main Roles

- `admin`: full access including admin dashboard
- `innovation_director`: challenge creation, challenge management, and review access
- `innovation_staff`: challenge creation and review access
- `innovation_expert`: review access
- `sector_owner`: challenge creation access
- `public_user`: idea submission and idea management
- `partner_entity`: idea submission and idea management

## Email Notifications

Website notifications work by default.

To enable email delivery, set these variables:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Production Build

```powershell
npm run build
npm run start
```

The Express server serves the built frontend from `dist` and the API from the same process, which makes Railway deployment simple.

## Railway Deployment

Recommended setup:

1. Push this project to GitHub.
2. Create a Railway service from the repo.
3. Set environment variables:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
   - `JWT_SECRET`
   - `DATABASE_URL` or the `PG*` variables
   - `DB_SCHEMA=momah`
   - optional SMTP variables
4. Use:
   - build command: `npm install && npm run build`
   - start command: `npm run start`

If Railway already injects `DATABASE_URL`, you can use that directly and remove the manual `PG*` variables.
