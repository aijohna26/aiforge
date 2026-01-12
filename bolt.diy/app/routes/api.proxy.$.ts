import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from '@remix-run/cloudflare';

export async function loader({ request, params }: LoaderFunctionArgs) {
  return handleProxyRequest(request, params['*']);
}

export async function action({ request, params }: ActionFunctionArgs) {
  return handleProxyRequest(request, params['*']);
}

async function handleProxyRequest(request: Request, splat: string | undefined) {
  if (!splat) {
    return json({ error: 'Missing proxy target' }, { status: 400 });
  }

  const requestUrl = new URL(request.url);
  const debug = requestUrl.searchParams.get('debug') === '1';
  const requestToken = requestUrl.searchParams.get('daytona_token');
  const showBanner = requestUrl.searchParams.get('debug') === '1' || requestUrl.searchParams.get('banner') === '1';

  const [encodedBase, ...rest] = splat.split('/');
  const decodedBase = decodeBase64Url(encodedBase);

  if (!decodedBase) {
    return json({ error: 'Invalid proxy target encoding' }, { status: 400 });
  }

  let baseUrl: URL;
  let tokenFromBase: string | null = null;
  try {
    baseUrl = new URL(decodedBase);
    tokenFromBase =
      baseUrl.searchParams.get('DAYTONA_SANDBOX_AUTH_KEY') || baseUrl.searchParams.get('daytona_token');
    baseUrl.searchParams.delete('DAYTONA_SANDBOX_AUTH_KEY');
    baseUrl.searchParams.delete('daytona_token');
  } catch {
    return json({ error: 'Invalid proxy base URL' }, { status: 400 });
  }

  const targetUrl = new URL(rest.join('/'), baseUrl);
  const passthroughParams = new URLSearchParams(requestUrl.search);
  passthroughParams.delete('daytona_token');
  passthroughParams.delete('debug');

  if (passthroughParams.toString()) {
    targetUrl.search = passthroughParams.toString();
  }

  const headers = new Headers();
  if (request.headers.get('accept')) headers.set('accept', request.headers.get('accept')!);
  if (request.headers.get('accept-language')) headers.set('accept-language', request.headers.get('accept-language')!);
  if (request.headers.get('user-agent')) headers.set('user-agent', request.headers.get('user-agent')!);

  headers.set('X-Daytona-Skip-Preview-Warning', 'true');
  headers.set('X-Daytona-Disable-CORS', 'true');

  const previewToken = requestToken || tokenFromBase || request.headers.get('x-daytona-preview-token');
  if (previewToken) {
    headers.set('X-Daytona-Preview-Token', previewToken);
  }

  if (debug) {
    console.log(`[ProxyPath][debug] Fetching: ${targetUrl.toString()}`);
  } else {
    console.log(`[ProxyPath] Fetching: ${targetUrl.toString()}`);
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(120000),
    });

    const contentType = response.headers.get('content-type') || '';
    const acceptsHtml = (request.headers.get('accept') || '').includes('text/html');
    if (debug) {
      console.log(`[ProxyPath][debug] Upstream: ${response.status} ${response.statusText} (${contentType || 'none'})`);
    }

    const newHeaders = new Headers(response.headers);
    newHeaders.delete('x-frame-options');
    newHeaders.delete('content-security-policy');
    newHeaders.delete('x-content-type-options');
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', '*');
    newHeaders.set('Access-Control-Allow-Headers', '*');
    if (debug) {
      newHeaders.set('X-Proxy-Debug', '1');
      newHeaders.set('X-Proxy-Upstream-Status', String(response.status));
    }

    if (response.ok && (contentType.includes('text/html') || acceptsHtml)) {
      const html = await response.text();
      const proxyPrefix = `/api/proxy/${encodedBase}/`;
      const rewritten = rewriteHtmlForPathProxy(
        html,
        baseUrl,
        proxyPrefix,
        showBanner,
        response.status,
        response.statusText,
      );
      return new Response(rewritten, { status: response.status, headers: newHeaders });
    }

    return new Response(response.body, { status: response.status, headers: newHeaders });
  } catch (error: any) {
    console.error('[ProxyPath] Error fetching', error?.message || error);
    return new Response('Proxy error', { status: 502 });
  }
}

function decodeBase64Url(value: string) {
  try {
    let base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) {
      base64 += '='.repeat(4 - pad);
    }
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

function rewriteHtmlForPathProxy(
  html: string,
  baseUrl: URL,
  proxyPrefix: string,
  showBanner: boolean,
  status: number,
  statusText: string,
) {
  const baseOrigin = baseUrl.origin;

  const toProxyUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return value;
    }
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('data:') || lower.startsWith('mailto:') || lower.startsWith('javascript:')) {
      return value;
    }
    if (trimmed.startsWith(proxyPrefix) || trimmed.startsWith('/api/proxy/')) {
      return value;
    }
    if (lower.startsWith('http://') || lower.startsWith('https://')) {
      try {
        const abs = new URL(trimmed);
        if (abs.origin === baseOrigin) {
          return `${proxyPrefix}${abs.pathname.replace(/^\//, '')}${abs.search}${abs.hash}`;
        }
        return value;
      } catch {
        return value;
      }
    }
    if (trimmed.startsWith('/')) {
      return `${proxyPrefix}${trimmed.slice(1)}`;
    }
    return `${proxyPrefix}${trimmed}`;
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

  updated = updated.replace(
    /<meta[^>]+http-equiv=["']Content-Security-Policy(?:-Report-Only)?["'][^>]*>/gi,
    '',
  );

  const proxyScript = `
    <script>
      (function() {
        var PROXY_PREFIX = ${JSON.stringify(proxyPrefix)};
        var BASE_ORIGIN = ${JSON.stringify(baseOrigin)};
        function rewrite(url) {
          if (!url || typeof url !== 'string') return url;
          if (url.startsWith(PROXY_PREFIX) || url.startsWith('/api/proxy/')) return url;
          if (url.startsWith('ws:') || url.startsWith('wss:')) return url;
          try {
            var abs = new URL(url, BASE_ORIGIN);
            if (abs.origin === BASE_ORIGIN) {
              return PROXY_PREFIX + abs.pathname.replace(/^\\//, '') + abs.search + abs.hash;
            }
          } catch (e) {}
          if (url.startsWith('/')) {
            return PROXY_PREFIX + url.slice(1);
          }
          return url;
        }
        var origFetch = window.fetch;
        if (origFetch) {
          window.fetch = function(input, init) {
            var nextUrl = typeof input === 'string' ? rewrite(input) : rewrite(input.url);
            if (typeof input === 'string') return origFetch(nextUrl, init);
            return origFetch(new Request(nextUrl, input), init);
          };
        }
        var origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
          var args = Array.prototype.slice.call(arguments);
          args[1] = rewrite(String(url));
          return origOpen.apply(this, args);
        };
      })();
    </script>
  `;

  if (updated.includes('<head>')) {
    updated = updated.replace('<head>', `<head><base href="${proxyPrefix}">${proxyScript}`);
  } else {
    updated = `${proxyScript}${updated}`;
  }

  if (!showBanner) {
    return updated;
  }

  const banner = `
    <div style="position:fixed;z-index:2147483647;top:10px;left:10px;right:10px;padding:8px 12px;background:#111;color:#fff;border-radius:6px;font:12px/1.4 system-ui, sans-serif;box-shadow:0 6px 18px rgba(0,0,0,0.2);">
      Proxy Debug: ${status} ${statusText} → ${baseUrl.toString()}
    </div>
  `;

  if (updated.includes('<body')) {
    updated = updated.replace(/<body[^>]*>/i, (match) => `${match}${banner}`);
  } else {
    updated = `${banner}${updated}`;
  }

  return updated;
}
