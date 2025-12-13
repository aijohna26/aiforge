import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/design-sessions - Fetch all design sessions for the user
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { data: sessions, error } = await supabase
            .from('design_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('[Design Sessions API] Fetch error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error('[Design Sessions API] Error:', error);
        return NextResponse.json(
            { error: "Failed to fetch design sessions" },
            { status: 500 }
        );
    }
}

// POST /api/design-sessions - Create or update a design session
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const {
            session_id,
            session_name,
            app_name,
            app_description,
            app_category,
            target_audience,
            brand_colors,
            selected_package,
            ai_config,
            style_preferences,
            logo_url,
            current_stage,
        } = body;

        // If session_id is provided, update existing session
        if (session_id) {
            const updateData: any = {
                updated_at: new Date().toISOString(),
            };

            // Only update provided fields
            if (session_name !== undefined) updateData.session_name = session_name;
            if (app_name !== undefined) updateData.app_name = app_name;
            if (app_description !== undefined) updateData.app_description = app_description;
            if (app_category !== undefined) updateData.app_category = app_category;
            if (target_audience !== undefined) updateData.target_audience = target_audience;
            if (brand_colors !== undefined) updateData.brand_colors = brand_colors;
            if (selected_package !== undefined) {
                updateData.selected_package = selected_package;
                // Calculate package cost
                const packageCosts = { basic: 0, complete: 100, premium: 250 };
                updateData.package_cost = packageCosts[selected_package as keyof typeof packageCosts];

                // Add AI cost if enabled
                if (ai_config?.enabled) {
                    updateData.package_cost += 50;
                }
            }
            if (ai_config !== undefined) updateData.ai_config = ai_config;
            if (style_preferences !== undefined) updateData.style_preferences = style_preferences;
            if (logo_url !== undefined) updateData.logo_url = logo_url;
            if (current_stage !== undefined) updateData.current_stage = current_stage;

            const { data: session, error } = await supabase
                .from('design_sessions')
                .update(updateData)
                .eq('id', session_id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) {
                console.error('[Design Sessions API] Update error:', error);
                return NextResponse.json(
                    { error: error.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({ session });
        }

        // Create new session
        if (!session_name || !app_name) {
            return NextResponse.json(
                { error: "Missing required fields: session_name, app_name" },
                { status: 400 }
            );
        }

        // Calculate package cost
        const packageCosts = { basic: 0, complete: 100, premium: 250 };
        let packageCost = selected_package ? packageCosts[selected_package as keyof typeof packageCosts] : 0;

        // Add AI cost if enabled
        if (ai_config?.enabled) {
            packageCost += 50;
        }

        const { data: session, error } = await supabase
            .from('design_sessions')
            .insert({
                user_id: user.id,
                session_name,
                status: 'draft',
                current_stage: current_stage || 1,
                app_name,
                app_description,
                app_category,
                target_audience,
                brand_colors,
                selected_package,
                package_cost: packageCost,
                ai_config,
                style_preferences,
                logo_url,
                credits_used: 0,
                total_screens_generated: 0,
            })
            .select()
            .single();

        if (error) {
            console.error('[Design Sessions API] Insert error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        // Create history entry for session creation
        await supabase
            .from('design_session_history')
            .insert({
                session_id: session.id,
                action: 'session_created',
                stage: 1,
                details: { app_name, selected_package },
            });

        return NextResponse.json({ session });
    } catch (error) {
        console.error('[Design Sessions API] Error:', error);
        return NextResponse.json(
            { error: "Failed to save design session" },
            { status: 500 }
        );
    }
}
