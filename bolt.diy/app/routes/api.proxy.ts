
import { type LoaderFunctionArgs } from '@remix-run/cloudflare';

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    const startTime = url.searchParams.get('startTime');

    if (!targetUrl) {
        return new Response('Missing target URL', { status: 400 });
    }

    // Track start time for 3-minute timeout
    const now = Date.now();
    const actualStartTime = startTime ? parseInt(startTime, 10) : now;
    const elapsed = now - actualStartTime;
    const TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

    // Check if we've exceeded the timeout
    if (elapsed > TIMEOUT_MS) {
        console.error(`[Proxy] Timeout exceeded (${Math.round(elapsed / 1000)}s). Giving up on ${targetUrl}`);
        return new Response(`
            <html>
                <head>
                    <style>
                        body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0f0f0f; color: #fff; margin: 0; text-align: center; padding: 20px; }
                        .error-icon { font-size: 48px; margin-bottom: 20px; }
                        h1 { font-size: 24px; margin-bottom: 10px; }
                        p { opacity: 0.7; margin: 5px 0; }
                        .details { background: #1a1a1a; padding: 15px; border-radius: 8px; margin-top: 20px; font-family: monospace; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="error-icon">⏱️</div>
                    <h1>Preview Timeout</h1>
                    <p>Unable to start preview after 3 minutes</p>
                    <div class="details">
                        <div>The development server failed to start.</div>
                        <div style="margin-top: 10px; opacity: 0.5;">Check the terminal for errors.</div>
                    </div>
                </body>
            </html>
        `, {
            status: 504,
            headers: { 'Content-Type': 'text/html' }
        });
    }

    try {
        console.log(`[Proxy] Fetching: ${targetUrl} (${Math.round(elapsed / 1000)}s elapsed)`);

        // Safe headers forwarding
        const headers = new Headers();
        // Only forward Accept headers to be safe, avoid Host/Connection/Content-Length issues
        if (request.headers.get('accept')) headers.set('accept', request.headers.get('accept')!);
        if (request.headers.get('accept-language')) headers.set('accept-language', request.headers.get('accept-language')!);
        if (request.headers.get('user-agent')) headers.set('user-agent', request.headers.get('user-agent')!);

        const response = await fetch(targetUrl, {
            headers,
            redirect: 'follow',
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(10000)
        });

        // If we got a successful response, forward it
        if (response.ok) {
            const newHeaders = new Headers(response.headers);
            newHeaders.delete('x-frame-options');
            newHeaders.delete('content-security-policy');
            newHeaders.delete('x-content-type-options');
            newHeaders.set('Access-Control-Allow-Origin', '*');
            newHeaders.set('Access-Control-Allow-Methods', '*');
            newHeaders.set('Access-Control-Allow-Headers', '*');

            return new Response(response.body, {
                status: response.status,
                headers: newHeaders,
            });
        } else {
            // Log non-OK responses for debugging
            console.error(`[Proxy] Non-OK response: ${response.status} ${response.statusText}`);
            throw new Error(`Upstream returned ${response.status}`);
        }

    } catch (error: any) {
        console.error(`[Proxy] Error fetching ${targetUrl}:`, error.message || error);

        // Calculate time remaining
        const remaining = Math.max(0, Math.round((TIMEOUT_MS - elapsed) / 1000));

        // Return 200 with auto-refresh page to keep trying (with startTime preserved)
        const refreshUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}&startTime=${actualStartTime}`;
        return new Response(`
            <html>
                <head>
                    <meta http-equiv="refresh" content="2; url=${refreshUrl}">
                    <style>
                        body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0f0f0f; color: #fff; margin: 0; }
                        .loader { border: 4px solid #333; border-top: 4px solid #fff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        .timer { opacity: 0.5; font-size: 12px; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="loader"></div>
                    <p>Starting Preview...</p>
                    <p style="opacity: 0.6; font-size: 0.8em">Waiting for port 8081</p>
                    <p class="timer">Timeout in ${remaining}s</p>
                </body>
            </html>
        `, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
    }
}
