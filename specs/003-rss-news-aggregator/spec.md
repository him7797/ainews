# Feature Specification: Brief RSS News Aggregator Backend

**Feature Branch**: `003-rss-news-aggregator`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "Stand up the Brief backend service and expose one endpoint that returns aggregated AI news from RSS feeds, replacing the mobile app's mock feed data. The service aggregates articles from a configurable list of RSS/Atom sources, merges and sorts them newest-first, deduplicates by canonical URL, and serves them as JSON with pagination. Article summaries are taken directly from each feed's own description field, sanitized to plain text — no AI/LLM summarization, in this phase or later. A failing source must never fail the whole response — partial results with a degraded indicator. Results are cached with a TTL so upstream feeds aren't hit on every request. Includes a health endpoint for deployment probes. Out of scope: auth, personalization, persistence beyond in-memory cache, push notifications."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mobile App Fetches Live News Feed (Priority: P1)

A mobile app developer replaces the hardcoded mock articles in the Brief app with a live call to the aggregator endpoint. The app receives a paginated JSON list of real AI news articles, sorted newest-first, with titles, URLs, publication dates, and plain-text summaries drawn from each feed's own description field.

**Why this priority**: This is the core deliverable — without it the feature has no value. Everything else supports this outcome.

**Independent Test**: Can be tested by sending a GET request to the articles endpoint and verifying the response contains real, sorted, deduplicated articles in the expected JSON shape.

**Acceptance Scenarios**:

1. **Given** the service is running with at least one configured RSS/Atom source, **When** a client requests the articles endpoint without parameters, **Then** the response is a JSON object containing an array of articles sorted newest-first, each with title, URL, publication date, and plain-text summary.
2. **Given** more articles exist than fit on one page, **When** a client requests a specific page number, **Then** the response contains the correct slice of articles and pagination metadata (current page, total count, whether more pages exist).
3. **Given** an article's description field contains HTML markup, **When** the service builds the response, **Then** the summary field contains only plain text with all HTML tags stripped.
4. **Given** two sources publish articles with the same canonical URL, **When** the service merges results, **Then** only one article appears in the response.

---

### User Story 2 - Service Degrades Gracefully When a Source Fails (Priority: P2)

A feed operator takes one RSS source offline. The Brief service continues returning articles from all other healthy sources and signals to the client that some sources could not be reached, without crashing or blocking the entire response.

**Why this priority**: Resilience is a first-class requirement; a single bad source must never take down the feed for all users.

**Independent Test**: Can be tested by configuring one invalid/unreachable feed URL and verifying that the response still returns articles from other sources and includes a degraded indicator.

**Acceptance Scenarios**:

1. **Given** one configured source is unreachable or returns a malformed feed, **When** the service fetches all sources, **Then** the response still includes articles from all healthy sources.
2. **Given** at least one source fails, **When** the client receives the response, **Then** the response body includes a degraded status indicator and identifies which sources failed.
3. **Given** all sources fail, **When** the client receives the response, **Then** the response returns an empty articles array with a degraded indicator — not a 5xx error.

---

### User Story 3 - Cached Results Serve Repeated Requests Without Hitting Upstream (Priority: P3)

A burst of users opens the app simultaneously. The service returns cached results to all requests within the cache TTL window, and no upstream RSS feed is fetched more than once per TTL period.

**Why this priority**: Caching protects upstream feeds from excessive load and keeps response times consistent for end users.

**Independent Test**: Can be tested by making two rapid sequential requests and observing via logs or timing that the second request does not trigger upstream fetches.

**Acceptance Scenarios**:

1. **Given** a fresh cache after a prior fetch, **When** a second request arrives within the TTL window, **Then** the service returns the cached result without re-fetching any upstream source.
2. **Given** the cache TTL has expired, **When** the next request arrives, **Then** the service re-fetches all configured sources and refreshes the cache.
3. **Given** the cache TTL is configurable, **When** the TTL value is changed in configuration, **Then** the new TTL takes effect without restarting the service (or at next startup — both acceptable).

---

### User Story 4 - Deployment Probe Checks Service Health (Priority: P4)

A deployment orchestrator (e.g., a container platform) sends periodic health-check requests. The service responds immediately with a signal indicating it is alive and ready to serve traffic.

**Why this priority**: Required for safe automated deployments; without it the orchestrator cannot distinguish a starting service from a broken one.

**Independent Test**: Can be tested by requesting the health endpoint and confirming a 200 response with an alive/ready indicator.

**Acceptance Scenarios**:

1. **Given** the service is running normally, **When** the health endpoint is requested, **Then** it responds with a 200 status and a body indicating the service is healthy.
2. **Given** the service is starting up, **When** the health endpoint is requested before the first feed fetch completes, **Then** it still returns a 200 — the health check does not depend on cache being warm.

---

### Edge Cases

- What happens when a feed contains articles with no publication date? (Sort by ingestion order; place undated articles after dated ones.)
- What happens when a feed returns an article with no URL? (Skip the article; it cannot be deduplicated or linked.)
- What happens when the configured source list is empty? (Return an empty articles array with a warning indicator rather than an error.)
- What happens when two articles have URLs that differ only by trailing slash or query parameters? (Treat them as distinct unless canonical URL normalization is applied; no normalization assumed in this phase.)
- What happens when an article's description exceeds a very large length? (No truncation in this phase; full plain-text summary is returned.)
- What happens when the service receives concurrent requests during a cache refresh? (All waiting requests receive the new result once the refresh completes; no thundering-herd handling required in phase one.)
- What happens when a request arrives before the startup pre-fetch has completed? (Return an empty articles array — not an error — since the cache is not yet warm.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The service MUST expose a single articles endpoint that returns aggregated AI news articles as a JSON response.
- **FR-002**: The service MUST accept a configurable list of RSS/Atom feed URLs as its data sources.
- **FR-003**: The articles endpoint MUST merge articles from all configured sources, sort them newest-first by publication date, and deduplicate by canonical URL before returning results.
- **FR-004**: The articles endpoint MUST support pagination — clients MUST be able to request a specific page and page size; the response MUST include pagination metadata. The default page size is 20 articles; the maximum page size is 100 articles. Requests exceeding the maximum MUST be clamped to 100.
- **FR-005**: Article summaries MUST be derived from each feed's own description field, sanitized to plain text (all HTML tags stripped); no AI or LLM summarization is used in any phase.
- **FR-006**: The service MUST continue returning results from healthy sources when one or more sources fail; a partial failure MUST NOT cause the endpoint to return a 5xx error.
- **FR-007**: When one or more sources fail, the response MUST include a degraded indicator and identify which sources could not be fetched.
- **FR-008**: The service MUST cache the full merged & deduplicated article list in memory with a configurable TTL; pagination is applied at response time from the cached dataset; upstream feeds MUST NOT be fetched on every request.
- **FR-009**: The service MUST expose a health endpoint that returns a 200 response indicating the service is alive, usable as a deployment readiness/liveness probe.
- **FR-013**: On startup, the service MUST begin a background feed pre-fetch immediately and MUST bind its port and accept requests before that fetch completes; requests arriving before the cache is warm MUST receive an empty articles array (not an error).
- **FR-014**: The service MUST emit structured log output for each refresh cycle, recording per-source success or failure, fetch duration per source, and total refresh duration. No metrics endpoint is required.
- **FR-010**: The source list and cache TTL MUST be configurable without code changes (e.g., via environment variables or a config file).
- **FR-011**: Articles with no URL MUST be excluded from the response.
- **FR-012**: Articles with no publication date MUST be included but sorted after dated articles.

### Key Entities *(include if feature involves data)*

- **Article**: A single news item aggregated from a feed. Key attributes: title, canonical URL, publication date (nullable), plain-text summary, source feed identifier.
- **Feed Source**: A configured upstream RSS/Atom endpoint. Key attributes: URL, display name (optional), enabled flag.
- **Aggregated Feed Response**: The paginated API response. Key attributes: articles array, pagination metadata (page, page size, total count, has-next-page), degraded flag, list of failed source identifiers.
- **Cache Entry**: An in-memory snapshot of a completed aggregation result, associated with a timestamp and TTL.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The articles endpoint returns a valid JSON response within 2 seconds when results are served from cache.
- **SC-002**: A single failing feed source does not increase end-to-end response time by more than 5 seconds (enforced via a 5-second per-source fetch timeout).
- **SC-003**: The service correctly deduplicates articles such that no two items in a single response share the same canonical URL.
- **SC-004**: 100% of configured healthy sources contribute their articles to a successful response.
- **SC-005**: The health endpoint responds in under 200 milliseconds under normal operating conditions.
- **SC-006**: The service can be configured to aggregate from at least 10 simultaneous RSS/Atom sources without degrading response time beyond SC-001.
- **SC-007**: Switching from mock data to the live service requires no changes to the mobile app's data model — the JSON response shape is compatible with the existing article schema.

## Clarifications

### Session 2026-06-10

- Q: Should the cache hold the full merged dataset and apply pagination at response time, or cache individual pages keyed by page number + size? → A: Cache the full merged & deduplicated article list; pagination is applied per-request from the in-memory dataset (Option A).
- Q: Should the service pre-fetch feeds on startup (eager) or on first request (lazy)? → A: Kick off the pre-fetch on startup as a background task, but bind the port and start accepting requests immediately — do not await the fetch before listening.
- Q: What are the default and maximum page sizes for the articles endpoint? → A: Default page size 20 articles; maximum page size 100 articles.
- Q: What is the per-source fetch timeout? → A: 5 seconds; sources that do not respond within 5 seconds are treated as failed for that cycle.
- Q: What observability is required — structured logs, a metrics endpoint, or minimal logging? → A: Structured log output only; one entry per refresh cycle recording success/failure per source and refresh duration; no metrics endpoint.

## Assumptions

- The mobile app's existing article data model (title, URL, publication date, summary/description) is the reference shape for the JSON response; no additional fields are required in phase one.
- Feeds are publicly accessible without authentication; no OAuth or API-key handling for upstream sources is needed.
- In-memory caching is sufficient; no external cache store (e.g., Redis) is required in this phase.
- The per-source fetch timeout is 5 seconds; sources that do not respond within 5 seconds are treated as failed for that refresh cycle.
- The initial list of AI news RSS/Atom feeds will be provided separately (not defined in this spec); a small set of well-known feeds will be hardcoded as defaults for development.
- The service is deployed as a single instance; no distributed cache or multi-instance coordination is required in this phase.
- Plain-text sanitization means stripping HTML tags; entity decoding (e.g., `&amp;` → `&`) is included as part of sanitization.
- The service is not behind any authentication layer; all endpoints are publicly reachable (auth is explicitly out of scope).
- Push notifications, personalization, and database persistence are out of scope for this feature and future phases as described.
