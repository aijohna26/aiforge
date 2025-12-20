import { json, type ActionFunctionArgs } from "@remix-run/node";
import { createClient } from "~/lib/supabase/server";

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, { status: 405 });
    }

    const headers = new Headers();
    const supabase = createClient(request, headers);
    const { data: { user } } = await supabase.auth.getUser();

    // Check for authentication
    if (!user) {
        return json({
            success: false,
            error: "You must be logged in to save a project.",
            errorCode: 'UNAUTHENTICATED'
        }, { status: 401, headers });
    }

    try {
        const wizardData = await request.json();

        // We'll save the whole design state to a projects table
        // We assume a 'projects' table exists with a 'data' jsonb column
        const { data, error } = await supabase
            .from('projects')
            .insert({
                user_id: user.id,
                name: wizardData.step1.appName,
                description: wizardData.step1.description,
                data: wizardData,
                status: 'finalized'
            })
            .select()
            .single();

        if (error) {
            console.error('[Save Wizard] Supabase error detail:', JSON.stringify(error, null, 2));

            // If projects table doesn't exist, we return a specific error
            if (error.code === '42P01') {
                return json({
                    success: false,
                    error: "The 'projects' table was not found in Supabase. Please run the SQL to create it.",
                    errorCode: 'TABLE_MISSING',
                    sql: `
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    data JSONB NOT NULL,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);`
                }, { status: 404, headers });
            }

            // Specific check for missing 'data' column (PGRST204)
            if (error.message && error.message.includes("'data' column")) {
                return json({
                    success: false,
                    error: "Missing 'data' column in 'projects' table. Please run this SQL in your Supabase SQL Editor:",
                    errorCode: 'COLUMN_MISSING',
                    sql: "ALTER TABLE projects ADD COLUMN IF NOT EXISTS data JSONB;"
                }, { status: 400, headers });
            }

            // Specific check for missing 'status' column (PGRST204)
            if (error.message && error.message.includes("'status' column")) {
                return json({
                    success: false,
                    error: "Missing 'status' column in 'projects' table. Please run this SQL in your Supabase SQL Editor:",
                    errorCode: 'COLUMN_MISSING',
                    sql: "ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';"
                }, { status: 400, headers });
            }

            // Handle permission/auth issues
            if (error.code === '42501') {
                return json({
                    success: false,
                    error: "Row-Level Security policy violation. Since you are in test mode, run this to allow anonymous access.",
                    errorCode: 'RLS_VIOLATION',
                    sql: `
-- Enable RLS (if not already enabled)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- OPTION A: Allow Anonymous/Public Access (For Test Mode)
CREATE POLICY "Allow public insert" ON projects FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public select" ON projects FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public update" ON projects FOR UPDATE TO anon USING (true);

-- OPTION B: Authenticated Access (If you log in later)
CREATE POLICY "Users can insert own" ON projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own" ON projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
`
                }, { status: 403, headers });
            }

            // Handle Not-Null Violation (e.g., user_id is null but required)
            if (error.code === '23502') {
                return json({
                    success: false,
                    error: "The 'user_id' column requires a value, but none was provided. This usually means you are not logged in.",
                    errorCode: 'NOT_NULL_VIOLATION',
                    sql: "ALTER TABLE projects ALTER COLUMN user_id DROP NOT NULL;"
                }, { status: 400, headers });
            }

            return json({ success: false, error: error.message, details: error }, { status: 500, headers });
        }

        return json({ success: true, project: data }, { headers });
    } catch (error) {
        console.error('[Save Wizard] Error:', error);
        return json({ success: false, error: 'Failed to save project' }, { status: 500, headers });
    }
}
