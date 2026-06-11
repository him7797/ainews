import { describe, it, expect } from "vitest";
import { aggregate } from "../../src/aggregator.js";
import type { SourceResult } from "../../src/aggregator.js";
import type { Article } from "../../src/parser.js";
import type { FeedSource } from "../../src/config.js";

const source1: FeedSource = { url: "https://source1.com/rss", enabled: true };
const source2: FeedSource = { url: "https://source2.com/rss", enabled: true };

function makeArticle(
  url: string,
  publishedAt: string | null,
  source: FeedSource
): Article {
  return {
    id: url.slice(-8),
    title: `Article at ${url}`,
    url,
    publishedAt,
    summary: "Summary text",
    source: { id: source.url, name: source.name ?? source.url },
  };
}

describe("aggregate", () => {
  it("deduplicates articles with the same normalized URL", () => {
    const a1 = makeArticle("https://example.com/article/", "2026-06-01T00:00:00Z", source1);
    const a2 = makeArticle("https://example.com/article", "2026-06-01T00:00:00Z", source2);
    const results: SourceResult[] = [
      { source: source1, articles: [a1] },
      { source: source2, articles: [a2] },
    ];
    const { articles } = aggregate(results);
    expect(articles).toHaveLength(1);
    expect(articles[0]!.url).toBe(a1.url);
  });

  it("first-seen article wins when URLs are duplicates", () => {
    const a1 = makeArticle("https://example.com/post", "2026-06-01T00:00:00Z", source1);
    const a2 = makeArticle("https://example.com/post", "2026-06-01T00:00:00Z", source2);
    const results: SourceResult[] = [
      { source: source1, articles: [a1] },
      { source: source2, articles: [a2] },
    ];
    const { articles } = aggregate(results);
    expect(articles[0]!.source.id).toBe(source1.url);
  });

  it("sorts dated articles newest-first", () => {
    const older = makeArticle("https://a.com/old", "2026-05-01T00:00:00Z", source1);
    const newer = makeArticle("https://a.com/new", "2026-06-01T00:00:00Z", source1);
    const { articles } = aggregate([{ source: source1, articles: [older, newer] }]);
    expect(articles[0]!.url).toBe(newer.url);
    expect(articles[1]!.url).toBe(older.url);
  });

  it("appends undated articles after dated ones in stable input order", () => {
    const dated = makeArticle("https://a.com/dated", "2026-06-01T00:00:00Z", source1);
    const undated1 = makeArticle("https://a.com/u1", null, source1);
    const undated2 = makeArticle("https://a.com/u2", null, source1);
    const { articles } = aggregate([
      { source: source1, articles: [undated1, dated, undated2] },
    ]);
    expect(articles[0]!.url).toBe(dated.url);
    expect(articles[1]!.url).toBe(undated1.url);
    expect(articles[2]!.url).toBe(undated2.url);
  });

  it("records failing source IDs in failedSources", () => {
    const err = new Error("timeout");
    const { failedSources } = aggregate([
      { source: source1, articles: [makeArticle("https://a.com/a", "2026-06-01T00:00:00Z", source1)] },
      { source: source2, error: err },
    ]);
    expect(failedSources).toContain(
      "source2-com-rss"
    );
    expect(failedSources).not.toContain("source1-com-rss");
  });

  it("returns empty articles array with all sources in failedSources when all fail", () => {
    const { articles, failedSources } = aggregate([
      { source: source1, error: new Error("net") },
      { source: source2, error: new Error("net") },
    ]);
    expect(articles).toHaveLength(0);
    expect(failedSources).toHaveLength(2);
  });
});
