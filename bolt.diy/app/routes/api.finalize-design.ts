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

        const processUrl = async (url: string, pathPrefix: string) => {
            if (!url || url.includes('supabase.co')) return url;

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                const fileName = `${pathPrefix}/${generateId()}.png`;
                const { data, error } = await supabase.storage
                    .from('images')
                    .upload(fileName, buffer, {
                        contentType: 'image/png',
                        upsert: true
                    });

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('images')
                    .getPublicUrl(fileName);

                return publicUrl;
            } catch (error) {
                console.error(`Error processing image ${url}:`, error);
                return url;
            }
        };

        const newLogoUrl = logoUrl ? await processUrl(logoUrl, 'logos') : null;

        const newScreens = await Promise.all(screens.map(async (screen: any) => ({
            ...screen,
            url: await processUrl(screen.url, 'screens')
        })));

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
