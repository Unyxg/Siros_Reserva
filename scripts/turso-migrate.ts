/**
 * Applies Prisma's SQL migrations to the Turso database.
 * (`prisma migrate deploy` can't talk to Turso directly.)
 *
 *   npm run turso:migrate   (reads TURSO_DATABASE_URL / TURSO_AUTH_TOKEN from .env or the shell)
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("Falta TURSO_DATABASE_URL. Agrégala a tu archivo .env (junto con TURSO_AUTH_TOKEN) o pásala en el comando.");
  process.exit(1);
}

const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const dir = join(process.cwd(), "prisma", "migrations");

async function main() {
  await db.execute(`CREATE TABLE IF NOT EXISTS "_app_migrations" ("name" TEXT PRIMARY KEY, "appliedAt" TEXT NOT NULL)`);
  const applied = new Set((await db.execute(`SELECT name FROM "_app_migrations"`)).rows.map((r) => String(r.name)));

  const pending = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !applied.has(d.name))
    .map((d) => d.name)
    .sort();

  if (pending.length === 0) return console.log("✅ La base de datos ya está al día.");

  for (const name of pending) {
    const sql = readFileSync(join(dir, name, "migration.sql"), "utf8");
    // Run each migration and its bookkeeping row as one unit.
    await db.executeMultiple(`BEGIN;\n${sql}\nINSERT INTO "_app_migrations" VALUES ('${name}', datetime('now'));\nCOMMIT;`);
    console.log(`  ✔ ${name}`);
  }
  console.log(`✅ ${pending.length} migración(es) aplicada(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
