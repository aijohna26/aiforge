import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/logos - Fetch all saved logos for the user
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

        const { data: logos, error } = await supabase
            .from('saved_logos')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Logos API] Fetch error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ logos });
    } catch (error) {
        console.error('[Logos API] Error:', error);
        return NextResponse.json(
            { error: "Failed to fetch logos" },
            { status: 500 }
        );
    }
}

// POST /api/logos - Save a new logo
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            // Fallback for dev/test without auth - check if userId is provided in body
            // This is temporary until full auth is implemented
            const body = await req.clone().json();
            if (body.userId === 'test-user') {
                // Allow test-user for now, but we can't save to supabase with RLS if we don't have a real user
                // Unless we use a service role client, but let's stick to the pattern.
                // If RLS is on, we need a real user.
                // For now, let's return 401 if no real user, but maybe the user IS logged in.
            }

            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { image_url, app_name, prompt } = body;

        if (!image_url) {
            return NextResponse.json(
                { error: "Missing required fields: image_url" },
                { status: 400 }
            );
        }

        const { data: logo, error } = await supabase
            .from('saved_logos')
            .insert({
                user_id: user.id,
                image_url,
                app_name,
                prompt,
            })
            .select()
            .single();

        if (error) {
            console.error('[Logos API] Insert error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ logo });
    } catch (error) {
        console.error('[Logos API] Error:', error);
        return NextResponse.json(
            { error: "Failed to save logo" },
            { status: 500 }
        );
    }
}

// DELETE /api/logos?id=<logo_id> - Delete a logo
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
        const logoId = searchParams.get('id');

        if (!logoId) {
            return NextResponse.json(
                { error: "Logo ID required" },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('saved_logos')
            .delete()
            .eq('id', logoId)
            .eq('user_id', user.id);

        if (error) {
            console.error('[Logos API] Delete error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Logos API] Error:', error);
        return NextResponse.json(
            { error: "Failed to delete logo" },
            { status: 500 }
        );
    }
}
