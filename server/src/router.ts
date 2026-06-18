import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCache, getRefreshStatus, awaitWarmCache } from "./cache.js";
import { sql } from "./db.js";
import { AuthError, encryptToken, signJwt, verifyGoogleIdToken } from "./auth.js";

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

app.post("/auth/google", async (c) => {
  let body: { idToken?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_request", message: "Request body must be JSON" }, 400);
  }

  if (!body.idToken) {
    process.stdout.write(JSON.stringify({ event: "auth_failure", reason: "invalid_request", timestamp: new Date().toISOString() }) + "\n");
    return c.json({ error: "invalid_request", message: "idToken is required" }, 400);
  }

  try {
    const { email } = await verifyGoogleIdToken(body.idToken);
    const encryptedToken = encryptToken(body.idToken);

    const rows = await sql<{ id: string; email: string; created_at: Date; is_new: boolean }[]>`
      INSERT INTO users (email, google_oauth_token)
      VALUES (${email}, ${encryptedToken})
      ON CONFLICT (email) DO UPDATE
        SET google_oauth_token = EXCLUDED.google_oauth_token
      RETURNING
        id,
        email,
        created_at,
        (xmax = 0) AS is_new
    `;

    const user = rows[0];
    const isNewUser = user.is_new;
    const token = await signJwt(user.id, user.email);

    process.stdout.write(
      JSON.stringify({ event: "auth_success", userId: user.id, isNewUser, timestamp: new Date().toISOString() }) + "\n"
    );

    const status = isNewUser ? 201 : 200;
    return c.json(
      { token, user: { id: user.id, email: user.email, createdAt: user.created_at }, isNewUser },
      status
    );
  } catch (err) {
    if (err instanceof AuthError) {
      process.stdout.write(JSON.stringify({ event: "auth_failure", reason: err.code, timestamp: new Date().toISOString() }) + "\n");
      return c.json({ error: err.code, message: err.message }, 401);
    }
    process.stdout.write(JSON.stringify({ event: "auth_failure", reason: "internal_error", timestamp: new Date().toISOString() }) + "\n");
    return c.json({ error: "internal_error", message: "An unexpected error occurred" }, 500);
  }
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
