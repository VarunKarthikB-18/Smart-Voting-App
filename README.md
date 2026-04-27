# 🗳️ Smart Voting App

> A full-stack election management platform with secure authentication, real-time tracking, and optional face recognition — built for demos and academic use.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

Smart Voting App is a full-stack web application for running and tracking elections end-to-end. Admins can create and manage elections; voters authenticate securely before casting ballots; results update in real time on the client. The repo ships with SQLite out of the box so you can be running in minutes — Postgres/Neon is supported for production-like deployments.

---

## ✨ Key Features

| Feature | Details |
|---|---|
| 🔐 Voter Authentication | Password-based login; optional face-recognition (models included) |
| 🏛️ Election Management | Admin workflow initialized on server start; full CRUD for elections |
| 📊 Real-Time Results | Live UI updates via React Query polling |
| 🗄️ Dual Database Support | SQLite (zero-config dev) or Postgres/Neon (production) |
| 🍪 Session Handling | `express-session` + cookie-based sessions with CORS support |

---

## 🛠️ Tech Stack

**Client**
- React + Vite + TypeScript
- Tailwind CSS
- React Query

**Server**
- Node.js + Express + TypeScript
- Drizzle ORM (SQLite by default; Postgres optional)
- `express-session`, `cookie-parser`, `bcrypt`, `jsonwebtoken`, `passport`

**Optional**
- `face-api.js` with bundled model files for face-based voter verification

---

## 📁 Project Structure

```
Smart-Voting-App/
├── client/           # React/Vite frontend
├── server/           # Express backend
├── shared/           # Shared types, schemas, utilities
├── migrations/       # Drizzle ORM migrations
├── scripts/          # DB init, model download, and other utilities
├── public/           # Static assets
├── sqlite.db         # SQLite database (dev, checked in)
├── sessions.db       # Session store (dev, checked in)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
- **npm**

### 1. Clone & Install

```bash
git clone https://github.com/VarunKarthikB-18/Smart-Voting-App.git
cd Smart-Voting-App
npm install
```

### 2. Set Up the Database

SQLite files are already checked in, so this step is only needed if you want to reset or re-initialize the schema:

```bash
npm run db:init   # Initialize the database
npm run db:push   # Apply the Drizzle schema
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=3000
NODE_ENV=development

# Auth
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret

# Database (leave blank to use SQLite)
DATABASE_URL=
```

> **Note:** `DATABASE_URL` is only required when targeting a Postgres/Neon database. SQLite works without it.

### 4. Start the Dev Server

```bash
npm run dev
```

This runs the Express server and Vite client concurrently. The app will be available at **http://localhost:3000** (or the next available port up to 3010).

---

## 📦 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start server + client concurrently (development) |
| `npm run dev:server` | Start the Express server only |
| `npm run dev:client` | Start the Vite client only |
| `npm run build` | Build client and bundle server into `dist/` |
| `npm start` | Run the production build |
| `npm run check` | TypeScript type-check |
| `npm run db:init` | Initialize the database |
| `npm run db:push` | Apply schema via Drizzle |
| `npm run download-models` | Download face detection models (if missing) |

---

## 🏗️ Build & Deploy

```bash
npm run build   # Compiles client + server into dist/
npm start       # Serves the production build
```

For Postgres, set `DATABASE_URL` to your connection string before running.

---

## 🔒 Security Notes

This project is intended for **demos and academic use**. Before using it in any real election context:

- [ ] Conduct a professional security audit
- [ ] Enforce HTTPS everywhere (TLS termination at reverse proxy or load balancer)
- [ ] Move all secrets to a proper secret manager (e.g., AWS Secrets Manager, Vault) — **never commit secrets to git**
- [ ] Add rate limiting, audit logging, and brute-force protection
- [ ] Perform threat modeling specific to your deployment environment
- [ ] Strengthen identity verification beyond password / face recognition for high-stakes use cases

---

## 🤝 Contributing

Pull requests are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push and open a pull request

Please keep changes focused and include a clear description in your PR.

---

## 📄 License

[MIT License](LICENSE) — free to use, modify, and distribute.
