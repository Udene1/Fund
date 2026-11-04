import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";

const prisma = new PrismaClient();
const expectedTables = [
  "Decision",
  "Event",
  "EventRevision",
  "Lesson",
  "LessonEvent",
  "Outcome",
  "Policy",
  "PolicyEvent",
  "Reflection",
].sort();

try {
  const [identity] = await prisma.$queryRaw`SELECT current_database() AS database, current_user AS role`;
  if (identity.database !== "neondb" || identity.role !== "neondb_owner") {
    throw new Error(`Refusing to initialize unexpected database identity: ${identity.database}/${identity.role}`);
  }

  const readTables = async () => {
    const rows = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
    return rows.map((row) => row.tablename).sort();
  };

  const existing = await readTables();
  if (existing.length === 0) {
    console.log("Verified dedicated Fund database is empty; applying Prisma schema.");
    await prisma.$disconnect();
    const result = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (result.status !== 0) process.exit(result.status ?? 1);
    await prisma.$connect();
  } else if (JSON.stringify(existing) === JSON.stringify(expectedTables)) {
    console.log("Fund schema tables already exist; bootstrap is idempotently skipped.");
  } else {
    throw new Error(`Refusing to alter a database with unexpected tables: ${existing.join(", ")}`);
  }

  const finalTables = await readTables();
  if (JSON.stringify(finalTables) !== JSON.stringify(expectedTables)) {
    throw new Error(`Schema verification failed. Found: ${finalTables.join(", ")}`);
  }
  console.log(`Fund database verified: ${identity.database}, role ${identity.role}, ${finalTables.length} tables.`);
} finally {
  await prisma.$disconnect();
}
