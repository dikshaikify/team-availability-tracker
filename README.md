# Team Availability Tracker

Full-stack app: **React (Vite)** frontend + **Node/Express** REST API + **SQLite** database.
Toggle a teammate's status (Available / Busy / Away); it is saved to the database and pushed live to every open browser via Server-Sent Events (30s polling as a fallback).

```
backend/    Express API, SQLite schema + seed, SSE stream
frontend/   React app (components, API client, styles)
```

## Run locally (two terminals)
    npm run install:all
    npm run dev:backend     # API on http://localhost:3000
    npm run dev:frontend    # UI  on http://localhost:5173 (proxies /api to the backend)

## Database
`backend/schema.sql`: `members(id, name, role, timezone, status CHECK IN ('Available','Busy','Away'), updated_at)`. Seeded on first run.

## REST API
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/members` | List members |
| PATCH | `/api/members/:id/status` | Body `{"status":"Busy"}`; 400 invalid, 404 unknown |
| POST | `/api/members` | Body `{"name","role","timezone"}`; validates input, returns 201 |
| DELETE | `/api/members/:id` | Remove a member (204) |
| GET | `/api/activity` | Latest status changes (audit log) |
| GET | `/api/events` | SSE stream: `status`, `added`, `removed` events |

Features: search, status filter chips, add/remove members, per-card "updated X ago", and a recent-activity feed backed by an `activity` table.

## Deploy (Render / Railway, one URL)
Build command: `npm run build` · Start command: `npm start`.
The backend serves the built React app. Attach a persistent disk and set `DB_PATH=/data/team.db` so statuses survive restarts.
