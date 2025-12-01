import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/projects/:id/settings - Get project settings
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: project, error } = await supabase
            .from("projects")
            .select("settings")
            .eq("id", projectId)
            .eq("user_id", user.id)
            .single();

        if (error || !project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ settings: project.settings || {} });
    } catch (error) {
        console.error("Failed to get project settings:", error);
        return NextResponse.json(
            { error: "Failed to get project settings" },
            { status: 500 }
        );
    }
}

// PUT /api/projects/:id/settings - Update project settings
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { settings } = body;

        if (!settings || typeof settings !== 'object') {
            return NextResponse.json(
                { error: "Invalid settings data" },
                { status: 400 }
            );
        }

        const { data: project, error } = await supabase
            .from("projects")
            .update({ settings })
            .eq("id", projectId)
            .eq("user_id", user.id)
            .select("settings")
            .single();

        if (error || !project) {
            return NextResponse.json(
                { error: "Failed to update settings" },
                { status: 500 }
            );
        }

        return NextResponse.json({ settings: project.settings });
    } catch (error) {
        console.error("Failed to update project settings:", error);
        return NextResponse.json(
            { error: "Failed to update project settings" },
            { status: 500 }
        );
    }
}
