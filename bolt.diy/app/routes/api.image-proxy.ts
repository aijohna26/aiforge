import { json, type LoaderFunctionArgs } from '@remix-run/node';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return json({ error: 'Missing url parameter' }, { status: 400 });
    }

    let remoteUrl: URL;

    try {
      remoteUrl = new URL(targetUrl);
    } catch {
      return json({ error: 'Invalid url parameter' }, { status: 400 });
    }

    const response = await fetch(remoteUrl.toString(), {
      cache: 'no-store',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.error(`[Image Proxy] Failed to fetch. Status: ${response.status}, URL: ${remoteUrl.toString()}`);
      return json({ error: `Failed to fetch image: ${response.statusText}` }, { status: response.status || 500 });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();
    console.log('diy ==== api.image-proxy');

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch (error) {
    console.error('[Image Proxy] Error fetching image:', error);
    return json({ error: 'Unexpected error fetching image' }, { status: 500 });
  }
}
