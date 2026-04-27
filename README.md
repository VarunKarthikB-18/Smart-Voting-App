````markdown
# Smart Voting App (Election Tracker)

A full‑stack web app for running and tracking elections with secure authentication and an admin workflow.

> **Tech snapshot:** React + Vite (client), Node.js + Express + TypeScript (server), Drizzle ORM + SQLite (default) / Postgres (optional).

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started (Local)](#getting-started-local)
  - [Prerequisites](#prerequisites)
  - [Install](#install)
  - [Database setup](#database-setup)
  - [Run in development](#run-in-development)
  - [Build & run (production)](#build--run-production)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Security Notes](#security-notes)
- [Contributing](#contributing)
- [License](#license)

## Key Features

- Voter authentication (supports password-based flows; repo also includes face recognition dependencies/models)
- Create/manage elections (admin initialization on server start)
- Real-time-ish election tracking UI (client-side data fetching with React Query)
- Session/cookie support and CORS configuration for local development

## Tech Stack

- **Client:** React, Vite, TypeScript, Tailwind CSS
- **Server:** Node.js, Express, TypeScript
- **Database/ORM:** Drizzle ORM
- **Databases:** SQLite (checked in `sqlite.db` / `sessions.db` in this repo) and optional Postgres/Neon
- **Auth & Security:** `express-session`, `cookie-parser`, `bcrypt`, `jsonwebtoken`, `passport`
- **Face Recognition (optional):** `face-api.js` + model files included in the repo

## Project Structure

```text
.
├── client/              # React/Vite frontend
├── server/              # Express backend
├── shared/              # Shared types/schemas/utilities
├── migrations/          # Drizzle migrations
├── scripts/             # Utility scripts (db init, model download, etc.)
├── public/              # Static assets
├── sqlite.db            # SQLite database (dev)
├── sessions.db          # Session store (dev)
└── README.md
```

## Getting Started (Local)

### Prerequisites

- Node.js 18+ (recommended)
- npm

### Install

```bash
git clone https://github.com/VarunKarthikB-18/Smart-Voting-App.git
cd Smart-Voting-App
npm install
```

### Database setup

This repo includes SQLite database files (`sqlite.db`, `sessions.db`). If you want to initialize/reset your database schema:

```bash
npm run db:init
npm run db:push
```

### Run in development

Runs **server + client** concurrently:

```bash
npm run dev
```

- The server will start on **port 3000** (or the next available port up to 3010).
- In development, the app is served via Vite middleware from the Express server.

### Build & run (production)

```bash
npm run build
npm start
```

## Environment Variables

This project uses environment variables for configuration. Create a `.env` file in the repo root (if needed) and add values similar to the following:

```bash
# Server
PORT=3000
NODE_ENV=development

# Database (optional)
DATABASE_URL=

# Auth (optional)
JWT_SECRET=your-secret
SESSION_SECRET=your-session-secret
```

> If you’re using SQLite locally, `DATABASE_URL` may be unnecessary depending on your server/db setup.

## Scripts

From the root `package.json`:

- `npm run dev` – start server + client
- `npm run dev:server` – start only the server
- `npm run dev:client` – start only the client
- `npm run build` – build client and bundle server to `dist/`
- `npm start` – run the production build
- `npm run check` – typecheck
- `npm run db:init` – initialize DB (script)
- `npm run db:push` – apply schema to DB via Drizzle
- `npm run download-models` – download face detection models (if not already present)

## Security Notes

This is a demo/academic-style project. Before using for any real election workflow:

- Perform a professional security review
- Use HTTPS everywhere
- Store secrets in a proper secret manager (not in git)
- Consider threat modeling, audit logging, rate limiting, and stronger identity verification

## Contributing

Pull requests are welcome.

1. Fork the repo
2. Create a feature branch
3. Commit changes
4. Open a PR

## License

MIT License — see [LICENSE](LICENSE).
````
