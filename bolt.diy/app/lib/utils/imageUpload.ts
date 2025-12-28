import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Downloads an image from a URL and uploads it to Supabase Storage.
 * returns the public URL of the uploaded image.
 */
export async function uploadImageToSupabase(
  supabase: SupabaseClient,
  url: string,
  bucket: string,
  pathPrefix: string,
): Promise<string> {
  if (!url || url.includes('supabase.co')) {
    return url;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (AppForge)',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${url} (Status: ${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const extension = url.split('.').pop()?.split('?')[0] || 'png';
    const fileName = `${pathPrefix}/${generateId()}.${extension}`;

    const { data, error } = await supabase.storage.from(bucket).upload(fileName, buffer, {
      contentType: `image/${extension === 'png' ? 'png' : 'jpeg'}`,
      upsert: true,
    });

    if (error) {
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    // Verify public URL accessibility
    try {
      const verifyResponse = await fetch(publicUrl, { method: 'HEAD' });

      if (!verifyResponse.ok) {
        console.warn(
          `[ImageUpload] Uploaded image is not publicly accessible (Status: ${verifyResponse.status}). Bucket '${bucket}' might not be public. Falling back to original URL.`,
        );

        /*
         * If the check fails, we presume the bucket is private or the file is missing.
         * We return the original URL so the user at least sees the image.
         */
        return url;
      }
    } catch (verifyError) {
      console.warn(`[ImageUpload] Failed to verify public URL accessibility:`, verifyError);
      return url;
    }

    return publicUrl;
  } catch (error) {
    console.error(`[ImageUpload] Error processing image ${url}:`, error);
    return url; // Fallback to original URL on failure
  }
}
