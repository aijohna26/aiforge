import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { createClient } from '~/lib/supabase/server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const snapshotHash = url.searchParams.get('hash');
  const projectId = url.searchParams.get('projectId');

  if (!snapshotHash) {
    return json({ error: 'Missing snapshot hash' }, { status: 400 });
  }

  const responseHeaders = new Headers();
  const supabase = createClient(request, responseHeaders);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase.from('studio_workspaces').select('*').eq('snapshot_hash', snapshotHash);

  if (user) {
    query = query.eq('user_id', user.id);
  } else {
    /*
     * For anonymous users, we might want to skip or handle differently
     * For now, let's require user or handle by sessionId?
     * User requested database, usually implies auth context in these apps
     */
  }

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

  // Upsert based on snapshot_hash (and user_id if present)
  const query = supabase.from('studio_workspaces').upsert(workspaceData, {
    onConflict: 'user_id, project_id, snapshot_hash',
  });

  const { data, error } = await query.select().single();

  if (error) {
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
