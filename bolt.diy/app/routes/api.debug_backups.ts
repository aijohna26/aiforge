import { json } from '@remix-run/cloudflare';
import { createClient } from '~/lib/supabase/server';

export const loader = async ({ request }) => {
    const responseHeaders = new Headers();
    const supabase = createClient(request, responseHeaders);

    const { data: backups, error } = await supabase
        .from('studio_workspaces')
        .select('id, created_at, frames, project_id')
        .eq('project_id', 'default')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) return json({ error });

    const summary = backups.map(b => ({
        id: b.id,
        created: b.created_at,
        frameCount: Array.isArray(b.frames) ? b.frames.length : 'invalid'
    }));

    return json({ summary }, { headers: responseHeaders });
};
