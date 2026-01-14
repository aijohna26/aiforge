import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createClient } from '~/lib/supabase/server';

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        return json({ error: 'Method not allowed' }, { status: 405 });
    }

    const response = new Headers();
    const supabase = createClient(request, response);
    const { projectId, view } = await request.json<{ projectId: string; view: string }>();

    if (!projectId || !view) {
        return json({ error: 'Missing projectId or view' }, { status: 400 });
    }

    // Helper check for active session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
        .from('projects')
        .update({ last_view: view })
        .eq('id', projectId);

    if (error) {
        // Gracefully handle missing column (User hasn't run migration check)
        if (error.code === '42703') {
            console.warn('[Supabase] Missing last_view column in projects table. Skipping update.');
            return json({ success: true, warning: 'Schema mismatch: Run supabase_add_last_view.sql' }, { headers: response });
        }

        console.error('Failed to update project view:', error);
        return json({ success: false, error: error.message }, { status: 500, headers: response });
    }

    return json({ success: true }, { headers: response });
}
