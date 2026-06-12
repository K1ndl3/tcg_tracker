# TCG Tracker

A Pokémon trading-card collection tracker. The whole app is browsable without
an account — anyone can search the Pokémon TCG catalog. Logging in (via the
button in the upper-right corner) unlocks per-account data: the cards you own,
spending, and analytics. Built with a React + Vite frontend and an Express +
PostgreSQL backend with JWT (cookie) authentication, including email/password
and Google sign-in.

## Features

- **Browse Cards** — search the live Pokémon TCG catalog (no login required).
- **Log in / sign up** from a modal opened by the upper-right button (no forced
  redirect — you keep browsing).
- **My Collection** — logged-in users add cards from Browse, adjust quantities,
  and remove cards. Data is scoped per account.
- **Dashboard** — collection summary for logged-in users, guest view otherwise.

## Project layout

```
tcg_tracker/
├── frontend/   # React + Vite app
└── backend/    # Express API + PostgreSQL
```

## Prerequisites

- Node.js 18+ (you have v22)
- Docker Desktop (used to run PostgreSQL locally)

## 1. Start the database

PostgreSQL runs in a Docker container. From the `backend/` folder:

```bash
cd backend
docker compose up -d      # starts PostgreSQL on localhost:5432
```

## 2. Set up and run the backend

```bash
cd backend
npm install               # already done once
# copy .env.example to .env and adjust if needed (a .env is already created)
npm run migrate           # create the database tables
npm run dev               # start the API on http://localhost:4000 (auto-reload)
```

Backend environment variables live in `backend/.env`:

| Variable           | Purpose                                                |
| ------------------ | ------------------------------------------------------ |
| `PORT`             | API port (default 4000)                                |
| `CLIENT_ORIGIN`    | Frontend origin allowed by CORS (default :5173)        |
| `DATABASE_URL`     | PostgreSQL connection string (matches docker-compose)  |
| `JWT_SECRET`       | Secret used to sign session tokens                     |
| `JWT_EXPIRES_IN`   | Session lifetime (default `7d`)                        |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (leave blank to disable Google) |

## 3. Run the frontend

```bash
cd frontend
npm install               # already done once
npm run dev               # http://localhost:5173
```

Frontend environment variables live in `frontend/.env`:

| Variable                | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `VITE_API_URL`          | Base URL of the backend API                      |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID (blank hides the button)  |

Open http://localhost:5173 — you'll be redirected to `/login`. Create an
account, and you'll land on the Dashboard with data scoped to your account.

## Enabling Google sign-in (optional)

Google sign-in is hidden until you provide an OAuth client ID:

1. Go to the [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create (or pick) a project, then **Create Credentials → OAuth client ID**.
3. Application type: **Web application**.
4. Under **Authorized JavaScript origins**, add `http://localhost:5173`.
5. Copy the generated **Client ID** and paste the *same value* into:
   - `frontend/.env` → `VITE_GOOGLE_CLIENT_ID`
   - `backend/.env`  → `GOOGLE_CLIENT_ID`
6. Restart both dev servers.

The backend verifies Google's ID token, then finds or creates the matching
account (linking by email if you already registered with that address).

## Auth model

- Sessions use a signed JWT stored in an **httpOnly cookie** (`tcg_token`), so
  the token is never exposed to JavaScript.
- Passwords are hashed with bcrypt; password-less Google accounts have a `NULL`
  password hash.
- `requireAuth` middleware protects per-account routes; the frontend uses a
  `ProtectedRoute` + `AuthContext` to gate pages and restore the session on load.

## API endpoints

| Method | Path                 | Auth | Description                       |
| ------ | -------------------- | ---- | --------------------------------- |
| GET    | `/api/health`        | no   | Health check                      |
| POST   | `/api/auth/register` | no   | Create account (email/password)   |
| POST   | `/api/auth/login`    | no   | Log in                            |
| POST   | `/api/auth/google`   | no   | Log in / sign up with Google      |
| GET    | `/api/auth/me`       | yes  | Current user from session cookie  |
| POST   | `/api/auth/logout`   | yes  | Clear the session cookie          |
| GET    | `/api/cards`         | yes  | List the account's owned cards    |
| POST   | `/api/cards`         | yes  | Add a card (upserts quantity by API card id) |
| PATCH  | `/api/cards/:id`     | yes  | Update quantity/condition         |
| DELETE | `/api/cards/:id`     | yes  | Remove a card from the account    |

The Pokémon catalog on the Browse page comes from the public
[Pokémon TCG API](https://docs.pokemontcg.io/) and is called directly from the
frontend (no API key needed for light use).

## Database schema

- `users` — accounts (email, optional `password_hash`, optional `google_sub`).
- `cards` — owned cards, each linked to a `user_id` (foundation for the
  collection feature; spending/analytics tables can follow the same pattern).
