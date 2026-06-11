export type FeedSource = {
  url: string;
  name?: string;
  enabled: boolean;
};

export type Config = {
  port: number;
  cacheTtlSeconds: number;
  fetchTimeoutMs: number;
  feeds: FeedSource[];
};

// Confirmed-working AI news RSS/Atom feeds (validated 2026-06-10).
// Each URL was fetched and confirmed to return parseable RSS 2.0 or Atom 1.0.
export const DEFAULT_FEEDS: FeedSource[] = [
  // RSS 2.0 — redirects to openai.com/blog/rss.xml; follow redirect at runtime
  { url: "https://openai.com/blog/rss.xml", name: "OpenAI News", enabled: true },
  // RSS 2.0 — final URL after redirect from blog.google/technology/ai/rss/
  { url: "https://blog.google/innovation-and-ai/technology/ai/rss/", name: "Google AI Blog", enabled: true },
  // Atom 1.0
  { url: "https://huggingface.co/blog/feed.xml", name: "Hugging Face Blog", enabled: true },
  // RSS 2.0 via FeedBurner
  { url: "https://feeds.feedburner.com/venturebeat/SZYF", name: "VentureBeat AI", enabled: true },
];

export function loadConfig(): Config {
  const port = parseInt(process.env.PORT ?? "3000", 10);
  const cacheTtlSeconds = parseInt(
    process.env.CACHE_TTL_SECONDS ?? "300",
    10
  );
  const fetchTimeoutMs = parseInt(
    process.env.FETCH_TIMEOUT_MS ?? "5000",
    10
  );

  const feedUrls = process.env.FEED_URLS;
  const feeds: FeedSource[] = feedUrls
    ? feedUrls
        .split(",")
        .map((u: string) => u.trim())
        .filter(Boolean)
        .map((url: string): FeedSource => ({ url, enabled: true }))
    : DEFAULT_FEEDS;

  return { port, cacheTtlSeconds, fetchTimeoutMs, feeds };
}
