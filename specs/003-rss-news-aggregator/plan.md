# Implementation Plan: Brief RSS News Aggregator Backend

**Branch**: `003-rss-news-aggregator` | **Date**: 2026-06-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-rss-news-aggregator/spec.md`

## Summary

Stand up a Node.js/TypeScript backend service (`server/`) that aggregates AI news from a configurable list of RSS/Atom feeds, caches the full merged dataset in memory, and serves paginated plain-text article summaries via two HTTP endpoints — replacing the mobile app's mock feed data. The service uses Hono for routing, `rss-parser` for feed parsing, and `striptags` + `html-entities` for sanitization. A single `setInterval` scheduler drives background cache refreshes without blocking request serving.

## Technical Context

**Language/Version**: TypeScript / Node.js 20 LTS

**Primary Dependencies**:

- `hono` v4 — HTTP routing (lightweight, TypeScript-native)
- `rss-parser` v3 — RSS 2.0 + Atom 1.0 feed parsing
- `striptags` v3 + `html-entities` v2 — HTML stripping and entity decoding
- `vitest` v2 — test runner

**Storage**: In-memory only (`CacheEntry` singleton in `cache.ts`; no external store)

**Testing**: Vitest v2 (unit + integration)

**Target Platform**: Node.js 20 LTS on Linux (Docker/container); also runnable locally on macOS

**Project Type**: REST web service (2 endpoints)

**Performance Goals**:

- Cached response: < 2 seconds p95
- Cold/degraded response (one failing source): < 7 seconds (5s timeout + overhead)

**Constraints**:

- No auth on any endpoint
- In-memory cache only; no Redis or external store
- Single instance; no distributed coordination
- Per-source fetch timeout: 5 seconds
- Page size default: 20; max: 100

**Scale/Scope**: 10+ simultaneous RSS/Atom sources; single instance

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **Primary Sourcing:** Every article links to its original source URL; the `url` field in the Article entity is required and non-null. Articles without URLs are excluded.
- [x] **AI Transparency:** No AI summarization is used at any stage; summaries come directly from feed description fields. No labeling required.
- [x] **Simplicity:** Two endpoints, one in-memory data structure, one scheduler — no databases, queues, or auth layers.
- [x] **Privacy by Default:** No user data collected; no analytics; no cookies; no request logging beyond structured refresh-cycle logs.
- [x] **User Value:** Serves professional awareness by surfacing real AI news without engagement manipulation; no recommendation ranking or algorithmic amplification.

All gates pass. No complexity justification required.

## Project Structure

### Documentation (this feature)

```text
specs/003-rss-news-aggregator/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
server/                        # New: Brief backend service
├── src/
│   ├── config.ts              # Feed list, TTL, port, timeout — from env + defaults
│   ├── fetcher.ts             # Fetch single feed URL with AbortController timeout
│   ├── parser.ts              # rss-parser wrapper → normalized Article[]
│   ├── sanitizer.ts           # striptags + html-entities → plain text
│   ├── aggregator.ts          # merge all source results, sort, deduplicate
│   ├── cache.ts               # In-memory CacheEntry singleton + background refresh loop
│   ├── router.ts              # Hono routes: GET /articles, GET /health
│   └── index.ts               # Entry point: bind port, kick off initial background fetch
├── tests/
│   ├── unit/
│   │   ├── sanitizer.test.ts
│   │   ├── aggregator.test.ts
│   │   └── cache.test.ts
│   └── integration/
│       └── api.test.ts        # Full request cycle against mock feed server
├── package.json
├── tsconfig.json
└── .env.example

src/                           # Existing: Expo mobile app (unchanged)
tests/                         # Existing: mobile app tests (unchanged)
```

**Structure Decision**: `server/` directory at repo root — co-located with the Expo app without disturbing it. The backend has its own `package.json` and `tsconfig.json` and is runnable independently. A full monorepo restructure (`apps/mobile`, `apps/backend`) is deferred.

## Implementation Modules

### `config.ts`

Reads `FEED_URLS`, `CACHE_TTL_SECONDS`, `FETCH_TIMEOUT_MS`, `PORT` from environment. Exports typed config object. Default feed list: OpenAI blog, Anthropic blog, Google AI blog, HuggingFace blog, Mistral news (to be confirmed at implementation time).
Default feed list: TO BE POPULATED by task T00X "Validate feed sources" — each
candidate URL must be fetched and confirmed to return parseable RSS/Atom before
entering the default config. No URL ships unverified.

### `fetcher.ts`

Single async function `fetchFeed(source: FeedSource): Promise<RawFeed>`. Uses `AbortController` + `setTimeout` for the 5-second timeout. On error (network, timeout, non-200 HTTP): throws a typed `FetchError` containing the source ID and error message — never swallows silently.

### `parser.ts`

Wraps `rss-parser`. Maps each feed item to the internal `Article` shape:

- `id` = first 16 hex chars of SHA-256(normalizedUrl), where normalizedUrl =
  url.toLowerCase() with trailing slash stripped — the SAME normalization used
  as the deduplication key in aggregator.ts. Ids are therefore stable across
  refreshes regardless of which source variant of the URL is seen first.
- `title` = item.title ?? ''
- `url` = item.link — skip item if absent
- `publishedAt` = item.isoDate ?? item.pubDate → ISO 8601 string, or `null`
- `summary` = sanitize(item.contentSnippet ?? item.content ?? item.summary ?? '')
- `source` = SourceRef derived from config

### `sanitizer.ts`

`sanitize(raw: string): string` — runs `striptags(raw)` then decodes HTML entities with `html-entities`. Returns plain text string (may be empty).

### `aggregator.ts`

`aggregate(results: SourceResult[]): AggregatedResult`

1. Collect all articles from successful sources
2. Deduplication key: normalizeUrl(url) — single shared function (lib or parser
   export) used by BOTH id generation and dedup. Never reimplement inline.
3. Deduplicate: first-seen wins (source list order is priority order)
4. Sort: dated articles newest-first by `publishedAt`; undated articles appended in stable input order
5. Return `{ articles, failedSources }` where `failedSources` lists IDs of sources that threw

### `cache.ts`

Module-level singleton:

state: {
entry: CacheEntry | null,
refreshing: Promise<void> | null, // in-flight refresh, awaitable
lastAttemptAt: Date | null, // when the last refresh attempt started
lastRefreshOk: boolean // false if the most recent attempt failed entirely
}

- `getCache(): CacheEntry | null` — synchronous read
- `getRefreshStatus()` — returns { lastAttemptAt, lastRefreshOk } for meta/health
- `awaitWarmCache(maxWaitMs): Promise<CacheEntry | null>` — if entry is null and a
  refresh is in flight, await it up to maxWaitMs (default 8000ms); else return entry
- `startRefreshLoop(config)` — fires immediately (non-blocking). Scheduling uses
  recursive setTimeout: the next refresh is scheduled only AFTER the current one
  completes, so cycles can never overlap. The entire cycle body is wrapped in
  try/catch — a thrown refresh logs the error and schedules the next cycle; it
  never kills the loop or the process.
- On each refresh: fetch all sources in parallel (Promise.allSettled), aggregate,
  replace `entry` atomically ONLY if at least one source succeeded. On total
  failure: keep the previous entry, set lastRefreshOk=false.
- Emits one structured JSON log line per cycle (to stdout)

### `router.ts`

Hono instance with two routes:

- `GET /articles?page&pageSize` — reads cache, paginates, returns JSON
- `GET /health` — returns `{ status: 'ok', uptime, cachedAt }`

Validates `page` and `pageSize` as positive integers; clamps `pageSize` to 100; returns 400 with `{ error, message }` on invalid params.

### `index.ts`

1. Load config
2. Create Hono app from router
3. Call `startRefreshLoop(config)` — non-blocking
4. Bind HTTP server on `config.port`
   Cold-cache behavior: if getCache() returns null, the /articles handler calls
   awaitWarmCache(8000) before responding. Only if the cache is still null after
   that wait does it return the empty pre-warm response shape. This makes the
   empty-feed window effectively unreachable in normal deploys.

## Complexity Tracking

No Constitution Check violations. No complexity justification required.
