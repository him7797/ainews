# Research: Brief RSS News Aggregator Backend

**Feature**: 003-rss-news-aggregator  
**Date**: 2026-06-10

## Decision 1 — HTTP Framework

**Decision**: Hono v4

**Rationale**: Lightweight (~18KB), first-class TypeScript support with strong type inference, minimal cold-start time (<50ms). Two endpoints with no special middleware requirements make it a perfect fit. Express is over-engineered for this scope; Fastify adds schema-validation overhead that isn't needed here.

**Alternatives considered**:
- Express: mature but heavyweight; poor native TypeScript ergonomics
- Fastify: excellent but adds JSON schema validation complexity unnecessary for two endpoints

---

## Decision 2 — RSS/Atom Parsing

**Decision**: `rss-parser` v3

**Rationale**: Battle-tested, actively maintained, natively handles both RSS 2.0 and Atom 1.0/0.3. Lenient parser — malformed feeds produce partial results rather than thrown errors, which aligns with the partial-failure requirement. Description fields (including HTML) are surfaced as `item.content` / `item.contentSnippet`.

**Alternatives considered**:
- `fast-xml-parser`: general XML parser; no feed-specific normalization (date parsing, GUID extraction, Atom vs RSS field mapping must be hand-rolled)
- `feedparser`: older, stream-based API; less TypeScript support; slower maintenance cadence

---

## Decision 3 — HTML Sanitization & Entity Decoding

**Decision**: `striptags` + `html-entities`

**Rationale**: `striptags` (~3KB) strips all HTML tags reliably, including edge cases (self-closing tags, malformed markup). `html-entities` (~3KB) decodes named and numeric HTML entities (`&amp;` → `&`, `&#8217;` → `'`). Combined weight ~6KB vs `sanitize-html` at 60KB+. Plain-text output is the only requirement — no safe-HTML preservation needed.

**Alternatives considered**:
- `sanitize-html`: correct choice if safe HTML output were needed; too heavy for plain-text use
- Regex (`/<[^>]*>/g`): fragile against malformed tags, nested attributes, or CDATA sections

---

## Decision 4 — Testing Framework

**Decision**: Vitest v2

**Rationale**: 2–3× faster than Jest on TypeScript projects; zero-config ESM support; `vi.useFakeTimers()` works cleanly for TTL/cache tests. Shares the same `expect` API as Jest — no learning curve for developers familiar with Jest.

**Alternatives considered**:
- Jest: requires extra babel/ts-jest config for ESM; slower; overkill for a pure Node service

---

## Decision 5 — Project Structure

**Decision**: `server/` directory at repo root (no monorepo restructure)

**Rationale**: Adding a `server/` directory at the root is the lowest-friction approach — no changes to the existing Expo app, no workspace migration, no CI changes required. The backend is independently runnable with its own `package.json` and `tsconfig.json`. A full monorepo (`apps/mobile`, `apps/backend`) is a valid future step but is out of scope for this feature.

**Alternatives considered**:
- npm workspaces monorepo: cleaner long-term but requires moving the Expo app root and updating all Expo/EAS tooling — scope beyond this feature
- `api/` naming: conventional for REST services but `server/` is more descriptive for an aggregator daemon

**Resolved structure**:
```
server/
├── src/
│   ├── config.ts          # feed list, TTL, port from env
│   ├── fetcher.ts         # per-source fetch with timeout
│   ├── parser.ts          # RSS/Atom → Article normalization
│   ├── sanitizer.ts       # HTML strip + entity decode
│   ├── aggregator.ts      # merge, sort, deduplicate
│   ├── cache.ts           # in-memory TTL cache + background refresh
│   ├── router.ts          # Hono route definitions
│   └── index.ts           # entry point (bind port, start background fetch)
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
└── tsconfig.json
```

---

## Decision 6 — Deduplication Key

**Decision**: Raw canonical URL from feed item, lowercased and with trailing slash stripped

**Rationale**: The spec clarified no URL normalization in this phase. Using the raw link field normalized only by lowercasing and removing a trailing slash provides lightweight deduplication without query-parameter or redirect resolution complexity. Articles with the same URL after this normalization are considered duplicates; the first-seen instance (from the highest-priority source, or earliest in the source list) is retained.

---

## Decision 7 — Cache Refresh Scheduling

**Decision**: `setInterval` for periodic background refresh; no external scheduler

**Rationale**: Single-instance deployment with in-memory state. `setInterval` fired at TTL expiry is sufficient and has zero dependencies. First fire is immediate on startup (background, non-blocking). Subsequent fires run at TTL intervals.
