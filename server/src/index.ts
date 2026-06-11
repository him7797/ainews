import { serve } from "@hono/node-server";
import { loadConfig } from "./config.js";
import { startRefreshLoop } from "./cache.js";
import app from "./router.js";

const config = loadConfig();

startRefreshLoop(config);

serve({ fetch: app.fetch, port: config.port }, () => {
  process.stdout.write(
    JSON.stringify({
      event: "server_start",
      port: config.port,
      feedCount: config.feeds.filter((f) => f.enabled).length,
      cacheTtlSeconds: config.cacheTtlSeconds,
    }) + "\n"
  );
});
