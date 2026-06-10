import type { Config, FeedSource } from "./config.js";
import type { Article } from "./parser.js";
import { fetchFeed, FetchError } from "./fetcher.js";
import { parseFeed } from "./parser.js";
import { aggregate } from "./aggregator.js";
import type { SourceResult } from "./aggregator.js";

export type CacheEntry = {
  articles: Article[];
  cachedAt: Date;
  failedSources: string[];
};

type CacheState = {
  entry: CacheEntry | null;
  refreshing: Promise<void> | null;
  lastAttemptAt: Date | null;
  lastRefreshOk: boolean;
};

const state: CacheState = {
  entry: null,
  refreshing: null,
  lastAttemptAt: null,
  lastRefreshOk: true,
};

export function getCache(): CacheEntry | null {
  return state.entry;
}

export function getRefreshStatus(): {
  lastAttemptAt: Date | null;
  lastRefreshOk: boolean;
} {
  return {
    lastAttemptAt: state.lastAttemptAt,
    lastRefreshOk: state.lastRefreshOk,
  };
}

export async function awaitWarmCache(
  maxWaitMs = 8000
): Promise<CacheEntry | null> {
  if (state.entry !== null || state.refreshing === null) {
    return state.entry;
  }
  const timeout = new Promise<void>((resolve) =>
    setTimeout(resolve, maxWaitMs)
  );
  await Promise.race([state.refreshing, timeout]);
  return state.entry;
}

async function runRefresh(config: Config): Promise<void> {
  const start = Date.now();
  state.lastAttemptAt = new Date();

  const enabledFeeds = config.feeds.filter((f) => f.enabled);
  const settled = await Promise.allSettled(
    enabledFeeds.map((source) => fetchAndParse(source, config.fetchTimeoutMs))
  );

  const results: SourceResult[] = enabledFeeds.map((source, i) => {
    const outcome = settled[i];
    if (outcome.status === "fulfilled") {
      return { source, articles: outcome.value };
    }
    return {
      source,
      error: outcome.reason instanceof Error ? outcome.reason : new Error(String(outcome.reason)),
    };
  });

  const { articles, failedSources } = aggregate(results);
  const durationMs = Date.now() - start;
  const degraded = failedSources.length > 0;

  const logEntry = {
    event: "cache_refresh",
    timestamp: new Date().toISOString(),
    durationMs,
    sources: enabledFeeds.map((source, i) => {
      const outcome = settled[i];
      const sid = sourceSlug(source);
      if (outcome.status === "fulfilled") {
        return {
          id: sid,
          status: "ok",
          articleCount: outcome.value.length,
          durationMs: 0,
        };
      }
      const err = outcome.reason;
      return {
        id: sid,
        status: "error",
        error: err instanceof FetchError ? err.reason : "unknown",
        durationMs: config.fetchTimeoutMs,
      };
    }),
    totalArticles: articles.length,
    degraded,
  };
  process.stdout.write(JSON.stringify(logEntry) + "\n");

  const newEntry: CacheEntry = {
    articles,
    cachedAt: new Date(),
    failedSources,
  };

  if (articles.length > 0 || state.entry === null) {
    state.entry = newEntry;
    state.lastRefreshOk = true;
  } else {
    state.lastRefreshOk = false;
  }
}

async function fetchAndParse(
  source: FeedSource,
  timeoutMs: number
): Promise<Article[]> {
  const xml = await fetchFeed(source, timeoutMs);
  return parseFeed(xml, source);
}

function sourceSlug(source: FeedSource): string {
  return source.url
    .replace(/^https?:\/\//, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function startRefreshLoop(config: Config): void {
  function scheduleNext(): void {
    state.refreshing = runRefresh(config).finally(() => {
      state.refreshing = null;
      setTimeout(scheduleNext, config.cacheTtlSeconds * 1000);
    });
  }
  scheduleNext();
}
