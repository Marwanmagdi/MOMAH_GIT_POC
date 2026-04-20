# Innovation Center Platform

Full-stack MOMAH innovation platform with:

- bilingual Arabic and English UI
- login and registration
- SQLite database persistence
- role-based access control
- ministry-only challenge creation
- public and partner idea submission
- internal review workflows for ministry roles
- admin-only dashboard
- challenge detail drill-down with idea submitter details
- in-app notifications for idea updates and review outcomes
- public-user idea editing with updated timestamps
- privileged user management actions
- OpenAI-backed chatbot route on the backend

## Run locally

1. Install Node.js 18+.
2. Run `npm install`
3. Add local secrets in `.env.local`
4. Run `npm run dev`

The frontend runs on Vite and proxies `/api` to the Express backend on port `4000`.

## Demo ministry accounts

- `admin@momah.sa` / `Admin123!`
- `director@momah.sa` / `Director123!`
- `staff@momah.sa` / `Staff123!`
- `expert@momah.sa` / `Expert123!`
- `sector@momah.sa` / `Sector123!`

You can also register your own account from the login page as either:

- `public_user`
- `partner_entity`

## Main roles

- `admin`: full access including admin dashboard
- `innovation_director`: challenge creation and review access
- `innovation_staff`: challenge creation and review access
- `innovation_expert`: review access
- `sector_owner`: challenge creation access
- `public_user`: idea submission
- `partner_entity`: idea submission

The partner entity role is intentionally kept because the BRD includes an entity registration stage for Matchmakers and approval by innovation management.

## Optional email notifications

In-app notifications work by default.

To enable email delivery as well, add SMTP settings to `.env.local`:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Production-style startup

- `npm run build`
- `npm run start`

The Express server will serve the built frontend from `dist` and the API from the same process.
