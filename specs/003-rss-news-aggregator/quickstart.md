# Quickstart: Brief Backend Server

## Prerequisites

- Node.js 20+ (LTS)
- npm 10+

## Setup

```bash
cd server
npm install
```

## Configuration

The server reads its configuration from environment variables. Create a `.env` file in `server/`:

```env
# Port to listen on (default: 3000)
PORT=3000

# Cache TTL in seconds (default: 300 — 5 minutes)
CACHE_TTL_SECONDS=300

# Per-source fetch timeout in milliseconds (default: 5000)
FETCH_TIMEOUT_MS=5000

# Comma-separated list of RSS/Atom feed URLs
# These are the default AI news sources
FEED_URLS=https://openai.com/blog/rss.xml,https://www.anthropic.com/rss.xml,https://blog.google/technology/ai/rss/
```

Alternatively, configure feeds in `server/src/config.ts` directly for local development (see inline comments).

## Run (development)

```bash
npm run dev
```

The server starts immediately and begins a background feed fetch. Logs are emitted to stdout in JSON-lines format.

## Run (production build)

```bash
npm run build
npm start
```

## Verify

```bash
# Health check
curl http://localhost:3000/health

# Articles (first page, default 20 per page)
curl http://localhost:3000/articles

# Page 2 with 10 articles per page
curl "http://localhost:3000/articles?page=2&pageSize=10"
```

## Run tests

```bash
npm test          # unit + integration tests
npm run test:unit # unit tests only
```

## Project layout

```
server/
├── src/
│   ├── config.ts       # feed list, TTL, port, timeout from env/defaults
│   ├── fetcher.ts      # fetch a single feed URL with timeout; returns raw feed or throws
│   ├── parser.ts       # rss-parser wrapper; normalizes RSS/Atom → Article shape
│   ├── sanitizer.ts    # striptags + html-entities → plain text
│   ├── aggregator.ts   # merge, sort newest-first, deduplicate by URL
│   ├── cache.ts        # in-memory cache singleton + background refresh scheduler
│   ├── router.ts       # Hono routes: GET /articles, GET /health
│   └── index.ts        # entry point: bind port, kick off first background refresh
└── tests/
    ├── unit/
    │   ├── sanitizer.test.ts
    │   ├── aggregator.test.ts
    │   └── cache.test.ts
    └── integration/
        └── api.test.ts   # spins up the server against mock feeds
```
