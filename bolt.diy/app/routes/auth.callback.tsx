import { redirect, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { createClient } from '~/lib/supabase/server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/editor';

    if (code) {
        const response = new Headers();
        const supabase = createClient(request, response);

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return redirect(next, {
                headers: response,
            });
        }
    }

    // return the user to an error page with instructions
    return redirect('/?auth_error=true');
};
