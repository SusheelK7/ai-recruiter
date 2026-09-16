import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function resolveConnectionString(): string | undefined {
  const isVercelOrProd = Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";

  // In production or on Vercel, prioritize cloud-provided connection strings and ignore localhost
  const candidates = isVercelOrProd
    ? [
        process.env.DATABASE1_POSTGRES_URL,
        process.env.DATABASE1_DATABASE_URL,
        process.env.POSTGRES_URL,
        process.env.DATABASE_URL,
      ]
    : [
        process.env.DATABASE_URL,
        process.env.DATABASE1_POSTGRES_URL,
        process.env.DATABASE1_DATABASE_URL,
        process.env.POSTGRES_URL,
      ];

  for (const raw of candidates) {
    if (!raw) continue;
    // Strip accidental "DATABASE_URL=" prefix or surrounding quotes if pasted in Vercel UI
    const cleaned = raw.trim().replace(/^DATABASE_URL=/, "").replace(/^["']|["']$/g, "");
    if (isVercelOrProd && (cleaned.includes("localhost") || cleaned.includes("127.0.0.1"))) {
      continue;
    }
    return cleaned;
  }

  return process.env.DATABASE_URL;
}

function createPrismaClient() {
  const connectionString = resolveConnectionString();
  const isProduction = process.env.NODE_ENV === "production";
  const isRemoteDb =
    Boolean(connectionString) &&
    !connectionString?.includes("localhost") &&
    !connectionString?.includes("127.0.0.1");

  try {
    if (connectionString) {
      const sanitizedHost = connectionString.split("@")[1]?.split("/")[0] || "connected";
      console.log(`[Prisma] Connecting to Postgres at ${sanitizedHost}`);
    }
  } catch {
    // Ignore logging errors
  }

  const pool = new Pool({
    connectionString,
    max: 10,
    ssl: isProduction || isRemoteDb ? { rejectUnauthorized: false } : undefined,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;