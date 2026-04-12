import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // For serverless Next.js + Supabase PgBouncer: limit to 1 connection per instance
  // to prevent "connection forcibly closed" (ECONNRESET) errors from idle pool connections.
  const base = process.env.DATABASE_URL ?? "";
  const url = base.includes("connection_limit")
    ? base
    : base + (base.includes("?") ? "&" : "?") + "connection_limit=1&pool_timeout=20";

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: { db: { url } },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
