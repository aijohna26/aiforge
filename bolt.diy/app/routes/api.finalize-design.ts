import { json, type ActionFunctionArgs } from "@remix-run/node";
import { createClient } from "~/lib/supabase/server";

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, { status: 405 });
    }

    const headers = new Headers();
    const supabase = createClient(request, headers);

    try {
        const { logoUrl, screens } = await request.json();
        const { uploadImageToSupabase } = await import("~/lib/utils/imageUpload");

        const urlObj = new URL(request.url);
        const origin = urlObj.origin;

        const getAbsoluteUrl = (u: string) => (u && u.startsWith('/') ? `${origin}${u}` : u);

        const newLogoUrl = logoUrl ? await uploadImageToSupabase(supabase, getAbsoluteUrl(logoUrl), 'images', 'logos') : null;

        const newScreens = await Promise.all(screens.map(async (screen: any) => {
            // Mirror the main screen URL
            const mainUrl = await uploadImageToSupabase(supabase, getAbsoluteUrl(screen.url), 'images', 'screens');

            // NEW: Mirror all variation URLs
            const variations = await Promise.all((screen.variations || []).map(async (v: any) => ({
                ...v,
                url: await uploadImageToSupabase(supabase, getAbsoluteUrl(v.url), 'images', 'variations')
            })));

            return {
                ...screen,
                url: mainUrl,
                variations
            };
        }));

        return json({
            success: true,
            logoUrl: newLogoUrl,
            screens: newScreens
        }, { headers });
    } catch (error) {
        console.error('Finalize design error:', error);
        return json({ success: false, error: 'Failed to finalize design' }, { status: 500, headers });
    }
}
