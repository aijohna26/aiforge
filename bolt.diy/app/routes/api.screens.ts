import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { createClient } from "~/lib/supabase/server";

// GET /api/screens - Fetch all saved screens for the user
export async function loader({ request }: LoaderFunctionArgs) {
    const headers = new Headers();
    const supabase = createClient(request, headers);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return json(
            { error: "Authentication required" },
            { status: 401, headers }
        );
    }

    const { data: screens, error } = await supabase
        .from('saved_screens')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[Screens API] Fetch error:', error);
        return json(
            { error: error.message },
            { status: 500, headers }
        );
    }

    return json({ screens }, { headers });
}

// POST /api/screens - Save a new screen
// DELETE /api/screens?id=<screen_id> - Delete a screen
export async function action({ request }: ActionFunctionArgs) {
    const headers = new Headers();
    const supabase = createClient(request, headers);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return json(
            { error: "Authentication required" },
            { status: 401, headers }
        );
    }

    if (request.method === "POST") {
        try {
            const body = await request.json();
            const { image_url, prompt, model, output_format, aspect_ratio } = body;

            if (!image_url || !prompt || !model) {
                return json(
                    { error: "Missing required fields: image_url, prompt, model" },
                    { status: 400, headers }
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
                return json(
                    { error: error.message },
                    { status: 500, headers }
                );
            }

            return json({ screen }, { headers });
        } catch (error) {
            console.error('[Screens API] Error:', error);
            return json(
                { error: "Failed to save screen" },
                { status: 500, headers }
            );
        }
    } else if (request.method === "DELETE") {
        try {
            const { searchParams } = new URL(request.url);
            const screenId = searchParams.get('id');

            if (!screenId) {
                return json(
                    { error: "Screen ID required" },
                    { status: 400, headers }
                );
            }

            const { error } = await supabase
                .from('saved_screens')
                .delete()
                .eq('id', screenId)
                .eq('user_id', user.id);

            if (error) {
                console.error('[Screens API] Delete error:', error);
                return json(
                    { error: error.message },
                    { status: 500, headers }
                );
            }

            return json({ success: true }, { headers });
        } catch (error) {
            console.error('[Screens API] Error:', error);
            return json(
                { error: "Failed to delete screen" },
                { status: 500, headers }
            );
        }
    } else {
        return json({ error: "Method not allowed" }, { status: 405, headers });
    }
}
