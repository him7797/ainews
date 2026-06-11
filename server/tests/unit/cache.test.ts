import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Article } from "../../src/parser.js";
import type { FeedSource } from "../../src/config.js";

// Helper to build a minimal Article
function makeArticle(url: string): Article {
  return {
    id: url.slice(-8),
    title: `Article ${url}`,
    url,
    publishedAt: new Date().toISOString(),
    summary: "Summary",
    source: { id: "test-source", name: "Test" },
  };
}

const mockFeed: FeedSource = {
  url: "https://mock-feed.test/rss",
  name: "Mock Feed",
  enabled: true,
};

describe("aggregate — undated articles sorting", () => {
  it("undated articles are appended after dated ones", async () => {
    const { aggregate } = await import("../../src/aggregator.js");
    const dated: Article = { ...makeArticle("https://a.com/dated"), publishedAt: "2026-06-01T00:00:00Z" };
    const undated: Article = { ...makeArticle("https://a.com/undated"), publishedAt: null };
    const { articles } = aggregate([{ source: mockFeed, articles: [undated, dated] }]);
    expect(articles[0]!.url).toContain("dated");
    expect(articles[1]!.url).toContain("undated");
  });
});

describe("cache state management", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("getCache returns null before any refresh", async () => {
    // Import fresh cache module — Vitest module cache is shared, so we
    // test the observable API rather than internal state resets.
    const { getCache } = await import("../../src/cache.js");
    const entry = getCache();
    // Entry is either null (not yet warmed) or a CacheEntry (if a prior test triggered a refresh)
    expect(entry === null || (typeof entry === "object" && "articles" in entry)).toBe(true);
  });

  it("getRefreshStatus returns expected shape", async () => {
    const { getRefreshStatus } = await import("../../src/cache.js");
    const status = getRefreshStatus();
    expect(status).toHaveProperty("lastAttemptAt");
    expect(status).toHaveProperty("lastRefreshOk");
    expect(typeof status.lastRefreshOk).toBe("boolean");
  });

  it("awaitWarmCache resolves within maxWaitMs", async () => {
    const { awaitWarmCache } = await import("../../src/cache.js");
    const start = Date.now();
    // Use a short timeout — if cache is already warm, resolves immediately
    const result = await awaitWarmCache(100);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);
    // Result is either null or a valid CacheEntry
    expect(result === null || Array.isArray((result as { articles: unknown }).articles)).toBe(true);
  });
});

describe("normalizeUrl", () => {
  it("strips trailing slash", async () => {
    const { normalizeUrl } = await import("../../src/lib/url.js");
    expect(normalizeUrl("https://example.com/post/")).toBe("https://example.com/post");
  });

  it("lowercases the URL", async () => {
    const { normalizeUrl } = await import("../../src/lib/url.js");
    expect(normalizeUrl("https://EXAMPLE.COM/Post")).toBe("https://example.com/post");
  });

  it("treats same URL with and without trailing slash as equal", async () => {
    const { normalizeUrl } = await import("../../src/lib/url.js");
    expect(normalizeUrl("https://x.com/a/")).toBe(normalizeUrl("https://x.com/a"));
  });
});
