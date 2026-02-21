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

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log("🌱 Seeding database...\n");

    // Load regions data
    const regionsFile = path.join(
      __dirname,
      "../database/seeds/ukraine_regions.json"
    );
    const regionsData = JSON.parse(fs.readFileSync(regionsFile, "utf-8"));

    console.log(`📍 Seeding ${regionsData.length} regions...`);

    let insertedCount = 0;
    let skippedCount = 0;

    for (const region of regionsData) {
      // Check if region already exists
      const exists = await client.query(
        "SELECT id FROM regions WHERE code = $1",
        [region.code]
      );

      if (exists.rows.length > 0) {
        console.log(`⏭️  Skipping ${region.name} (already exists)`);
        skippedCount++;
        continue;
      }

      // Insert region
      await client.query(
        `INSERT INTO regions (name, name_ua, code, population)
         VALUES ($1, $2, $3, $4)`,
        [region.name, region.name_ua, region.code, region.population]
      );

      console.log(`✅ Inserted ${region.name_ua}`);
      insertedCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Inserted: ${insertedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`\n✅ Database seeding completed!`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
