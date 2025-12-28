import { json, type ActionFunctionArgs } from '@remix-run/node';
import { createClient } from '~/lib/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin =
  supabaseUrl && supabaseServiceKey ? createSupabaseAdminClient(supabaseUrl, supabaseServiceKey) : null;

/*
 * API endpoint to upload images to Supabase Storage and return HTTP URLs
 * POST /api/upload-image
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const headers = new Headers();

  try {
    const formData = (await request.formData()) as any;
    const imageFile = formData.get('image');

    if (!imageFile || !(imageFile instanceof File)) {
      return json({ error: "Please provide an 'image' file" }, { status: 400, headers });
    }

    // Prefer service role client for storage writes (bypasses RLS when user isn't signed in)
    const supabase = supabaseAdmin ?? createClient(request, headers);

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileName = `edited-images/${timestamp}-${randomStr}.png`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    console.log(`[Image Upload] Uploading to Supabase Storage: ${fileName}`);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images') // Using 'images' bucket which is correctly configured for public access
      .upload(fileName, fileBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Image Upload] Supabase upload error:', uploadError);
      throw new Error(`Failed to upload to storage: ${uploadError.message}`);
    }

    // Prefer signed URL when using service role (bucket might not be public)
    const buildAbsoluteUrl = (url?: string | null) => {
      if (!url) {
        return null;
      }

      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }

      if (supabaseUrl) {
        return `${supabaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
      }

      return url;
    };

    let imageUrl: string | null = null;
    const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
    imageUrl = buildAbsoluteUrl(publicUrlData.publicUrl);

    if (supabaseAdmin) {
      const { data: signedData, error: signedError } = await supabase.storage
        .from('images')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

      if (!signedError && signedData?.signedUrl) {
        imageUrl = buildAbsoluteUrl(signedData.signedUrl);
      }
    }

    if (!imageUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    console.log(`[Image Upload] Image uploaded successfully:`, imageUrl);

    return json(
      {
        success: true,
        url: imageUrl,
        message: 'Image uploaded successfully',
      },
      { headers },
    );
  } catch (error) {
    console.error('[Image Upload] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Image upload failed';

    return json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500, headers },
    );
  }
}
