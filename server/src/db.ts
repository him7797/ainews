import postgres from "postgres";
import { loadConfig } from "./config.js";

const config = loadConfig();

export const sql = postgres(config.databaseUrl);
