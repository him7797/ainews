import type { FeedSource } from "./config.js";

export type FetchErrorReason = "timeout" | "http" | "network";

export class FetchError extends Error {
  constructor(
    public readonly sourceId: string,
    public readonly reason: FetchErrorReason,
    public readonly detail: string
  ) {
    super(`[${sourceId}] ${reason}: ${detail}`);
    this.name = "FetchError";
  }
}

export async function fetchFeed(
  source: FeedSource,
  timeoutMs: number
): Promise<string> {
  const sourceId = source.url;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const MAX_BYTES = 5 * 1024 * 1024;
    const response = await fetch(source.url, { signal: controller.signal });
    if (!response.ok) {
      throw new FetchError(sourceId, "http", `HTTP ${response.status}`);
    }
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    const reader = response.body?.getReader();
    if (!reader) return await response.text();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BYTES) {
        reader.cancel();
        throw new FetchError(sourceId, "network", "feed exceeds 5MB size limit");
      }
      chunks.push(value);
    }
    return new TextDecoder().decode(
      chunks.reduce((acc, chunk) => {
        const merged = new Uint8Array(acc.length + chunk.length);
        merged.set(acc);
        merged.set(chunk, acc.length);
        return merged;
      }, new Uint8Array(0))
    );
  } catch (err) {
    if (err instanceof FetchError) throw err;
    const isAbort =
      err instanceof Error && err.name === "AbortError";
    throw new FetchError(
      sourceId,
      isAbort ? "timeout" : "network",
      err instanceof Error ? err.message : String(err)
    );
  } finally {
    clearTimeout(timer);
  }
}
