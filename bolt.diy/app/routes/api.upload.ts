import {
  json,
  type ActionFunctionArgs,
  unstable_parseMultipartFormData,
  unstable_createMemoryUploadHandler,
} from '@remix-run/node';
import { createClient } from '~/lib/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin =
  supabaseUrl && supabaseServiceKey ? createSupabaseAdminClient(supabaseUrl, supabaseServiceKey) : null;

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const headers = new Headers();

  try {
    // Use memory upload handler for file processing
    const uploadHandler = unstable_createMemoryUploadHandler({
      maxPartSize: 10 * 1024 * 1024, // 10MB
    });

    const formData = await unstable_parseMultipartFormData(request, uploadHandler);
    const file = formData.get('file') as File;

    if (!file) {
      return json({ error: 'No file provided' }, { status: 400, headers });
    }

    // Validate file type - Kie.ai accepts: image/jpeg, image/png, image/webp
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    if (!validTypes.includes(file.type)) {
      return json(
        {
          error: `Invalid file type: ${file.type}. Accepted types: image/jpeg, image/png, image/webp`,
        },
        { status: 400, headers },
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      return json(
        {
          error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max size: 10MB`,
        },
        { status: 400, headers },
      );
    }

    console.log(`[Upload] Uploading file: ${file.name}, type: ${file.type}, size: ${(file.size / 1024).toFixed(2)}KB`);

    // Try Supabase first
    try {
      const supabase = supabaseAdmin ?? createClient(request, headers);
      const filename = `temp/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

      // Convert File to ArrayBuffer/Buffer for Supabase upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data, error } = await supabase.storage.from('images').upload(filename, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

      if (!error) {
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

        const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(filename);
        let publicUrl = buildAbsoluteUrl(publicUrlData.publicUrl);

        if (supabaseAdmin) {
          const { data: signedData, error: signedError } = await supabase.storage
            .from('images')
            .createSignedUrl(filename, 60 * 60 * 24 * 365);

          if (!signedError && signedData?.signedUrl) {
            publicUrl = buildAbsoluteUrl(signedData.signedUrl);
          }
        }

        console.log(`[Upload] ✅ Uploaded to Supabase: ${publicUrl}`);

        return json({ url: publicUrl, provider: 'supabase' }, { headers });
      }

      console.warn(`[Upload] Supabase failed, trying ImgBB fallback:`, error);
    } catch (supabaseError) {
      console.warn(`[Upload] Supabase error, trying ImgBB fallback:`, supabaseError);
    }

    // Fallback to ImgBB
    const imgbbApiKey = process.env.IMGBB_API_KEY;

    if (!imgbbApiKey) {
      return json(
        {
          error: 'Upload failed: Supabase unavailable and ImgBB not configured',
        },
        { status: 500, headers },
      );
    }

    console.log(`[Upload] Trying ImgBB fallback...`);

    const imgbbFormData = new FormData();

    /*
     * Convert back to Blob/File for fetch if needed, or just pass the file object if environment supports it
     * In Node environment, we might need to handle this differently, but standard FormData with Blob should work
     * However, the 'file' from parseMultipartFormData is a Node File object which works with fetch
     */
    imgbbFormData.append('image', file);

    const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
      method: 'POST',
      body: imgbbFormData,
    });

    if (!imgbbResponse.ok) {
      const errorText = await imgbbResponse.text();
      console.error('[Upload] ImgBB error:', errorText);

      return json(
        {
          error: 'Both Supabase and ImgBB uploads failed',
        },
        { status: 500, headers },
      );
    }

    const imgbbData = await imgbbResponse.json();

    if (imgbbData.success && imgbbData.data?.url) {
      console.log(`[Upload] ✅ Uploaded to ImgBB: ${imgbbData.data.url}`);
      return json(
        {
          url: imgbbData.data.url,
          provider: 'imgbb',
        },
        { headers },
      );
    }

    return json(
      {
        error: 'Upload failed: Invalid response from ImgBB',
      },
      { status: 500, headers },
    );
  } catch (error) {
    console.error('Upload handler error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return json(
      { error: errorMessage, details: error instanceof Error ? error.stack : String(error) },
      { status: 500, headers },
    );
  }
}
