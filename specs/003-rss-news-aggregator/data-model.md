# Data Model: Brief RSS News Aggregator Backend

**Feature**: 003-rss-news-aggregator  
**Date**: 2026-06-10

---

## Article

Represents a single news item after aggregation and normalization from an upstream feed.

| Field         | Type                                 | Nullable | Description                                                                                                                                    |
| ------------- | ------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | string (SHA-256 hex, first 16 chars) | No       | Derived from the canonical URL; used as a stable deduplication key                                                                             |
| `title`       | string                               | No       | Article headline from feed item title                                                                                                          |
| `url`         | string                               | No       | Canonical link to the original article; must be non-empty (articles without URLs are excluded)                                                 |
| `publishedAt` | string (ISO 8601)                    | Yes      | Publication timestamp from feed; `null` if feed item has no date                                                                               |
| `summary`     | string                               | No       | Plain text derived from feed's description/content field; HTML stripped, entities decoded; may be empty string if feed provides no description |
| `source`      | SourceRef                            | No       | Reference to the originating feed source                                                                                                       |

**Constraints**:

- `url` is the deduplication key (lowercased, trailing slash stripped)
- Articles with no `url` are discarded before deduplication
- `publishedAt: null` articles sort after all dated articles (stable order within null group)

---

## SourceRef (embedded in Article)

| Field  | Type   | Nullable | Description                                                                                    |
| ------ | ------ | -------- | ---------------------------------------------------------------------------------------------- |
| `id`   | string | No       | Slug derived from the feed URL (lowercased, non-alphanumeric → `-`)                            |
| `name` | string | No       | Human-readable feed name from config; falls back to feed's `<title>` element if not configured |

---

## FeedSource (configuration entity — not returned in API response)

Configured in `server/src/config.ts`, loaded from environment or config file.

| Field     | Type    | Nullable | Description                                                         |
| --------- | ------- | -------- | ------------------------------------------------------------------- |
| `url`     | string  | No       | RSS/Atom feed endpoint URL                                          |
| `name`    | string  | Yes      | Display name override; falls back to feed's own `<title>` if absent |
| `enabled` | boolean | No       | If `false`, source is skipped entirely during aggregation           |

---

## CacheEntry (runtime, in-memory only)

Not exposed via API. Held in a module-level singleton.

| Field           | Type      | Nullable | Description                                                        |
| --------------- | --------- | -------- | ------------------------------------------------------------------ |
| `articles`      | Article[] | No       | Full merged, sorted, deduplicated article list                     |
| `cachedAt`      | Date      | No       | Timestamp when this cache entry was populated                      |
| `failedSources` | string[]  | No       | Source IDs that failed during the refresh that produced this entry |

**Lifecycle**:

1. On startup: cache is empty (`null`); background refresh starts immediately
2. On successful refresh: cache is replaced atomically
3. On TTL expiry: background refresh runs; stale entry is served until the new
   one is ready
4. On TOTAL refresh failure (all sources failed/threw): previous entry is KEPT
   and continues to be served; lastRefreshOk=false is recorded outside the entry
5. Concurrent reads never block on refresh

---

## API Response Shapes

### GET /articles response

```
{
  articles: Article[],
  pagination: {
    page: number,         // 1-based
    pageSize: number,     // effective page size (clamped to max 100)
    total: number,        // total articles in current cache
    hasNextPage: boolean
  },
"meta": {
  "degraded": boolean,        // true if failedSources non-empty OR lastRefreshOk=false
  "failedSources": string[],
  "cachedAt": string | null,  // when current entry was built
  "lastAttemptAt": string | null,  // when the most recent refresh attempt started
  "staleData": boolean        // true when lastRefreshOk=false (serving old entry)
}
}
```

### GET /health response

```
{
  status: "ok",
  uptime: number,         // seconds since process start
  cachedAt: string | null // ISO 8601 of last cache refresh, null if cache not yet warm
}
```

---

## State Transitions

```
Service Start
    │
    ├─► port bound, requests accepted (cache = null)
    │
    └─► background refresh starts
            │
            ├─► refresh succeeds → cache = CacheEntry { articles, cachedAt, failedSources }
            │       │
            │       └─► setInterval(TTL) → repeat refresh
            │
            └─► refresh fails entirely → cache remains null; degraded=true returned
```
