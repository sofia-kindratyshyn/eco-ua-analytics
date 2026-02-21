import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 5432,
  database: process.env.DATABASE_NAME || "eco_ua_db",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "",
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log("🔄 Running database migrations...\n");

    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get list of migration files
    const migrationsDir = path.join(__dirname, "../database/migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    // Get executed migrations
    const { rows: executedMigrations } = await client.query(
      "SELECT filename FROM migrations"
    );
    const executedSet = new Set(executedMigrations.map((r) => r.filename));

    // Run pending migrations
    let executedCount = 0;
    for (const file of files) {
      if (executedSet.has(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`🔄 Executing ${file}...`);

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO migrations (filename) VALUES ($1)", [
          file,
        ]);
        await client.query("COMMIT");
        console.log(`✅ Completed ${file}\n`);
        executedCount++;
      } catch (error) {
        await client.query("ROLLBACK");
        console.error(`❌ Failed ${file}:`, error);
        throw error;
      }
    }

    if (executedCount === 0) {
      console.log("✅ All migrations are up to date!");
    } else {
      console.log(`\n✅ Successfully executed ${executedCount} migration(s)!`);
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
