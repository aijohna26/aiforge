import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node';
import { createClient } from '~/lib/supabase/server';

// GET /api/logos - Fetch all saved logos for the user
export async function loader({ request }: LoaderFunctionArgs) {
  const headers = new Headers();
  const supabase = createClient(request, headers);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return json({ error: 'Authentication required' }, { status: 401, headers });
  }

  const { data: logos, error } = await supabase
    .from('saved_logos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Logos API] Fetch error:', error);
    return json({ error: error.message }, { status: 500, headers });
  }

  return json({ logos }, { headers });
}

/*
 * POST /api/logos - Save a new logo
 * DELETE /api/logos?id=<logo_id> - Delete a logo
 */
export async function action({ request }: ActionFunctionArgs) {
  const headers = new Headers();
  const supabase = createClient(request, headers);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return json({ error: 'Authentication required' }, { status: 401, headers });
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { image_url, app_name, prompt } = body;

      if (!image_url) {
        return json({ error: 'Missing required fields: image_url' }, { status: 400, headers });
      }

      // Persist image to Supabase Storage
      const { uploadImageToSupabase } = await import('~/lib/utils/imageUpload');
      const finalizedImageUrl = await uploadImageToSupabase(supabase, image_url, 'images', 'logos');

      const { data: logo, error } = await supabase
        .from('saved_logos')
        .insert({
          user_id: user.id,
          image_url: finalizedImageUrl,
          app_name,
          prompt,
        })
        .select()
        .single();

      if (error) {
        console.error('[Logos API] Insert error:', error);
        return json({ error: error.message }, { status: 500, headers });
      }

      return json({ logo }, { headers });
    } catch (error) {
      console.error('[Logos API] Error:', error);
      return json({ error: 'Failed to save logo' }, { status: 500, headers });
    }
  } else if (request.method === 'DELETE') {
    try {
      const { searchParams } = new URL(request.url);
      const logoId = searchParams.get('id');

      if (!logoId) {
        return json({ error: 'Logo ID required' }, { status: 400, headers });
      }

      const { error } = await supabase.from('saved_logos').delete().eq('id', logoId).eq('user_id', user.id);

      if (error) {
        console.error('[Logos API] Delete error:', error);
        return json({ error: error.message }, { status: 500, headers });
      }

      return json({ success: true }, { headers });
    } catch (error) {
      console.error('[Logos API] Error:', error);
      return json({ error: 'Failed to delete logo' }, { status: 500, headers });
    }
  } else {
    return json({ error: 'Method not allowed' }, { status: 405, headers });
  }
}
