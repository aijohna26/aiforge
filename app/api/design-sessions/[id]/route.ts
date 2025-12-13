import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/design-sessions/[id] - Fetch a specific design session with screens
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const sessionId = params.id;

        // Fetch session
        const { data: session, error: sessionError } = await supabase
            .from('design_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .single();

        if (sessionError) {
            console.error('[Design Session API] Fetch error:', sessionError);
            return NextResponse.json(
                { error: sessionError.message },
                { status: 500 }
            );
        }

        if (!session) {
            return NextResponse.json(
                { error: "Design session not found" },
                { status: 404 }
            );
        }

        // Fetch screens for this session
        const { data: screens, error: screensError } = await supabase
            .from('design_session_screens')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (screensError) {
            console.error('[Design Session API] Screens fetch error:', screensError);
            // Don't fail the request if screens fail to load
        }

        return NextResponse.json({
            session,
            screens: screens || [],
        });
    } catch (error) {
        console.error('[Design Session API] Error:', error);
        return NextResponse.json(
            { error: "Failed to fetch design session" },
            { status: 500 }
        );
    }
}

// PATCH /api/design-sessions/[id] - Update a design session
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const sessionId = params.id;
        const body = await req.json();

        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        // Only update provided fields
        if (body.session_name !== undefined) updateData.session_name = body.session_name;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.current_stage !== undefined) updateData.current_stage = body.current_stage;
        if (body.app_name !== undefined) updateData.app_name = body.app_name;
        if (body.app_description !== undefined) updateData.app_description = body.app_description;
        if (body.app_category !== undefined) updateData.app_category = body.app_category;
        if (body.target_audience !== undefined) updateData.target_audience = body.target_audience;
        if (body.brand_colors !== undefined) updateData.brand_colors = body.brand_colors;
        if (body.style_preferences !== undefined) updateData.style_preferences = body.style_preferences;
        if (body.reference_images !== undefined) updateData.reference_images = body.reference_images;
        if (body.selected_package !== undefined) {
            updateData.selected_package = body.selected_package;
            const packageCosts = { basic: 0, complete: 100, premium: 250 };
            updateData.package_cost = packageCosts[body.selected_package as keyof typeof packageCosts];

            // Add AI cost if enabled
            if (body.ai_config?.enabled) {
                updateData.package_cost += 50;
            }
        }
        if (body.ai_config !== undefined) updateData.ai_config = body.ai_config;
        if (body.logo_url !== undefined) updateData.logo_url = body.logo_url;
        if (body.logo_prompt !== undefined) updateData.logo_prompt = body.logo_prompt;
        if (body.prd_data !== undefined) updateData.prd_data = body.prd_data;
        if (body.generation_settings !== undefined) updateData.generation_settings = body.generation_settings;
        if (body.generated_code_url !== undefined) updateData.generated_code_url = body.generated_code_url;
        if (body.credits_used !== undefined) updateData.credits_used = body.credits_used;
        if (body.total_screens_generated !== undefined) updateData.total_screens_generated = body.total_screens_generated;

        const { data: session, error } = await supabase
            .from('design_sessions')
            .update(updateData)
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('[Design Session API] Update error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ session });
    } catch (error) {
        console.error('[Design Session API] Error:', error);
        return NextResponse.json(
            { error: "Failed to update design session" },
            { status: 500 }
        );
    }
}

// DELETE /api/design-sessions/[id] - Delete a design session
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const sessionId = params.id;

        // Delete the session (cascading will delete screens and history)
        const { error } = await supabase
            .from('design_sessions')
            .delete()
            .eq('id', sessionId)
            .eq('user_id', user.id);

        if (error) {
            console.error('[Design Session API] Delete error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Design Session API] Error:', error);
        return NextResponse.json(
            { error: "Failed to delete design session" },
            { status: 500 }
        );
    }
}
