import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createClient } from '~/lib/supabase/server';

export const action = async ({ request }: ActionFunctionArgs) => {
    const responseHeaders = new Headers();
    const supabase = createClient(request, responseHeaders);
    const { targetProjectId, sourceId } = await request.json();

    if (!targetProjectId) return json({ error: 'Missing targetProjectId' }, { status: 400 });

    let source;

    if (sourceId) {
        // SURGICAL MODE: Restore specific known good backup
        const { data } = await supabase
            .from('studio_workspaces')
            .select('*')
            .eq('id', sourceId)
            .single();
        source = data;
    } else {
        // AUTO MODE: Search for best backup in 'default'
        const { data: candidates } = await supabase
            .from('studio_workspaces')
            .select('*')
            .eq('project_id', 'default')
            .order('created_at', { ascending: false })
            .limit(50);

        if (candidates && candidates.length > 0) {
            source = candidates.reduce((prev, current) => {
                const prevLen = Array.isArray(prev.frames) ? prev.frames.length : 0;
                const currLen = Array.isArray(current.frames) ? current.frames.length : 0;
                return currLen > prevLen ? current : prev;
            });
        }
    }

    if (!source || !source.frames) {
        return json({ error: 'No valid backup found.' }, { status: 404 });
    }

    const sourceCount = Array.isArray(source.frames) ? source.frames.length : 0;
    if (sourceCount < 10 && !sourceId) {
        // Only error on auto-mode if count is low
        return json({ error: `Best backup only has ${sourceCount} screens. Need 32. Cannot Restore.` }, { status: 404 });
    }

    // 2. Check if Target Exists
    const { data: existingTarget } = await supabase
        .from('studio_workspaces')
        .select('id')
        .eq('project_id', targetProjectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    const { id, created_at, ...dataToCopy } = source;
    const payload = {
        ...dataToCopy,
        project_id: targetProjectId,
        user_id: source.user_id
    };

    let error;

    if (existingTarget) {
        const { error: updateError } = await supabase
            .from('studio_workspaces')
            .update(payload)
            .eq('id', existingTarget.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('studio_workspaces')
            .insert(payload);
        error = insertError;
    }

    if (error) {
        console.error('Migrator Error:', error);
        return json({ error: error.message, details: error }, { status: 500, headers: responseHeaders });
    }

    return json({ success: true, count: sourceCount, method: existingTarget ? 'update' : 'insert' }, { headers: responseHeaders });
};
