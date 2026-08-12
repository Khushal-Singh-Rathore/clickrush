# ClickRush — Master Project Specification

You are helping me build ClickRush, a full-stack 60-second click challenge application.

This is an engineering assignment for an open-source engineering community.

The project must be:
- Production-quality for its scope
- Clean and maintainable
- Easy to understand and explain
- Properly documented
- Deployable
- Not over-engineered

I will implement and review the project in stages. DO NOT build the entire project at once.

I will give you separate implementation prompts for each phase.

==================================================
PRODUCT
==================================================

ClickRush allows authenticated users to play a 60-second clicking game.

Core flow:

Register
  ↓
Login
  ↓
Receive JWT
  ↓
Start game
  ↓
Create server-side game session
  ↓
Connect WebSocket
  ↓
60-second real-time game
  ↓
Server validates/counts clicks
  ↓
Game ends
  ↓
Server calculates/stores score
  ↓
Leaderboard

Required features:

1. User registration
2. User login
3. JWT authentication
4. Protected API endpoints
5. 60-second clicking game
6. WebSocket-based gameplay
7. Server-authoritative game timing
8. Server-side click counting/validation
9. Game history
10. User profile
11. Global leaderboard
12. Daily leaderboard
13. Weekly leaderboard
14. PostgreSQL database
15. Alembic migrations
16. Backend tests
17. Responsive frontend
18. Deployment
19. Professional README
20. Database schema documentation

Optional bonus features:
- Real-time leaderboard updates
- Multiple game modes
- Advanced animations
- Advanced anti-cheat

Do not implement bonus features until all required features are complete.

==================================================
TECHNOLOGY
==================================================

Frontend:
- React
- Vite
- TypeScript
- Tailwind CSS

Backend:
- Python
- FastAPI
- SQLAlchemy 2.x
- Alembic
- Pydantic v2
- Pydantic Settings

Database:
- PostgreSQL

Authentication:
- Custom JWT authentication
- PyJWT
- Argon2 password hashing

Development:
- uv

Deployment target:
- Frontend: Cloudflare Pages or Vercel
- Backend: Render
- Database: Neon PostgreSQL

==================================================
ARCHITECTURE
==================================================

Use a modular monolith.

Do NOT create microservices.

Do NOT introduce unnecessary:
- Redis
- Celery
- Kafka
- RabbitMQ
- Kubernetes
- GraphQL
- event buses
- message brokers
- separate game servers

The backend and WebSocket server should run inside the same FastAPI application.

Expected backend structure:

backend/
    app/
        main.py
        database.py
        config.py

        models/
            users.py
            game_sessions.py

        schemas/
            users.py
            auth.py
            game_sessions.py
            leaderboard.py

        routers/
            auth.py
            users.py
            games.py
            leaderboard.py

        services/
            auth.py
            game.py
            leaderboard.py

        dependencies/
            auth.py

        utils/
            security.py

    alembic/
    tests/
    .env.example
    pyproject.toml

Use this structure as guidance, but don't create unnecessary files.

==================================================
DATABASE
==================================================

Initial schema contains two main tables.

USERS

id
- UUID
- primary key
- automatically generated

name
- VARCHAR(100)
- NOT NULL

email
- VARCHAR(255)
- NOT NULL
- UNIQUE

password_hash
- VARCHAR(255)
- NOT NULL

is_active
- BOOLEAN
- NOT NULL
- default TRUE

created_at
- timezone-aware timestamp
- NOT NULL

GAME_SESSIONS

id
- UUID
- primary key
- automatically generated

user_id
- UUID
- foreign key -> users.id
- NOT NULL
- ON DELETE CASCADE

click_count
- INTEGER
- NOT NULL
- default 0

score
- INTEGER
- NOT NULL
- default 0

started_at
- timezone-aware timestamp
- NOT NULL

ended_at
- timezone-aware timestamp
- nullable

status
- PostgreSQL enum:
    ACTIVE
    COMPLETED
    ABANDONED

Relationship:

User 1 ---- N GameSession

Use SQLAlchemy 2.x typed ORM mappings:

Mapped[]
mapped_column()
relationship()

Use Alembic for all schema changes.

Never manually modify production database schema.

==================================================
INDEXING
==================================================

Indexes must be based on actual access patterns.

Important queries include:

1. User game history:
WHERE user_id = ?

2. Global leaderboard:
ORDER BY score DESC

3. Daily leaderboard:
WHERE started_at >= ?
ORDER BY score DESC

4. Weekly leaderboard:
WHERE started_at >= ?
ORDER BY score DESC

Do not add indexes blindly.

Prefer appropriate composite indexes when justified.

Explain important indexes in the documentation.

==================================================
AUTHENTICATION
==================================================

Build authentication ourselves.

Registration:

POST /auth/register

Input:
name
email
password

Password:
plaintext
→ Argon2 hash
→ password_hash
→ database

Never store plaintext passwords.

Login:

POST /auth/login

Input:
email
password

Process:
find user
→ verify Argon2 hash
→ generate JWT
→ return access token

JWT should contain at minimum:
- subject/user ID
- expiration

Do not store sensitive information inside JWT.

Protected endpoints use:

Authorization: Bearer <token>

Create reusable FastAPI dependency:

get_current_user()

It must:
- extract bearer token
- decode JWT
- validate signature
- validate expiration
- extract user ID
- load user
- verify active user
- reject invalid users

Use appropriate HTTP status codes.

Do not reveal whether an email exists during failed login.

==================================================
GAME FLOW
==================================================

The game uses WebSocket for the active 60-second gameplay.

Architecture:

1. Authenticated user calls:

POST /games/start

2. Backend:
- verifies JWT
- creates GameSession
- generates UUID
- sets server-side started_at
- status = ACTIVE
- click_count = 0
- score = 0

3. Backend returns game_session_id.

4. Frontend connects to:

WebSocket /ws/games/{game_session_id}

5. WebSocket authenticates the JWT.

6. Backend verifies:
- JWT
- user
- game session
- session ownership
- session status

7. Client sends click events.

8. Backend:
- validates session
- counts clicks
- tracks server-side game duration
- rejects late clicks
- prevents duplicate completion

9. Backend determines when 60 seconds have elapsed using SERVER TIME.

10. At game end:
- stop accepting clicks
- calculate score
- set ended_at using server time
- set status = COMPLETED
- persist result
- send final result
- close WebSocket cleanly

The client must NOT be trusted for:
- score
- start time
- end time
- duration

Do not implement sophisticated anti-cheat.

==================================================
WEBSOCKET SECURITY
==================================================

Handle:

- invalid JWT
- expired JWT
- missing JWT
- nonexistent session
- session belonging to another user
- already completed session
- abandoned session
- duplicate messages
- late click events
- disconnects
- reconnect attempts
- connection cleanup

The WebSocket must not allow a user to manipulate another user's session.

==================================================
API
==================================================

AUTH:

POST /auth/register
POST /auth/login
GET /auth/me

USERS:

GET /users/me
GET /users/me/games

GAMES:

POST /games/start
GET /games/{game_id}

WebSocket:

/ws/games/{game_id}

LEADERBOARD:

GET /leaderboard
GET /leaderboard/daily
GET /leaderboard/weekly

Only completed games appear in leaderboards.

Use Pydantic response schemas.

Do not expose SQLAlchemy ORM objects directly.

==================================================
LEADERBOARDS
==================================================

Do not create a leaderboard table initially.

Calculate leaderboards from game_sessions.

Global:
highest scores among completed sessions.

Daily:
completed sessions from current UTC day.

Weekly:
completed sessions from current UTC week.

Return useful information:
- rank
- user name
- score
- click count
- timestamp

Where practical, return the authenticated user's current rank.

Use efficient SQL queries.

==================================================
PROFILE
==================================================

Authenticated user profile should show:

- name
- email
- created_at
- total games
- best score
- average score
- ranking where practical

Game history should show:
- score
- click_count
- status
- started_at
- ended_at

==================================================
FRONTEND
==================================================

Required screens:

1. Landing
2. Register
3. Login
4. Game dashboard
5. Active game
6. Result screen
7. Leaderboard
8. Profile/history

Game screen should prominently show:
- time remaining
- click count
- large click button

Keep UI clean and responsive.

Use React + TypeScript + Tailwind.

Do not over-design.

==================================================
SECURITY
==================================================

At minimum:

- Argon2 password hashing
- JWT expiration
- protected endpoints
- ownership checks
- input validation
- CORS configuration
- environment variables
- no secrets in Git
- .env.example
- duplicate game prevention
- server-side game timing
- server-side score calculation
- WebSocket authentication

==================================================
CONFIGURATION
==================================================

Use pydantic-settings.

Environment variables:

DATABASE_URL
JWT_SECRET_KEY
JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES
CORS_ORIGINS

Provide .env.example.

Never commit .env.

==================================================
TESTING
==================================================

Test important behavior:

- registration
- duplicate email
- login
- invalid login
- protected route without JWT
- invalid JWT
- start game
- finish game
- duplicate finish
- ownership validation
- leaderboard filtering
- completed games only

Do not chase 100% coverage.

==================================================
README
==================================================

README must contain:

- project overview
- features
- architecture
- tech stack
- project structure
- local setup
- environment variables
- database setup
- Alembic commands
- backend startup
- frontend startup
- API documentation
- authentication flow
- WebSocket flow
- database schema
- indexes
- deployment instructions
- known limitations

Include an ER diagram using Mermaid.

==================================================
ENGINEERING PRINCIPLES
==================================================

Prioritize:

1. Correctness
2. Security
3. Understandability
4. Maintainability
5. Performance
6. Simplicity

Do not over-engineer.

When there are multiple valid approaches, choose the approach that is:
- widely used
- well documented
- appropriate for the project size
- easy to maintain

Do not blindly follow outdated tutorials.

Use current stable APIs and idiomatic SQLAlchemy 2.x / FastAPI / Pydantic v2 patterns.

==================================================
IMPORTANT WORKFLOW
==================================================

I will provide implementation instructions one phase at a time.

NEVER implement future phases unless explicitly asked.

At the end of every phase:
1. Summarize files changed
2. Explain important architectural decisions
3. Provide commands to run/test
4. Mention anything I should manually verify
5. Stop and wait for my next instruction

Do not silently make major architectural changes.

==================================================
SUCCESS CRITERIA
==================================================

The finished project must:

- work locally
- pass important tests
- use PostgreSQL correctly
- use Alembic migrations
- authenticate users securely
- implement JWT authorization
- implement WebSocket gameplay
- enforce a server-side 60-second game
- store game results
- provide global/daily/weekly leaderboards
- provide user history/profile
- have a clean React frontend
- be deployable
- have a professional README
- be understandable enough for me to explain during a code review

Wait for my phase-specific instructions before implementing anything.

IMPORTANT --> All the import or run commands or any type of command should be run by me. You should now run it automatically. I want to learn the meaning and need of the commands.