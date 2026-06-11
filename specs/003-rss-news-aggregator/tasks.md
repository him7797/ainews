# Tasks: Brief RSS News Aggregator Backend

**Input**: Design documents from `specs/003-rss-news-aggregator/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅

**Stack**: Node.js 20 / TypeScript · Hono v4 · rss-parser v3 · striptags v3 + html-entities v2 · Vitest v2

**Root**: All `server/` paths are relative to the repo root (`/Users/himanshuupadhyay/Documents/ainews/`)

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (independent files, no shared in-progress dependencies)
- **[Story]**: User story this task belongs to (US1–US4 from spec.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the `server/` project so all subsequent tasks have a working build environment.

- [x] T001 Create `server/` directory and initialize `server/package.json` with name `@brief/server`, type `module`, scripts (`dev`, `build`, `start`, `test`, `test:unit`), and runtime dependencies: `hono@^4`, `rss-parser@^3`, `striptags@^3`, `html-entities@^2`; dev dependencies: `vitest@^2`, `typescript@~6`, `@types/node@^20`, `tsx`
- [x] T002 [P] Create `server/tsconfig.json` — target `ES2022`, module `NodeNext`, `moduleResolution` `NodeNext`, `strict: true`, `outDir: dist`, `rootDir: src`; create `server/tsconfig.build.json` extending it with `exclude: ["tests"]`
- [x] T003 [P] Create `server/vitest.config.ts` — pool `forks`, include `tests/**/*.test.ts`, alias `@/` to `src/`, environment `node`
- [x] T004 [P] Create `server/.env.example` documenting all env vars: `PORT=3000`, `CACHE_TTL_SECONDS=300`, `FETCH_TIMEOUT_MS=5000`, `FEED_URLS=<comma-separated RSS URLs>`

**Checkpoint**: `cd server && npm install && npm run build` succeeds (empty build).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure-function modules that US1–US4 all depend on. No user story work begins until this phase is complete.

**⚠️ CRITICAL**: Complete in order T005 → T006/T007 in parallel → T008 → T009 → T010 → T011 → T012

- [x] T005 Implement `server/src/config.ts` — export `Config` type and `loadConfig(): Config` reading `PORT`, `CACHE_TTL_SECONDS`, `FETCH_TIMEOUT_MS`, `FEED_URLS` from `process.env` with documented defaults (`3000`, `300`, `5000`, empty); export `FeedSource` type `{ url: string; name?: string; enabled: boolean }`; export `DEFAULT_FEEDS: FeedSource[]` as empty array stub (populated in T011)
- [x] T006 [P] Implement `server/src/sanitizer.ts` — export `sanitize(raw: string): string` that strips all HTML tags with `striptags` then decodes HTML entities with `html-entities`; returns plain text (may be empty string); handles `null`/`undefined` input gracefully
- [x] T007 [P] Implement `server/src/lib/url.ts` — export `normalizeUrl(url: string): string` that lowercases and strips trailing slash; this single function is the canonical dedup key used by both `parser.ts` (for `id` generation) and `aggregator.ts` (for dedup map key); **never reimplement inline**
- [x] T008 Implement `server/src/fetcher.ts` — export `fetchFeed(source: FeedSource, timeoutMs: number): Promise<string>` that fetches the feed URL using `AbortController` + `setTimeout` for the configured timeout; on any failure (network error, timeout, non-2xx status) throws `FetchError extends Error` with fields `sourceId: string`, `reason: 'timeout' | 'http' | 'network'`, `detail: string`
- [x] T009 Implement `server/src/parser.ts` — export `Article` type matching data-model.md fields (`id`, `title`, `url`, `publishedAt`, `summary`, `source: { id, name }`); export `parseFeed(rawXml: string, source: FeedSource): Article[]` using `rss-parser`; map each item: `id` = first 16 hex chars of SHA-256 of `normalizeUrl(url)` (import from `lib/url.ts`); `url` = `item.link` (skip item if absent); `publishedAt` = `item.isoDate ?? toIso(item.pubDate) ?? null`, where `toIso(s)`
      (small helper in parser.ts or lib/) parses with `new Date(s)` and returns the
      ISO 8601 string, or null if `s` is absent or the date is invalid (NaN check); `summary` = `sanitize(item.contentSnippet ?? item.content ?? item.summary ?? '')`; `source.id` = slug from `source.url`; `source.name` = `source.name ?? feed.title ?? source.url`
- [x] T010 Implement `server/src/aggregator.ts` — export `SourceResult` type `{ source: FeedSource; articles?: Article[]; error?: FetchError }`; export `AggregatedResult` type `{ articles: Article[]; failedSources: string[] }`; export `aggregate(results: SourceResult[]): AggregatedResult`: collect articles from successful results, deduplicate using `normalizeUrl` key from `lib/url.ts` (first-seen wins), sort dated articles newest-first by `publishedAt`, append undated articles in stable input order, return `{ articles, failedSources: results.filter(r => r.error).map(r => r.source.id) }`
- [x] T011 Populate `DEFAULT_FEEDS` in `server/src/config.ts` — fetch each candidate feed URL manually (curl or browser), confirm it returns parseable RSS/Atom, then add confirmed-working sources only; include at minimum: OpenAI blog RSS, Anthropic blog RSS, Google AI blog RSS, HuggingFace blog RSS; document each URL and its confirmed format in a comment
- [x] T012 [P] Create `server/tests/unit/sanitizer.test.ts` using Vitest — test cases: strips `<p>`, `<a href>`, `<img>`, nested tags; decodes `&amp;`, `&#8217;`, `&lt;`; handles empty string; handles plain text passthrough; handles string with only tags (returns empty)

**Checkpoint**: `npm run test:unit` passes (sanitizer tests). `npm run build` compiles all foundational modules.

---

## Phase 3: User Story 1 — Mobile App Fetches Live News Feed (Priority: P1) 🎯 MVP

**Goal**: Server starts, fetches feeds, returns paginated article JSON at `GET /articles`. Mobile app calls live endpoint instead of mock data.

**Independent Test**: `curl http://localhost:3000/articles` returns a JSON object with non-empty `articles` array, each item having `id`, `title`, `url`, `publishedAt`, `summary`, `source`; articles sorted newest-first; no duplicate URLs; `pagination` metadata present.

- [x] T013 [US1] Implement `server/src/cache.ts` — module-level mutable state: `{ entry: CacheEntry | null, refreshing: Promise<void> | null, lastAttemptAt: Date | null, lastRefreshOk: boolean }`; export `CacheEntry` type `{ articles: Article[], cachedAt: Date, failedSources: string[] }`; export `getCache(): CacheEntry | null`; export `getRefreshStatus(): { lastAttemptAt: Date | null, lastRefreshOk: boolean }`; export `awaitWarmCache(maxWaitMs?: number): Promise<CacheEntry | null>` — if `entry` is null and `refreshing` is non-null, await it up to `maxWaitMs` (default 8000ms); export `startRefreshLoop(config: Config): void` — immediately fires one non-blocking refresh, then schedules the next via recursive `setTimeout` (not `setInterval`) after the current completes, preventing overlap; each refresh: fetches all enabled sources in parallel via `Promise.allSettled`, calls `aggregate()`, atomically replaces `entry`; on total failure keeps old entry and sets `lastRefreshOk = false`; emits one JSON-lines log per cycle to stdout: `{ event: 'cache_refresh', timestamp, durationMs, sources: [{ id, status, articleCount?, durationMs, error? }], totalArticles, degraded }`
- [x] T014 [US1] Implement `server/src/router.ts` — create Hono app; `GET /articles`: parse `page` (default 1) and `pageSize` (default 20, clamp 1–100) from query params; return 400 `{ error: 'invalid_params', message }` if non-integer; read cache via `getCache()`; if null, `await awaitWarmCache(8000)` to wait for the
      in-flight startup refresh; only if the cache is STILL null after the wait, return
      the empty pre-warm shape per contracts/api.md; compute pagination slice; return `{ articles, pagination: { page, pageSize, total, hasNextPage }, meta: { degraded, failedSources, cachedAt, lastAttemptAt, staleData } }` per `contracts/api.md`; `GET /health`: return `{ status: 'ok', uptime: Math.floor(process.uptime()), cachedAt }`
- [x] T015 [US1] Implement `server/src/index.ts` — import `loadConfig`, `startRefreshLoop`, Hono router; call `startRefreshLoop(config)` (fire-and-forget, do not await); start Hono HTTP server on `config.port` with `@hono/node-server`; log startup line to stdout: `{ event: 'server_start', port, feedCount, cacheTtlSeconds }`
- [x] T016 [P] [US1] Create `src/services/feedService.ts` in the Expo mobile app — export `fetchArticles(page?: number, pageSize?: number): Promise<ArticlePage>` calling the backend `GET /articles`; define and export `Article` and `ArticlePage` types matching the API contract; use `EXPO_PUBLIC_API_BASE_URL` env var for the base URL (default `http://localhost:3000` for development) ; document in a code comment: localhost default works only on iOS simulator —
      Android emulator must use http://10.0.2.2:3000, physical devices must use the
      dev machine's LAN IP, both set via EXPO_PUBLIC_API_BASE_URL
- [x] T017 [P] [US1] Create `server/tests/unit/aggregator.test.ts` — test cases: deduplicates articles with same normalized URL; sorts dated articles newest-first; appends undated articles after dated; first-seen-wins when two sources have same URL; returns empty articles with failedSources when all sources fail
- [x] T018 [US1] Create `server/tests/integration/api.test.ts` — spin up Hono server in-process with a mock feed HTTP server (using `vitest`'s `beforeAll`/`afterAll`); test: `GET /articles` returns correct shape with sorted, deduplicated articles; `GET /articles?page=2&pageSize=2` returns correct slice and `hasNextPage`; `GET /articles?pageSize=0` returns 400; HTML in feed description is stripped to plain text in `summary`

**Checkpoint**: `npm run dev` starts server; `curl http://localhost:3000/articles` returns live AI news sorted newest-first. Mobile app's `feedService.ts` compiles without errors.

---

## Phase 4: User Story 2 — Graceful Degradation When a Source Fails (Priority: P2)

**Goal**: A failing feed source never breaks the response; `meta.degraded` and `meta.failedSources` accurately reflect partial failure.

**Independent Test**: Add one invalid URL to `FEED_URLS`; `GET /articles` returns 200 with articles from all other sources, `meta.degraded: true`, and the invalid URL's source ID in `meta.failedSources`.

- [x] T019 [US2] Extend `server/src/router.ts` GET /articles — ensure `meta.degraded` is `true` when `failedSources.length > 0` OR `getRefreshStatus().lastRefreshOk === false`; populate `meta.staleData = !lastRefreshOk`; populate `meta.lastAttemptAt` from `getRefreshStatus()` (builds on T014, no file changes needed if already wired — verify and fill any gaps)
- [x] T020 [US2] Manual degradation smoke test — add an unreachable URL (e.g., `http://localhost:19999/bad.xml`) to `FEED_URLS` env var, start server, confirm: response is 200, healthy source articles present, `meta.degraded: true`, bad source ID in `meta.failedSources`, within 5 seconds of the TTL cycle; document result in a comment in `server/tests/integration/api.test.ts`
- [x] T021 [P] [US2] Extend `server/tests/integration/api.test.ts` — add test: mock feed server where one URL hangs past timeout; assert response is 200, returns articles from healthy mock, `meta.degraded: true`, timed-out source ID in `meta.failedSources`; assert response time < 7 seconds

**Checkpoint**: Server with one bad source returns partial results with degraded flag within 7 seconds.

---

## Phase 5: User Story 3 — Cached Results Serve Repeated Requests (Priority: P3)

**Goal**: Upstream feeds are fetched at most once per TTL window; all requests within the TTL window are served from the in-memory cache.

**Independent Test**: Make two sequential `GET /articles` requests within the TTL window; structured logs show only one `cache_refresh` event; second response is returned in < 100ms.

- [x] T022 [US3] Verify and harden `server/src/cache.ts` refresh scheduling — confirm recursive `setTimeout` (not `setInterval`) is used so cycles cannot overlap; confirm stale `CacheEntry` is served during a refresh (never blocks requests); confirm `CACHE_TTL_SECONDS` from config drives the interval; add a log field `scheduleNextMs` to each `cache_refresh` log entry showing when the next cycle is scheduled
- [x] T023 [P] [US3] Create `server/tests/unit/cache.test.ts` using Vitest fake timers — test cases: `startRefreshLoop` calls refresh immediately; second refresh is scheduled only after first completes (no overlap); stale entry is returned while refresh is in-flight; after TTL expires a new refresh runs and updates the entry; `awaitWarmCache` resolves with entry once first refresh completes

**Checkpoint**: `npm run test:unit` includes cache tests passing. Logs confirm one `cache_refresh` per TTL window.

---

## Phase 6: User Story 4 — Deployment Health Probe (Priority: P4)

**Goal**: `GET /health` returns 200 immediately at any point in the service lifecycle, including before the first feed fetch completes.

**Independent Test**: `curl http://localhost:3000/health` immediately after process start (before first cache warm) returns `{ status: "ok", uptime: <number>, cachedAt: null }`.

- [x] T024 [US4] Verify `GET /health` in `server/src/router.ts` — confirm route is already implemented per T014; verify it returns `{ status: 'ok', uptime: Math.floor(process.uptime()), cachedAt: entry?.cachedAt.toISOString() ?? null }`; confirm it returns 200 with `cachedAt: null` when cache is empty (before first refresh); add explicit test case in `server/tests/integration/api.test.ts`: request `/health` before first refresh completes, assert 200 + `cachedAt: null`
- [x] T025 [P] [US4] Extend `server/tests/integration/api.test.ts` — add test: `GET /health` responds in under 200ms under normal conditions (measure with `performance.now()`); `GET /articles` requested before cache warm BLOCKS on the in-flight refresh and
      returns populated articles once mock feeds resolve (assert articles.length > 0,
      response time < 2s with fast mocks); separate test for the fallback path: all
      mock feeds hang past awaitWarmCache's 8s cap (use short cap like 500ms in test
      config), assert empty pre-warm shape `{ articles: [], meta: { cachedAt: null } }`
      with 200 status

**Checkpoint**: Health probe passes at startup before cache is warm. Deployment orchestrator can safely poll `/health`.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation, documentation, and integration wiring that spans all stories.

- [x] T026 Run full test suite (`npm test`) in `server/`; confirm all unit and integration tests pass; fix any failures before proceeding
- [x] T027 [P] Verify all 7 success criteria from `specs/003-rss-news-aggregator/spec.md` are demonstrably met — for each SC: document the verification method (curl command, test assertion, or log inspection) in a comment block at the top of `server/tests/integration/api.test.ts`
- [x] T028 [P] Update `specs/003-rss-news-aggregator/quickstart.md` with any corrections discovered during implementation (actual default feed URLs, any env var changes, build command corrections)

**Checkpoint**: All tests green. Success criteria verified. Quickstart accurate.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately; T002/T003/T004 parallel with each other after T001
- **Phase 2 (Foundational)**: After Phase 1; T006 and T007 parallel after T005; T008 after T007; T009 after T006+T007+T008; T010 after T009; T011 after T005 (parallel with T006–T010); T012 parallel (independent test file)
- **Phase 3 (US1)**: After Phase 2 complete; T013 first, then T014, then T015; T016/T017 parallel with T013–T015; T018 after T013–T015
- **Phase 4 (US2)**: After Phase 3; T019 verifies/extends T014 wiring; T020 manual; T021 extends T018
- **Phase 5 (US3)**: After Phase 3; T022 verifies/extends T013; T023 parallel with T022
- **Phase 6 (US4)**: After Phase 3; T024 verifies T014; T025 extends T018
- **Phase 7 (Polish)**: After all story phases; T027/T028 parallel with T026

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 complete — no dependency on US2/US3/US4
- **US2 (P2)**: Depends on US1 (T014 must exist to extend)
- **US3 (P3)**: Depends on US1 (T013 must exist to verify)
- **US4 (P4)**: Depends on US1 (T014 must exist to verify)
- **US2/US3/US4**: Independent of each other — can proceed in parallel after US1

### Within Each User Story

- T013 (cache) → T014 (router) → T015 (entry point) — strictly sequential
- T016 (mobile client) and T017 (aggregator tests) parallel with T013–T015
- T018 (integration test) after T013–T015

---

## Parallel Opportunities

### Phase 1

```
T001 → T002, T003, T004 (all parallel)
```

### Phase 2

```
T005
├── T006 [P]
├── T007 [P] → T008 → T009 → T010
└── T011 [P]
└── T012 [P]
```

### Phase 3 (US1)

```
T013 → T014 → T015 → T018
T016 [P] (parallel with T013–T015)
T017 [P] (parallel with T013–T015)
```

### Phases 4–6 (US2/US3/US4 — after US1)

```
US2: T019 → T020 → T021 [P]
US3: T022 → T023 [P]          ← parallel with US2
US4: T024 → T025 [P]          ← parallel with US2 and US3
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (all 8 tasks — required before any story)
3. Complete Phase 3: US1 (T013 → T014 → T015 in order; T016/T017 in parallel)
4. **STOP and VALIDATE**: `curl http://localhost:3000/articles` returns live AI news
5. Mobile app's `feedService.ts` compiles and can call the running server

### Incremental Delivery

1. **Phase 1 + 2** → foundation ready
2. **Phase 3 (US1)** → live news feed working → **MVP**
3. **Phase 4 (US2)** → degradation handled → more resilient
4. **Phase 5 (US3)** → caching hardened → upstream-safe
5. **Phase 6 (US4)** → health endpoint → deployment-ready
6. **Phase 7** → all tests green → shippable

---

## Notes

- `[P]` tasks touch different files with no in-progress dependencies — safe to run simultaneously
- `[Story]` label maps each task to the user story it delivers
- T011 (feed URL validation) requires manual network verification — do not skip
- `normalizeUrl()` in `server/src/lib/url.ts` (T007) is used by both `parser.ts` and `aggregator.ts` — never duplicate the logic
- Commit after each phase checkpoint at minimum
- US2/US3/US4 extend modules built in US1 — review those modules before extending to avoid duplication
