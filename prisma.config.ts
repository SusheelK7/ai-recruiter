import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url:
      process.env.DATABASE_URL ||
      process.env.DATABASE1_DATABASE_URL ||
      process.env.DATABASE1_POSTGRES_URL ||
      process.env.POSTGRES_URL ||
      env("DATABASE_URL"),
  },
});
