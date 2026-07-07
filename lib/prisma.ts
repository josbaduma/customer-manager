import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const connectionString =
  process.env.DIRECT_URL ||
  process.env.POSTGRES_URL ||
  process.env.PRISMA_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.TURSO_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "No database connection string found. Set DIRECT_URL, POSTGRES_URL, PRISMA_DATABASE_URL, DATABASE_URL or TURSO_DATABASE_URL in your environment."
  );
}

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({
  adapter,
});

export default prisma;