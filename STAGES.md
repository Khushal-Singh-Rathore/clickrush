## Implement Phase 1 only: Backend foundation.

Tasks:

1. Inspect the existing repository.
2. Set up the backend structure.
3. Configure pydantic-settings.
4. Configure .env and .env.example.
5. Configure SQLAlchemy 2.x.
6. Configure PostgreSQL connection.
7. Create the SQLAlchemy Base.
8. Create database session dependency.
9. Create FastAPI application.
10. Add a simple /health endpoint.
11. Configure basic CORS structure.
12. Initialize Alembic.
13. Configure Alembic to use the application's SQLAlchemy metadata.
14. Do not create business models yet.
15. Do not implement authentication.
16. Do not implement WebSockets.
17. Do not implement frontend.

Make the smallest clean implementation necessary.

At the end:
- show files changed
- show how to run the backend
- show how to verify /health
- show how to verify database connectivity
- stop.


## Implement Phase 2 only: Database models and migration.

Create:

1. User SQLAlchemy model
2. GameSession SQLAlchemy model
3. User → GameSession one-to-many relationship
4. UUID primary keys
5. PostgreSQL ENUM for GameStatus:
   ACTIVE
   COMPLETED
   ABANDONED
6. Foreign key:
   game_sessions.user_id → users.id
   ON DELETE CASCADE
7. Proper timezone-aware timestamps
8. Appropriate NOT NULL constraints
9. Appropriate defaults
10. Appropriate indexes based on the documented leaderboard/history queries.

Use SQLAlchemy 2.x typed mappings.

Use TYPE_CHECKING where needed to avoid circular imports.

Then:

1. Create Alembic migration.
2. Review the generated migration for correctness.
3. Apply the migration.

Do not implement:
- JWT
- WebSockets
- routers
- frontend
- leaderboard APIs

At the end explain:
- schema
- relationships
- indexes
- why UUIDs are used
- why GameStatus is an enum

Stop after Phase 2.


## Implement Phase 3 only: Authentication.

Implement:

1. User registration
2. Argon2 password hashing
3. Login
4. JWT access token generation
5. JWT validation
6. get_current_user FastAPI dependency
7. Protected /auth/me endpoint
8. Authentication Pydantic schemas
9. Proper authentication error handling

Endpoints:

POST /auth/register
POST /auth/login
GET /auth/me

Rules:

- never store plaintext passwords
- never return password_hash
- use JWT expiration
- validate JWT signature
- validate JWT expiration
- use user UUID as JWT subject
- prevent inactive users from authenticating
- don't reveal whether an email exists during failed login

Add tests for:
- registration
- duplicate email
- successful login
- incorrect password
- invalid token
- expired token if practical
- protected endpoint without token

Do not implement:
- WebSockets
- game logic
- leaderboards
- frontend

Stop after Phase 3.


## Implement Phase 4 only: Game session lifecycle.

Implement:

POST /games/start
GET /games/{game_id}

POST /games/start must:

1. Require authentication.
2. Create a GameSession.
3. Generate UUID.
4. Set server-side started_at.
5. Set status = ACTIVE.
6. Set click_count = 0.
7. Set score = 0.
8. Return the game session.

GET /games/{game_id} must:
- require authentication
- verify ownership
- not expose another user's game
- return a Pydantic response schema

Do not implement WebSocket yet.

Do not allow the client to provide started_at.

Add tests for:
- authenticated game start
- unauthenticated start
- retrieving own session
- accessing another user's session
- nonexistent session

Stop after Phase 4.


## Implement Phase 5 only: WebSocket-based 60-second gameplay.

WebSocket endpoint:

/ws/games/{game_id}

Flow:

1. Client already has a valid JWT.
2. Client connects to WebSocket.
3. Authenticate the JWT.
4. Load the GameSession.
5. Verify:
   - user exists
   - user is active
   - session exists
   - session belongs to user
   - session status is ACTIVE
6. Begin the 60-second server-authoritative game.
7. Client sends click messages.
8. Backend counts valid clicks.
9. Backend uses SERVER TIME to determine the 60-second limit.
10. Client cannot control:
    - started_at
    - ended_at
    - score
    - duration
11. When 60 seconds expire:
    - stop accepting clicks
    - calculate score
    - update click_count
    - update score
    - set ended_at
    - set status = COMPLETED
    - commit transaction
    - send final result
    - close WebSocket

Define a simple, documented WebSocket message protocol.

Example:

Client:
{"type": "click"}

Server:
{"type": "state", ...}

Final:
{"type": "game_complete", ...}

Handle:
- invalid JWT
- expired JWT
- invalid session
- wrong user
- completed session
- duplicate/late click
- disconnect
- reconnect
- database errors

Keep the implementation understandable.

Do not implement sophisticated anti-cheat.

Do not implement real-time leaderboard broadcasting yet.

Add tests where practical.

Stop after Phase 5.



## Implement Phase 6 only: Leaderboards.

Create:

GET /leaderboard
GET /leaderboard/daily
GET /leaderboard/weekly

Requirements:

- only COMPLETED games
- global leaderboard ordered by score descending
- daily leaderboard based on UTC day
- weekly leaderboard based on UTC week
- include rank
- include user name
- include score
- include click_count
- include relevant timestamp

Use efficient SQLAlchemy queries.

Review the indexes created earlier and ensure they match the actual query patterns.

Do not create a leaderboard table.

Add tests for:
- global ranking
- daily filtering
- weekly filtering
- incomplete games excluded
- ordering
- pagination if implemented

Stop after Phase 6.


## Implement Phase 7 only: User profile and game history.

Endpoints:

GET /users/me
GET /users/me/games

Profile should return:
- name
- email
- created_at
- total games
- best score
- average score
- ranking if practical

Game history:
- recent completed/abandoned sessions
- score
- click_count
- status
- started_at
- ended_at

Require authentication.

Use efficient aggregate queries.

Do not implement frontend.

Stop after Phase 7.


## Implement Phase 8 only: Backend quality pass.

Review the entire backend for:

- incorrect SQLAlchemy patterns
- unnecessary queries
- N+1 problems
- missing ownership checks
- authentication issues
- transaction problems
- connection/session leaks
- incorrect status codes
- bad Pydantic schemas
- poor error handling
- timezone problems
- race conditions around game completion
- duplicate game completion
- WebSocket lifecycle issues

Add/fix tests for important behavior.

Do not rewrite working code unnecessarily.

Do not introduce new architecture unless clearly justified.

At the end provide:
- test command
- test summary
- important issues found
- remaining backend limitations

Stop.

## Implement Phase 9 only: React frontend.

Use:
- React
- Vite
- TypeScript
- Tailwind CSS

Build:

1. Landing page
2. Register
3. Login
4. Dashboard
5. Game screen
6. Result screen
7. Global leaderboard
8. Daily leaderboard
9. Weekly leaderboard
10. Profile
11. Game history

Game screen:

- 60-second timer
- click count
- large click button
- clear visual feedback
- WebSocket connection state
- game completion state

Integrate with the existing FastAPI backend.

Do not modify backend architecture unless absolutely necessary.

Use frontend environment variables for API URL.

Handle:
- loading
- errors
- expired authentication
- WebSocket disconnect
- game completion

Keep UI polished but don't spend time on unnecessary animations.

Stop after Phase 9.

## Implement Phase 10 only: Deployment readiness.

Prepare:

Backend:
- Render deployment
- production environment variables
- production CORS
- database connection
- Alembic migrations
- health check

Database:
- Neon PostgreSQL

Frontend:
- Cloudflare Pages or Vercel
- production API URL

Verify:

1. Database migration from empty database
2. Backend starts successfully
3. Frontend connects to backend
4. Registration works
5. Login works
6. WebSocket works in production
7. Game completes
8. Leaderboard works

Do not add unnecessary infrastructure.

Document exact deployment steps in README.

Stop after Phase 10.


## Implement Phase 11 only: Final submission preparation.

Review the entire repository.

Create/update README with:

- project description
- screenshots/placeholders
- features
- architecture
- stack
- local setup
- environment variables
- database setup
- migration commands
- API documentation
- authentication flow
- WebSocket flow
- database schema
- ER diagram
- indexes and rationale
- deployment instructions
- deployed links placeholders
- known limitations
- future improvements

Also ensure:

- .env is ignored
- .env.example exists
- secrets are not committed
- repository is clean
- tests pass
- application starts from documented commands

Do a final code quality review.

Do not introduce new features.

At the end provide a concise submission checklist.

Stop.