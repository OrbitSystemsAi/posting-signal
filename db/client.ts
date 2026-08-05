import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/lib/env";
import * as schema from "./schema";

export function getDb() {
  if (!env.DATABASE_URL) return null;
  return drizzle(neon(env.DATABASE_URL), { schema });
}
