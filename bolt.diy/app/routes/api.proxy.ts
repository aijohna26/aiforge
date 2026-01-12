
import { type LoaderFunctionArgs } from '@remix-run/cloudflare';

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    const startTime = url.searchParams.get('startTime');
    const requestToken = url.searchParams.get('daytona_token');
    const debug = url.searchParams.get('debug') === '1';
    const showBanner = url.searchParams.get('debug') === '1' || url.searchParams.get('banner') === '1';

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
        let cleanedTargetUrl = targetUrl;
        let tokenFromTarget: string | null = null;
        try {
            const parsedTarget = new URL(targetUrl);
            tokenFromTarget =
                parsedTarget.searchParams.get('DAYTONA_SANDBOX_AUTH_KEY') ||
                parsedTarget.searchParams.get('daytona_token');
            parsedTarget.searchParams.delete('DAYTONA_SANDBOX_AUTH_KEY');
            parsedTarget.searchParams.delete('daytona_token');
            cleanedTargetUrl = parsedTarget.toString();
        } catch {
            // ignore target url parse failures
        }

        if (debug) {
            console.log(`[Proxy][debug] Fetching: ${targetUrl} (${Math.round(elapsed / 1000)}s elapsed)`);
        } else {
            console.log(`[Proxy] Fetching: ${targetUrl} (${Math.round(elapsed / 1000)}s elapsed)`);
        }

        // Safe headers forwarding
        const headers = new Headers();
        // Only forward Accept headers to be safe, avoid Host/Connection/Content-Length issues
        if (request.headers.get('accept')) headers.set('accept', request.headers.get('accept')!);
        if (request.headers.get('accept-language')) headers.set('accept-language', request.headers.get('accept-language')!);
        if (request.headers.get('user-agent')) headers.set('user-agent', request.headers.get('user-agent')!);

        // Bypass Daytona Preview Warning
        headers.set('X-Daytona-Skip-Preview-Warning', 'true');
        headers.set('X-Daytona-Disable-CORS', 'true');

        // Daytona auth: token should be sent as header for private previews
        const previewToken = requestToken || tokenFromTarget || request.headers.get('x-daytona-preview-token');
        if (previewToken) {
            headers.set('X-Daytona-Preview-Token', previewToken);
        }

        const response = await fetch(cleanedTargetUrl, {
            headers,
            redirect: 'follow',
            // Add timeout to prevent hanging (increased to 120s for initial bundle build)
            signal: AbortSignal.timeout(120000)
        });

        const contentType = response.headers.get('content-type') || '';
        const acceptsHtml = (request.headers.get('accept') || '').includes('text/html');
        if (debug) {
            console.log(
                `[Proxy][debug] Upstream: ${cleanedTargetUrl} -> ${response.status} ${response.statusText} (${contentType || 'no content-type'})`
            );
        }

        // If we got a successful response, forward it
        if (response.ok) {
            const newHeaders = new Headers(response.headers);
            if (debug) {
                newHeaders.set('X-Proxy-Debug', '1');
                newHeaders.set('X-Proxy-Upstream-Status', String(response.status));
            }
            newHeaders.delete('x-frame-options');
            newHeaders.delete('content-security-policy');
            newHeaders.delete('x-content-type-options');
            newHeaders.set('Access-Control-Allow-Origin', '*');
            newHeaders.set('Access-Control-Allow-Methods', '*');
            newHeaders.set('Access-Control-Allow-Headers', '*');

            if (contentType.includes('text/html') || acceptsHtml) {
                const html = await response.text();
                const rewritten = rewriteHtmlForProxy(
                    html,
                    cleanedTargetUrl,
                    previewToken,
                    showBanner,
                    response.status,
                    response.statusText
                );
                return new Response(rewritten, {
                    status: response.status,
                    headers: newHeaders,
                });
            }

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
                    <p style="opacity: 0.6; font-size: 0.8em">Waiting for port 8082</p>
                    <p class="timer">Timeout in ${remaining}s</p>
                </body>
            </html>
        `, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

function rewriteHtmlForProxy(
    html: string,
    targetUrl: string,
    requestToken: string | null,
    showBanner: boolean,
    status: number,
    statusText: string
) {
    const baseUrl = new URL(targetUrl);
    const baseToken = requestToken || baseUrl.searchParams.get('DAYTONA_SANDBOX_AUTH_KEY') || baseUrl.searchParams.get('daytona_token');
    const tokenParam = baseToken ? `&daytona_token=${encodeURIComponent(baseToken)}` : '';

    const toProxyUrl = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            return value;
        }
        const lower = trimmed.toLowerCase();
        if (lower.startsWith('data:') || lower.startsWith('mailto:') || lower.startsWith('javascript:')) {
            return value;
        }
        if (trimmed.startsWith('/api/proxy?url=')) {
            return value;
        }
        try {
            const resolved = new URL(trimmed, baseUrl);
            return `/api/proxy?url=${encodeURIComponent(resolved.toString())}${tokenParam}`;
        } catch {
            return value;
        }
    };

    const rewriteSrcset = (value: string) => {
        const parts = value.split(',').map((part) => {
            const trimmed = part.trim();
            if (!trimmed) {
                return part;
            }
            const [url, descriptor] = trimmed.split(/\s+/, 2);
            const proxied = toProxyUrl(url);
            return descriptor ? `${proxied} ${descriptor}` : proxied;
        });
        return parts.join(', ');
    };

    let updated = html.replace(/(src|href|poster)=["']([^"']+)["']/gi, (_match, attr, value) => {
        return `${attr}="${toProxyUrl(value)}"`;
    });

    updated = updated.replace(/srcset=["']([^"']+)["']/gi, (_match, value) => {
        return `srcset="${rewriteSrcset(value)}"`;
    });

    // Strip CSP meta tags that can block proxied script/style loading.
    updated = updated.replace(
        /<meta[^>]+http-equiv=["']Content-Security-Policy(?:-Report-Only)?["'][^>]*>/gi,
        ''
    );

    if (!showBanner) {
        return updated;
    }

    const banner = `
      <div style="position:fixed;z-index:2147483647;top:10px;left:10px;right:10px;padding:8px 12px;background:#111;color:#fff;border-radius:6px;font:12px/1.4 system-ui, sans-serif;box-shadow:0 6px 18px rgba(0,0,0,0.2);">
        Proxy Debug: ${status} ${statusText} → ${targetUrl}
      </div>
    `;

    if (updated.includes('<body')) {
        updated = updated.replace(/<body[^>]*>/i, (match) => `${match}${banner}`);
    } else {
        updated = `${banner}${updated}`;
    }

    return updated;
}
