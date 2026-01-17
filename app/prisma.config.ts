// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

// Ne fait jamais planter si DATABASE_URL est absente (cas build Docker, etc.)
const databaseUrl =
  process.env.DATABASE_URL ?? "mysql://user:password@localhost:3306/dummy_db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: databaseUrl },
});
