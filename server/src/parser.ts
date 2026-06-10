import Parser from "rss-parser";
import { createHash } from "node:crypto";
import { sanitize } from "./sanitizer.js";
import { normalizeUrl, isSafeUrl } from "./lib/url.js";
import type { FeedSource } from "./config.js";

export type SourceRef = {
  id: string;
  name: string;
};

export type Article = {
  id: string;
  title: string;
  url: string;
  publishedAt: string | null;
  summary: string;
  source: SourceRef;
};

const rssParser = new Parser({
  customFields: {
    item: [["content:encoded", "contentEncoded"]],
  },
});

function toIso(value: string | undefined | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function slugify(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function articleId(url: string): string {
  return createHash("sha256")
    .update(normalizeUrl(url))
    .digest("hex")
    .slice(0, 16);
}

export async function parseFeed(
  rawXml: string,
  source: FeedSource
): Promise<Article[]> {
  const feed = await rssParser.parseString(rawXml);
  const sourceRef: SourceRef = {
    id: slugify(source.url),
    name: source.name ?? feed.title ?? source.url,
  };

  const articles: Article[] = [];
  for (const item of feed.items ?? []) {
    const url = item.link?.trim();
    if (!url || !isSafeUrl(url)) continue;

    const itemAny = item as unknown as Record<string, string | undefined>;
    const rawSummary =
      itemAny["contentEncoded"]
      ?? item.contentSnippet
      ?? item.content
      ?? item.summary
      ?? "";

    articles.push({
      id: articleId(url),
      title: sanitize(item.title ?? ""),
      url,
      publishedAt: item.isoDate ?? toIso(item.pubDate) ?? null,
      summary: sanitize(rawSummary),
      source: sourceRef,
    });
  }
  return articles;
}
