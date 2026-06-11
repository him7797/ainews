import { normalizeUrl } from "./lib/url.js";
import type { Article } from "./parser.js";
import type { FeedSource } from "./config.js";
import type { FetchError } from "./fetcher.js";

export type SourceResult = {
  source: FeedSource;
  articles?: Article[];
  error?: FetchError | Error;
};

export type AggregatedResult = {
  articles: Article[];
  failedSources: string[];
};

function sourceId(source: FeedSource): string {
  return source.url
    .replace(/^https?:\/\//, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function aggregate(results: SourceResult[]): AggregatedResult {
  const failedSources: string[] = [];
  const seen = new Map<string, boolean>();
  const dated: Article[] = [];
  const undated: Article[] = [];

  for (const result of results) {
    if (result.error || !result.articles) {
      failedSources.push(sourceId(result.source));
      continue;
    }
    for (const article of result.articles) {
      const key = normalizeUrl(article.url);
      if (seen.has(key)) continue;
      seen.set(key, true);
      if (article.publishedAt !== null) {
        dated.push(article);
      } else {
        undated.push(article);
      }
    }
  }

  dated.sort(
    (a, b) =>
      new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime()
  );

  return { articles: [...dated, ...undated], failedSources };
}
