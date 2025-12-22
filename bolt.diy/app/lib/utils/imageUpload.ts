import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Downloads an image from a URL and uploads it to Supabase Storage.
 * returns the public URL of the uploaded image.
 */
export async function uploadImageToSupabase(
    supabase: SupabaseClient,
    url: string,
    bucket: string,
    pathPrefix: string
): Promise<string> {
    if (!url || url.includes('supabase.co')) {
        return url;
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (AppForge)'
            },
            redirect: 'follow'
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch image from URL: ${url} (Status: ${response.status})`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const extension = url.split('.').pop()?.split('?')[0] || 'png';
        const fileName = `${pathPrefix}/${generateId()}.${extension}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, buffer, {
                contentType: `image/${extension === 'png' ? 'png' : 'jpeg'}`,
                upsert: true
            });

        if (error) {
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error(`[ImageUpload] Error processing image ${url}:`, error);
        return url; // Fallback to original URL on failure
    }
}
