import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = postgres(databaseUrl);

const migrations = ["001_create_users.sql"];

for (const file of migrations) {
  const sqlText = readFileSync(resolve(__dirname, "../migrations", file), "utf8");
  console.log(`Running ${file}...`);
  await sql.unsafe(sqlText);
  console.log(`Done: ${file}`);
}

await sql.end();
console.log("All migrations complete.");
