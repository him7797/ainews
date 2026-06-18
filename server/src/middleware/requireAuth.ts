import type { Context, Next } from "hono";
import { verifyJwt } from "../auth.js";

declare module "hono" {
  interface ContextVariableMap {
    user: { userId: string; email: string };
  }
}

export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  const authorization = c.req.header("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return c.json({ error: "unauthorized", message: "Missing or invalid Authorization header" }, 401);
  }

  const token = authorization.slice(7);

  try {
    const payload = await verifyJwt(token);
    c.set("user", { userId: payload.sub, email: payload.email });
    await next();
  } catch {
    return c.json({ error: "unauthorized", message: "Invalid or expired token" }, 401);
  }
}
