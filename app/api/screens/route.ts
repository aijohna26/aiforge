import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/screens - Fetch all saved screens for the user
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

        const { data: screens, error } = await supabase
            .from('saved_screens')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Screens API] Fetch error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ screens });
    } catch (error) {
        console.error('[Screens API] Error:', error);
        return NextResponse.json(
            { error: "Failed to fetch screens" },
            { status: 500 }
        );
    }
}

// POST /api/screens - Save a new screen
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
        const { image_url, prompt, model, output_format, aspect_ratio } = body;

        if (!image_url || !prompt || !model) {
            return NextResponse.json(
                { error: "Missing required fields: image_url, prompt, model" },
                { status: 400 }
            );
        }

        const { data: screen, error } = await supabase
            .from('saved_screens')
            .insert({
                user_id: user.id,
                image_url,
                prompt,
                model,
                output_format,
                aspect_ratio,
            })
            .select()
            .single();

        if (error) {
            console.error('[Screens API] Insert error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ screen });
    } catch (error) {
        console.error('[Screens API] Error:', error);
        return NextResponse.json(
            { error: "Failed to save screen" },
            { status: 500 }
        );
    }
}

// DELETE /api/screens?id=<screen_id> - Delete a screen
export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const screenId = searchParams.get('id');

        if (!screenId) {
            return NextResponse.json(
                { error: "Screen ID required" },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('saved_screens')
            .delete()
            .eq('id', screenId)
            .eq('user_id', user.id); // Ensure user can only delete their own screens

        if (error) {
            console.error('[Screens API] Delete error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Screens API] Error:', error);
        return NextResponse.json(
            { error: "Failed to delete screen" },
            { status: 500 }
        );
    }
}
