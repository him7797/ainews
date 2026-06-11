# API Contract: Brief RSS News Aggregator

**Version**: 1.0  
**Base URL**: `http://localhost:3000` (development) / `https://api.brief.app` (production placeholder)

---

## GET /articles

Returns the aggregated, deduplicated, paginated list of AI news articles from all configured sources.

### Query Parameters

| Parameter  | Type    | Default | Constraints | Description                                                  |
| ---------- | ------- | ------- | ----------- | ------------------------------------------------------------ |
| `page`     | integer | `1`     | ≥ 1         | 1-based page number                                          |
| `pageSize` | integer | `20`    | 1–100       | Number of articles per page; values > 100 are clamped to 100 |

### Success Response — 200 OK

```json
{
  "articles": [
    {
      "id": "a3f2b1c4d5e6f789",
      "title": "Anthropic releases Claude 4",
      "url": "https://anthropic.com/news/claude-4",
      "publishedAt": "2026-06-10T09:00:00Z",
      "summary": "Anthropic today announced Claude 4, its most capable model to date...",
      "source": {
        "id": "anthropic-blog",
        "name": "Anthropic Blog"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 143,
    "hasNextPage": true
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

### Degraded Response — 200 OK (partial failure)

When one or more sources fail, the endpoint still returns 200 with available articles and a degraded flag:

```json
{
  "articles": [ "..." ],
  "pagination": { "..." },
  "meta": {
    "degraded": true,
    "failedSources": ["huggingface-blog", "mistral-news"],
    "cachedAt": "2026-06-10T09:05:00Z"
  }
}
```

### Pre-Warm Response — 200 OK (cache not yet populated)

Returned on requests that arrive before the startup background fetch completes:

```json
{
  "articles": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "hasNextPage": false
  },
  "meta": {
    "degraded": false,
    "failedSources": [],
    "cachedAt": null
  }
}
```

### Error Responses

| Status            | Condition                                   |
| ----------------- | ------------------------------------------- |
| `400 Bad Request` | `page` or `pageSize` is not a valid integer |

```json
{ "error": "invalid_params", "message": "pageSize must be a positive integer" }
```

---

## GET /health

Liveness and readiness probe for deployment orchestrators.

### Success Response — 200 OK

```json
{
  "status": "ok",
  "uptime": 3720,
  "cachedAt": "2026-06-10T09:05:00Z"
}
```

- `uptime`: seconds since process start
- `cachedAt`: ISO 8601 timestamp of last successful cache refresh; `null` if the cache has not yet been populated since startup

### Notes

- This endpoint returns `200` regardless of cache state (even before the first feed fetch completes)
- It does **not** return `503` in degraded mode — degraded state is surfaced on `/articles` only

---

## Structured Log Format

Each cache refresh cycle emits one structured log entry. Format (JSON lines):

```json
{
  "event": "cache_refresh",
  "timestamp": "2026-06-10T09:05:00Z",
  "durationMs": 2340,
  "sources": [
    {
      "id": "anthropic-blog",
      "status": "ok",
      "articleCount": 12,
      "durationMs": 450
    },
    {
      "id": "huggingface-blog",
      "status": "error",
      "error": "timeout",
      "durationMs": 5001
    }
  ],
  "totalArticles": 87,
  "degraded": false
}
```
