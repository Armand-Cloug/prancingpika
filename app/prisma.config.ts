// prisma.config.ts
import { defineConfig } from "prisma/config";

const databaseUrl =
  process.env.DATABASE_URL || "mysql://user:password@localhost:3306/dummy_db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: databaseUrl,
  },
});
