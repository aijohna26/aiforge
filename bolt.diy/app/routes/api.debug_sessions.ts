import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { createClient } from '~/lib/supabase/server';

export async function loader({ request }: LoaderFunctionArgs) {
    const responseHeaders = new Headers();
    const supabase = createClient(request, responseHeaders);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return json({ error: 'Not logged in' });
    }

    // Fetch ALL workspaces for this user
    const { data: workspaces, error } = await supabase
        .from('studio_workspaces')
        .select('id, project_id, snapshot_hash, updated_at, frames')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

    if (error) {
        return json({ error: error.message });
    }

    // Simplify output for reading
    const summary = workspaces.map(ws => ({
        id: ws.id,
        project_id: ws.project_id,
        updated_at: new Date(ws.updated_at).toLocaleString(),
        frame_count: Array.isArray(ws.frames) ? ws.frames.length : 0,
        hash_start: ws.snapshot_hash?.substring(0, 8)
    }));

    return json({ summary, total: summary.length }, { headers: responseHeaders });
}
