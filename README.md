# ⚡ ClickRush — 60-Second & 15-Second Real-Time Click Challenge

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Pytest](https://img.shields.io/badge/Pytest_33%2F33_Passed-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)

**ClickRush** is a full-stack, real-time web application where players compete to click as fast as possible within tight timeframes (**60-Second Classic Endurance** or **15-Second Speed Blitz ⚡**).

Built with a **server-authoritative backend architecture** (FastAPI + WebSockets + PostgreSQL), ClickRush ensures precise timer enforcement, zero client-side score manipulation, sub-millisecond database queries, and a glassmorphic UI.

---

## 🌟 Key Features

### 1. 🔐 Secure User Authentication
* Argon2id password hashing using `argon2-cffi` (resistant to GPU cracking).
* Stateful Bearer JWT tokens for REST & WebSocket authentication.
* Protected endpoints and user session persistence.

### 2. ⚡ Real-Time WebSocket Gameplay & Multi-Modes
* **Server-Authoritative Clock:** The server controls elapsed time and automatically completes sessions at the exact 15.0s or 60.0s boundary.
* **Low-Latency Streaming:** Bidirectional WebSocket (`/ws/games/{game_id}`) streams clicks and seconds remaining in real time.
* **Multiple Game Modes:**
  * **60s Classic Endurance Mode**
  * **15s Speed Blitz Mode ⚡**

### 3. 🎵 Web Audio Sound Effects (Zero External Files)
* Uses native browser `AudioContext` to synthesize audio feedback dynamically:
  * **Click Pop:** Frequency ramp on button press (`450Hz -> 800Hz`).
  * **Countdown Beep:** Warning beep during final 3-second countdown (`880Hz`).
  * **Victory Fanfare:** 3-note ascending chime (`C5 -> E5 -> G5`) on completion.

### 4. 🏆 Dynamic Mode-Specific Leaderboards
* Endpoints for **Global (All-Time)**, **Daily (Today UTC)**, and **Weekly (7 Days)** rankings.
* Mode-specific filtering (`?duration_seconds=15` or `60`) so 15-second scores are never mixed with 60-second scores.
* **Live Auto-Refresh:** Periodic 10-second polling option with visual indicator.

### 5. 👤 Profile & Personal Game History
* Aggregate statistics: Best Score, Average Score, Total Games Played, and **Exact Global Rank** calculated for your best session.
* Paginated personal history log detailing session status (`COMPLETED`, `ABANDONED`, `ACTIVE`), click count, score, duration tag, and timestamp.

### 6. 🎨 Glassmorphism Nature UI
* Frosted glass card overlays (`backdrop-blur-xl`, `bg-white/10`, `border-white/20`) over high-resolution nature wallpaper.

---

## 🛠️ Technology Stack

* **Backend:** Python 3.13, FastAPI, SQLAlchemy 2.x, Alembic Migrations, PyJWT, Argon2-cffi, Uvicorn.
* **Frontend:** React 18, Vite, TypeScript, Tailwind CSS v4, Lucide Icons, Axios, React Router v6.
* **Database:** PostgreSQL (with typed SQLAlchemy `Mapped` models and composite performance indexes).
* **Package Management:** `uv` (Fast Python package manager) and `npm`.

---

## 📁 Repository Monorepo Structure

```text
clickrush/
├── app/                          # FastAPI Backend Application
│   ├── config.py                 # Pydantic BaseSettings environment config
│   ├── database.py               # SQLAlchemy engine & session maker
│   ├── dependencies.py           # get_current_user JWT dependency
│   ├── main.py                   # FastAPI app initialization & CORS middleware
│   ├── models/                   # SQLAlchemy 2.x ORM models
│   │   ├── users.py              # User model definition
│   │   └── game_sessions.py      # GameSession model & GameStatus Enum
│   ├── routers/                  # Modular APIRouters
│   │   ├── auth.py               # Register, Login, /auth/me
│   │   ├── games.py              # POST /games/start, GET /games/{id}
│   │   ├── websocket.py          # WS /ws/games/{id} real-time gameplay
│   │   ├── leaderboard.py        # /leaderboard, /daily, /weekly
│   │   └── users.py              # GET /users/me, GET /users/me/games
│   ├── schemas/                  # Pydantic v2 data validation schemas
│   └── utils/                    # Security & JWT encoding helpers
├── alembic/                      # Database Migration Scripts
├── tests/                        # Automated Pytest Test Suite (33 Tests)
├── frontend/                     # React + Vite + TypeScript Frontend Application
│   ├── src/
│   │   ├── assets/               # Background images & SVGs
│   │   ├── components/           # Navbar & UI controls
│   │   ├── context/              # AuthContext (JWT & login state)
│   │   ├── hooks/                # useGameWebSocket custom hook
│   │   ├── pages/                # Landing, Login, Register, Dashboard, Game, Leaderboards, Profile
│   │   ├── services/             # Axios API client instance
│   │   ├── styles/               # Glassmorphism theme & CSS variables
│   │   └── utils/                # Web Audio sound effects synthesizer
│   ├── package.json
│   └── vite.config.ts
├── pyproject.toml
├── REQUIREMENTS.md
├── STAGES.md
└── README.md
```

---

## 🗄️ Database Schema & ER Diagram

```mermaid
erDiagram
    users ||--o{ game_sessions : "plays"

    users {
        uuid id PK "UUID primary key"
        string name "User full name"
        string email UK "Unique indexed email"
        string password_hash "Argon2id password hash"
        boolean is_active "Active user flag"
        datetime created_at "UTC creation timestamp"
    }

    game_sessions {
        uuid id PK "UUID primary key"
        uuid user_id FK "Foreign key -> users.id (CASCADE)"
        int click_count "Total verified click count"
        int score "Calculated game score"
        int duration_seconds "Session duration (15 or 60)"
        enum status "ACTIVE | COMPLETED | ABANDONED"
        datetime started_at "UTC session start timestamp"
        datetime ended_at "UTC session end timestamp"
    }
```

### Composite Database Indexes
1. `ix_game_sessions_leaderboard_global`: `(status, duration_seconds, score DESC)`
2. `ix_game_sessions_leaderboard_timeframe`: `(status, duration_seconds, started_at, score DESC)`
3. `ix_game_sessions_user_history`: `(user_id, started_at DESC)`

---

## 🔌 API & WebSocket Specifications

### REST API Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/auth/register` | ❌ | Create a new user account (`name`, `email`, `password`). |
| `POST` | `/auth/login` | ❌ | Authenticate credentials and receive Bearer JWT token. |
| `GET` | `/auth/me` | ✅ | Get profile details of the authenticated user. |
| `POST` | `/games/start` | ✅ | Start a new game session (`{"duration_seconds": 15}` or `60`). |
| `GET` | `/games/{game_id}` | ✅ | Retrieve details of a specific game session. |
| `GET` | `/leaderboard` | ✅ | All-time global leaderboard (`?duration_seconds=15|60`). |
| `GET` | `/leaderboard/daily` | ✅ | Daily leaderboard for current UTC day. |
| `GET` | `/leaderboard/weekly` | ✅ | Weekly leaderboard for the last 7 days. |
| `GET` | `/users/me` | ✅ | User stats (Best score, Avg score, Total games, Exact Rank). |
| `GET` | `/users/me/games` | ✅ | Paginated personal game history log. |
| `GET` | `/health` | ❌ | Uptime and database connectivity health check. |

### WebSocket Endpoint

* **URL:** `ws://localhost:8000/ws/games/{game_id}?token={JWT_TOKEN}`
* **Inbound Messages (Client $\rightarrow$ Server):**
  * `{"type": "click"}`: Record a click.
  * `{"type": "finish"}`: Request early session completion.
* **Outbound Messages (Server $\rightarrow$ Client):**
  * `{"type": "game_start", "seconds_remaining": 60.0}`: Gameplay initialization.
  * `{"type": "state", "click_count": 42, "seconds_remaining": 45.2}`: Real-time HUD update.
  * `{"type": "game_complete", "score": 42, "status": "COMPLETED"}`: Server authoritative completion payload.

---

## 💻 Local Setup & Running Guide

### Prerequisites
* **Python:** `3.13+`
* **Node.js:** `18+`
* **PostgreSQL:** Running locally or via Docker
* **Package Manager:** `uv` (`curl -LsSf https://astral.sh/uv/install.sh | sh`)

### Step 1: Clone Repository & Configure Database
```bash
git clone git@github.com:Khushal-Singh-Rathore/clickrush.git
cd clickrush
```

Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clickrush
JWT_SECRET=super-secret-jwt-key-for-local-development
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
```

### Step 2: Apply Database Migrations
```bash
uv run alembic upgrade head
```

### Step 3: Start FastAPI Backend
```bash
uv run uvicorn app.main:app --reload
```
* Backend API will be live at `http://localhost:8000`
* Swagger Interactive Docs: `http://localhost:8000/docs`

### Step 4: Start React Frontend
In a separate terminal tab:
```bash
cd frontend
npm install
npm run dev
```
* Frontend Application will be live at `http://localhost:5173`

---

## 🧪 Automated Testing & Quality Pass

Execute full backend automated pytest suite (33 test cases covering Auth, Game Sessions, WebSockets, Leaderboards, User Profiles, Security Isolation, and Data Privacy):

```bash
uv run pytest -v
```

Execute frontend production build verification:
```bash
cd frontend && npm run build
```

---

## ☁️ Deployment Guide

* **Database (Neon PostgreSQL):** Create a serverless Postgres project on [Neon.tech](https://neon.tech) and set `DATABASE_URL`.
* **Backend (Render):** Create a Web Service pointing to `app.main:app` with build command `uv sync` and start command `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Run `uv run alembic upgrade head` to migrate production DB.
* **Frontend (Vercel / Cloudflare Pages):** Connect repository with root directory `frontend/`, build command `npm run build`, output directory `dist/`, and environment variable `VITE_API_URL`.

---

## 🎥 Loom Video Walkthrough Script (2-Minute Demo)

1. **Introduction (0:00 - 0:20):**
   * Introduce ClickRush: A full-stack 60-second & 15-second real-time click challenge built with FastAPI, WebSockets, PostgreSQL, and React.
2. **Authentication & Glassmorphism UI (0:20 - 0:45):**
   * Demonstrate User Registration and Login.
   * Highlight the frosted glass UI theme over nature background.
3. **Real-Time Gameplay & Audio (0:45 - 1:15):**
   * Show Dashboard mode toggle (60s Classic vs 15s Speed Blitz).
   * Click "Start Challenge" -> Demonstrate real-time WebSocket gameplay, live click counter, countdown timer, sound effects, and server completion screen.
4. **Leaderboards & Profile History (1:15 - 1:45):**
   * Switch to Leaderboards screen: Show Global, Daily, Weekly rankings, mode filters, and live auto-refresh.
   * Switch to Profile: Demonstrate exact mode-specific global rank and game history log.
5. **Conclusion & System Integrity (1:45 - 2:00):**
   * Highlight server-authoritative timer enforcement, composite database indexing, and 33 passing automated tests.
