
import "server-only";
import { Pool } from "pg";

const requiredVariables = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
] as const;

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(
      `Missing environment variable: ${variable}. Check your .env.local file.`,
    );
  }
}

const globalForPostgres = globalThis as typeof globalThis & {
  postgresPool?: Pool;
};

export const db =
  globalForPostgres.postgresPool ??
  new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.postgresPool = db;
}