import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  TOKEN_ENCRYPTION_KEY: z.string().min(32).optional(),
  CRON_SECRET: z.string().min(24).optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://127.0.0.1:3004"),
});

export const env = serverSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL || undefined,
  AUTH_SECRET: process.env.AUTH_SECRET || undefined,
  TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY || undefined,
  CRON_SECRET: process.env.CRON_SECRET || undefined,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN || undefined,
  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID || undefined,
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET || undefined,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

export function productionReadiness() {
  const required = ["DATABASE_URL", "AUTH_SECRET", "TOKEN_ENCRYPTION_KEY", "CRON_SECRET"] as const;
  const missing = required.filter((key) => !env[key]);
  return { ready: missing.length === 0, missing };
}
