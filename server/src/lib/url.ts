/**
 * Canonical URL key used for both deduplication (aggregator.ts) and
 * stable article ID generation (parser.ts). Never reimplement inline.
 */
export function normalizeUrl(url: string): string {
  return url.toLowerCase().replace(/\/$/, "");
}

export function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
