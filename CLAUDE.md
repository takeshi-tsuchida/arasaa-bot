# CLAUDE.md

This file provides guidance for AI assistants working in this repository.

## Project Overview

**arasaa-bot** is a LINE Messaging Bot for drinking party attendance tracking, targeted at Japanese "arasaa-kai" (groups of people in their 30s-40s). Built with Node.js, Express, PostgreSQL (Supabase), and the LINE Messaging API.

### What the bot does
- Allows users in LINE group chats to create drinking events with title, date, location, and RSVP deadline
- Members respond with attendance status (yes/maybe/no) via interactive Flex Message buttons
- Shows real-time attendance tallies with participant names
- Sends daily 9:00 AM JST reminder messages before deadlines

## Codebase Structure

```
src/
├── index.js              # Express server, webhook endpoint, LINE SDK setup
├── db.js                 # PostgreSQL connection pool and all DB functions
├── cron.js               # Daily reminder scheduler (node-cron)
├── handlers/
│   ├── message.js        # Text message handling (event creation, commands)
│   └── postback.js       # Button click postback handling
└── flex/
    └── attendanceCard.js # LINE Flex Message card builder
```

## Development Workflow

### Setup

1. Install dependencies: `npm install`
2. Copy environment variables (see [Environment Variables](#environment-variables))
3. Run in dev mode: `npm run dev`

### Scripts

- `npm start` — Production mode (`node src/index.js`)
- `npm run dev` — Development mode with auto-reload via nodemon

### No Tests

This project has no test suite. When modifying logic, test manually via LINE's webhook simulator or a real LINE bot connection.

## Architecture

### Request Flow

```
LINE Platform
    → POST /webhook (index.js)
        → message event → handlers/message.js
        → postback event → handlers/postback.js
            → db.js (read/write PostgreSQL)
            → flex/attendanceCard.js (build response card)
        → LINE reply via @line/bot-sdk client
```

### Database Schema

**`events` table**
| Column | Type | Notes |
|---|---|---|
| id | TEXT PRIMARY KEY | crypto.randomBytes(8).toString('hex') |
| group_id | TEXT | LINE group/room/user source ID |
| title | TEXT | Event name |
| date | TEXT | Event date/time string |
| location | TEXT | Venue |
| deadline | TEXT | RSVP deadline string |
| created_by | TEXT | LINE userId of creator |
| created_at | TIMESTAMP | Auto-set |

**`responses` table**
| Column | Type | Notes |
|---|---|---|
| event_id | TEXT | FK → events.id |
| user_id | TEXT | LINE userId |
| display_name | TEXT | LINE display name at time of response |
| status | TEXT | CHECK: 'yes' / 'no' / 'maybe' |

Composite PK: `(event_id, user_id)` — one response per user per event.

### Key Database Functions (src/db.js)

- `createEvent(groupId, title, date, location, deadline, createdBy)` — Insert new event
- `getEvent(eventId)` — Fetch event by ID
- `getActiveEventByGroup(groupId)` — Get the latest event for a group
- `upsertResponse(eventId, userId, displayName, status)` — Insert or update RSVP
- `getResponses(eventId)` — Get all responses for an event
- `getEventsNeedingReminder()` — Events where deadline is tomorrow

## Key Conventions

### Language

- Comments and user-facing messages are in **Japanese**
- Variable/function names are in **English camelCase**

### Message Commands (Japanese)

Text messages are parsed with regex in `src/handlers/message.js`:

| Input | Action |
|---|---|
| `飲み会 <title> <date> <location> <deadline>` | Create new event |
| `集計` | Show attendance tally |
| `ヘルプ` or `help` | Show usage instructions |

### Postback Data Format

Button clicks send postback data as URL query strings:
```
action=respond&event_id=<id>&status=yes
action=respond&event_id=<id>&status=no
action=respond&event_id=<id>&status=maybe
```

### Source ID Resolution

Group context is resolved in priority order (message.js):
1. `event.source.groupId` — LINE group chat
2. `event.source.roomId` — LINE room chat
3. `event.source.userId` — Direct message fallback

### Flex Message Card Colors

- Header background: `#FF6B35` (orange)
- Yes button: `#27AE60` (green)
- Maybe button: `#F39C12` (orange)
- No button: `#E74C3C` (red)

### Database Queries

Always use parameterized queries (`$1`, `$2`, ...) — never string interpolation in SQL.

### SSL (Supabase / Railway)

The PostgreSQL pool in `db.js` uses `ssl: { rejectUnauthorized: false }` for Supabase compatibility. Also resolves IPv4 explicitly for Railway deployment:
```js
{ family: 4 }
```

## Environment Variables

Required in `.env` (never committed — in `.gitignore`):

| Variable | Description |
|---|---|
| `LINE_CHANNEL_SECRET` | LINE bot channel secret |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE bot access token |
| `DATABASE_URL` | PostgreSQL connection string (Supabase format) |
| `PORT` | HTTP port (optional, defaults to `3000`) |

## Deployment

Deployed on **Railway** connected to **Supabase PostgreSQL**. The webhook URL must be registered in LINE Developers Console pointing to the Railway app URL at `/webhook`.

## Dependencies

| Package | Purpose |
|---|---|
| `@line/bot-sdk` ^9.3.0 | LINE Messaging API |
| `express` ^4.18.3 | HTTP server |
| `pg` ^8.11.3 | PostgreSQL client |
| `node-cron` ^3.0.3 | Cron scheduling |
| `dotenv` ^16.4.5 | Environment variable loading |
| `nodemon` ^3.1.0 | Dev auto-reload |
