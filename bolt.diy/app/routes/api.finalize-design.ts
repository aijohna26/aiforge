import { json, type ActionFunctionArgs } from '@remix-run/node';
import { createClient } from '~/lib/supabase/server';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const headers = new Headers();
  const supabase = createClient(request, headers);

  try {
    const body = await request.json();
    console.log('[Finalize Design] Received request:', {
      hasLogoUrl: !!body.logoUrl,
      screensCount: body.screens?.length || 0,
      bodyKeys: Object.keys(body),
    });

    const { logoUrl, screens } = body;

    if (!screens || screens.length === 0) {
      console.error('[Finalize Design] No screens provided');
      return json(
        {
          success: false,
          error: 'No screens provided',
        },
        { status: 400, headers },
      );
    }

    const { uploadImageToSupabase } = await import('~/lib/utils/imageUpload');

    const urlObj = new URL(request.url);
    const origin = urlObj.origin;

    const getAbsoluteUrl = (u: string) => (u && u.startsWith('/') ? `${origin}${u}` : u);

    console.log('[Finalize Design] Uploading logo...');

    const newLogoUrl = logoUrl
      ? await uploadImageToSupabase(supabase, getAbsoluteUrl(logoUrl), 'images', 'logos')
      : null;
    console.log('[Finalize Design] Logo uploaded:', { newLogoUrl });

    console.log('[Finalize Design] Uploading screens...');

    const newScreens = await Promise.all(
      screens.map(async (screen: any, index: number) => {
        try {
          console.log(`[Finalize Design] Uploading screen ${index + 1}/${screens.length}:`, screen.name || screen.id);

          // Mirror the main screen URL
          const mainUrl = await uploadImageToSupabase(supabase, getAbsoluteUrl(screen.url), 'images', 'screens');

          // NEW: Mirror all variation URLs
          const variations = await Promise.all(
            (screen.variations || []).map(async (v: any, vIndex: number) => {
              console.log(`[Finalize Design]   Uploading variation ${vIndex + 1} for screen ${index + 1}`);
              return {
                ...v,
                url: await uploadImageToSupabase(supabase, getAbsoluteUrl(v.url), 'images', 'variations'),
              };
            }),
          );

          console.log(`[Finalize Design] Screen ${index + 1} uploaded successfully`);

          return {
            ...screen,
            url: mainUrl,
            variations,
          };
        } catch (screenError) {
          console.error(`[Finalize Design] Failed to upload screen ${index + 1}:`, screenError);
          throw screenError;
        }
      }),
    );

    console.log('[Finalize Design] All uploads successful');

    return json(
      {
        success: true,
        logoUrl: newLogoUrl,
        screens: newScreens,
      },
      { headers },
    );
  } catch (error) {
    console.error('[Finalize Design] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to finalize design';

    return json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500, headers },
    );
  }
}
