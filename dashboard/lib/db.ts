import "server-only";
import { Pool } from "pg";

const globalForPostgres = globalThis as typeof globalThis & {
  postgresPool?: Pool;
};

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    return new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    });
  }

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
        `Missing environment variable: ${variable}. Configure DATABASE_URL or check your local .env.local file.`,
      );
    }
  }

  return new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });
}

export const db = globalForPostgres.postgresPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.postgresPool = db;
}
