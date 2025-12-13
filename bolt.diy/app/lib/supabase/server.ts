import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';

export function createClient(request: Request, responseHeaders: Headers) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return parseCookieHeader(request.headers.get('Cookie') ?? '');
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        responseHeaders.append('Set-Cookie', serializeCookieHeader(name, value, options));
                    });
                },
            },
        }
    );
}
