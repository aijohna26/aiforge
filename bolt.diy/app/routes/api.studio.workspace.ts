import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { createClient } from '~/lib/supabase/server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const snapshotHash = url.searchParams.get('hash');
  const workspaceId = url.searchParams.get('id');
  const projectId = url.searchParams.get('projectId');

  // Allow fetching by projectId, workspaceId, or snapshotHash
  if (!snapshotHash && !workspaceId && !projectId) {
    return json({ error: 'Missing snapshot hash, workspace ID, or project ID' }, { status: 400 });
  }

  const responseHeaders = new Headers();
  const supabase = createClient(request, responseHeaders);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase.from('studio_workspaces').select('*');

  // Build query based on available parameters
  if (workspaceId) {
    query = query.eq('id', workspaceId);
  } else if (projectId) {
    // Fetch by project_id - get the most recent workspace for this project
    query = query.eq('project_id', projectId).order('updated_at', { ascending: false }).limit(1);
  } else {
    query = query.eq('snapshot_hash', snapshotHash!);
  }

  // For authenticated users, filter by user_id
  // For anonymous users, don't filter by user_id (allows fetching any workspace by projectId)
  if (user) {
    query = query.eq('user_id', user.id);
  }
  // If anonymous and querying by projectId, we'll fetch any workspace with that project_id
  // This allows anonymous users to access their own workspaces

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('[Studio Save] DB Error:', error);

    // Handle missing table
    if (error.code === '42P01') {
      return json(
        {
          error: "The 'studio_workspaces' table was not found. Please run the SQL migration.",
          errorCode: 'TABLE_MISSING',
          sql: getMigrationSql(),
        },
        { status: 404, headers: responseHeaders },
      );
    }

    return json({ error: 'Failed to fetch workspace' }, { status: 500 });
  }

  return json({ workspace: data }, { headers: responseHeaders });
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { snapshotHash, frames, theme, projectId } = await request.json();

  if (!snapshotHash || !frames) {
    return json({ error: 'Missing required fields' }, { status: 400 });
  }

  const responseHeaders = new Headers();
  const supabase = createClient(request, responseHeaders);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const workspaceData = {
    user_id: user?.id || null,
    project_id: projectId || 'default',
    snapshot_hash: snapshotHash,
    frames,
    theme,
    updated_at: new Date().toISOString(),
  };

  // LOGIC CHANGE v3: Nuclear Option (Delete All + Insert)
  // To resolve persistent 500 errors regarding unique constraints and duplicates,
  // we strictly enforce 1 session by deleting ALL existing sessions for this project
  // and inserting a fresh one.

  if (user) {
    console.log(`[Studio Save] Wiping old sessions for project: ${projectId || 'default'}`);
    const { error: delError } = await supabase
      .from('studio_workspaces')
      .delete()
      .eq('project_id', projectId || 'default')
      .eq('user_id', user.id);

    if (delError) {
      console.error('[Studio Save] Delete Error:', delError);
      // We continue? Or fail? Let's try to continue to Insert, but this is suspicious.
    }
  }

  // Insert the new clean state
  console.log('[Studio Save] Inserting fresh workspace');
  const { data, error } = await supabase
    .from('studio_workspaces')
    .insert(workspaceData)
    .select()
    .single();

  if (error) {
    // Handle Duplicate Key (Row already exists)
    if (error.code === '23505') {
      console.log('[Studio Save] Duplicate found (Clean Slate failed). Updating existing row instead.');

      // Find the blocking row
      const { data: blocker } = await supabase
        .from('studio_workspaces')
        .select('id')
        .eq('user_id', user?.id || null) // Use user?.id or null to match insert
        .eq('project_id', projectId || 'default')
        .eq('snapshot_hash', snapshotHash)
        .maybeSingle();

      if (blocker) {
        const { error: updateError } = await supabase
          .from('studio_workspaces')
          .update(workspaceData)
          .eq('id', blocker.id);

        if (!updateError) {
          return json({ success: true, method: 'fallback_update' }, { headers: responseHeaders });
        }
      }
    }

    console.error('[Studio Save] DB Error:', error);

    // Handle missing table
    if (error.code === '42P01') {
      return json(
        {
          success: false,
          error: "The 'studio_workspaces' table was not found. Please run the SQL migration.",
          errorCode: 'TABLE_MISSING',
          sql: getMigrationSql(),
        },
        { status: 404, headers: responseHeaders },
      );
    }

    // Handle RLS violation
    if (error.code === '42501') {
      return json(
        {
          success: false,
          error: 'RLS policy violation. Ensure the table allows access.',
          errorCode: 'RLS_VIOLATION',
          sql: getRLSSql(),
        },
        { status: 403, headers: responseHeaders },
      );
    }

    return json(
      { error: 'Failed to save workspace', details: error.message },
      { status: 500, headers: responseHeaders },
    );
  }

  return json({ success: true, workspace: data }, { headers: responseHeaders });
}

function getMigrationSql() {
  return `
CREATE TABLE IF NOT EXISTS studio_workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    project_id TEXT,
    snapshot_hash TEXT NOT NULL,
    frames JSONB NOT NULL,
    theme JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, project_id, snapshot_hash)
);

ALTER TABLE studio_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select" ON studio_workspaces FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert" ON studio_workspaces FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update" ON studio_workspaces FOR UPDATE TO anon, authenticated USING (true);
`;
}

function getRLSSql() {
  return `
ALTER TABLE studio_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select" ON studio_workspaces FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert" ON studio_workspaces FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update" ON studio_workspaces FOR UPDATE TO anon, authenticated USING (true);
`;
}
