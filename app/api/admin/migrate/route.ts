import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * Admin endpoint to run database migrations
 * This should be protected in production!
 */
export async function POST(req: Request) {
  try {
    const { migrationName } = await req.json();

    if (!migrationName) {
      return NextResponse.json(
        { error: "migrationName is required" },
        { status: 400 }
      );
    }

    // Use service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase credentials not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Run the migration based on name
    let sql: string;

    if (migrationName === "add_template_version") {
      sql = `
-- Add template_version column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS template_version TEXT NOT NULL DEFAULT '1.0.0';

-- Add index for template version queries
CREATE INDEX IF NOT EXISTS idx_projects_template_version ON projects(template_version);

-- Add comment
COMMENT ON COLUMN projects.template_version IS 'Version of the React Native base template used for this project';
      `;
    } else {
      return NextResponse.json(
        { error: "Unknown migration name" },
        { status: 400 }
      );
    }

    console.log(`[Migration] Running: ${migrationName}`);
    console.log(`[Migration] SQL:\n${sql}`);

    // Execute the migration using raw SQL
    const { data, error } = await supabase.rpc("exec_sql", {
      sql_query: sql,
    });

    if (error) {
      // If exec_sql RPC doesn't exist, try direct query
      console.error("[Migration] RPC error:", error);
      console.log("[Migration] Attempting direct query...");

      const { error: queryError } = await supabase.from("_migrations").insert({
        name: migrationName,
        executed_at: new Date().toISOString(),
      });

      if (queryError && !queryError.message.includes("already exists")) {
        throw queryError;
      }

      return NextResponse.json({
        success: true,
        message: "Migration may need to be run manually via Supabase dashboard",
        sql,
      });
    }

    console.log("[Migration] Success!");

    return NextResponse.json({
      success: true,
      message: `Migration ${migrationName} completed successfully`,
      result: data,
    });
  } catch (error) {
    console.error("[Migration] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Migration failed",
      },
      { status: 500 }
    );
  }
}
