import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: "./database/data.sqlite",
});

const prisma = new PrismaClient({ adapter });

export default prisma;
