// Utility to migrate old AI URLs to permanent Supabase Storage
export async function migrateImageToSupabase(url: string): Promise<string> {
    if (!url) return url;

    // Already a Supabase URL
    if (url.includes('supabase.co')) {
        console.log('[Migration] Already Supabase URL:', url);
        return url;
    }

    // Data URLs and blobs don't need migration
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/api/image-proxy')) {
        console.log('[Migration] Skipping migration for:', url.substring(0, 50));
        return url;
    }

    try {
        console.log('[Migration] Migrating URL:', url);

        // Fetch the image through proxy
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);

        if (!response.ok) {
            console.error('[Migration] Failed to fetch image:', response.status);
            throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const blob = await response.blob();
        const formData = new FormData();
        formData.append('image', blob, 'migrated-image.png');

        const uploadResponse = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
        });

        if (!uploadResponse.ok) {
            console.error('[Migration] Failed to upload image');
            throw new Error('Failed to upload image');
        }

        const data = await uploadResponse.json();

        if (data.success && data.url) {
            console.log('[Migration] Successfully migrated to:', data.url);
            return data.url;
        }

        throw new Error('Upload did not return a valid URL');
    } catch (error) {
        console.error('[Migration] Failed to migrate image:', error);
        // Return original URL as fallback
        return url;
    }
}
