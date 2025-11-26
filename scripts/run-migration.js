#!/usr/bin/env node

/**
 * Script to run Supabase migrations
 * Usage: node scripts/run-migration.js <migration-file>
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("  - NEXT_PUBLIC_SUPABASE_URL");
  console.error("  - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationFile) {
  const migrationPath = path.join(__dirname, "..", "supabase", "migrations", migrationFile);

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  console.log(`📄 Reading migration: ${migrationFile}`);
  const sql = fs.readFileSync(migrationPath, "utf-8");

  console.log(`🚀 Running migration...`);
  console.log(`\nSQL:\n${sql}\n`);

  try {
    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (error) {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    }

    console.log("✅ Migration completed successfully!");
    if (data) {
      console.log("Result:", data);
    }
  } catch (err) {
    console.error("❌ Error running migration:", err);
    process.exit(1);
  }
}

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error("❌ Usage: node scripts/run-migration.js <migration-file>");
  console.error("   Example: node scripts/run-migration.js 003_add_template_version.sql");
  process.exit(1);
}

runMigration(migrationFile).then(() => process.exit(0));
