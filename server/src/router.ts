import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCache, getRefreshStatus, awaitWarmCache } from "./cache.js";

const app = new Hono();
app.use("*", cors());

app.get("/articles", async (c) => {
  const rawPage = c.req.query("page") ?? "1";
  const rawPageSize = c.req.query("pageSize") ?? "20";

  const page = parseInt(rawPage, 10);
  const pageSize = Math.min(parseInt(rawPageSize, 10), 100);

  if (isNaN(page) || page < 1) {
    return c.json(
      { error: "invalid_params", message: "page must be a positive integer" },
      400
    );
  }
  if (isNaN(pageSize) || pageSize < 1) {
    return c.json(
      {
        error: "invalid_params",
        message: "pageSize must be a positive integer",
      },
      400
    );
  }

  let entry = getCache();
  if (entry === null) {
    entry = await awaitWarmCache(8000);
  }

  if (entry === null) {
    const { lastAttemptAt, lastRefreshOk } = getRefreshStatus();
    return c.json({
      articles: [],
      pagination: { page, pageSize, total: 0, hasNextPage: false },
      meta: {
        degraded: false,
        failedSources: [],
        cachedAt: null,
        lastAttemptAt: lastAttemptAt?.toISOString() ?? null,
        staleData: !lastRefreshOk,
      },
    });
  }

  const { articles, cachedAt, failedSources } = entry;
  const { lastAttemptAt, lastRefreshOk } = getRefreshStatus();

  const total = articles.length;
  const start = (page - 1) * pageSize;
  const slice = articles.slice(start, start + pageSize);

  return c.json({
    articles: slice,
    pagination: {
      page,
      pageSize,
      total,
      hasNextPage: start + pageSize < total,
    },
    meta: {
      degraded: failedSources.length > 0 || !lastRefreshOk,
      failedSources,
      cachedAt: cachedAt.toISOString(),
      lastAttemptAt: lastAttemptAt?.toISOString() ?? null,
      staleData: !lastRefreshOk,
    },
  });
});

app.get("/health", (c) => {
  const entry = getCache();
  return c.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    cachedAt: entry?.cachedAt.toISOString() ?? null,
  });
});

export default app;
