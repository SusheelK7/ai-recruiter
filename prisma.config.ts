import "dotenv/config";
import { defineConfig } from "prisma/config";

function getDataSourceUrl(): string {
  const isVercelOrProd = Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";

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
    const cleaned = raw.trim().replace(/^DATABASE_URL=/, "").replace(/^["']|["']$/g, "");
    if (isVercelOrProd && (cleaned.includes("localhost") || cleaned.includes("127.0.0.1"))) {
      continue;
    }
    return cleaned;
  }

  return process.env.DATABASE_URL || "";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: getDataSourceUrl(),
  },
});
