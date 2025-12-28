import { json, type ActionFunctionArgs } from '@remix-run/node';
import { createClient } from '~/lib/supabase/server';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'DELETE' && request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const headers = new Headers();
  const supabase = createClient(request, headers);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401, headers });
  }

  const { projectId } = await request.json();

  if (!projectId) {
    return json({ success: false, error: 'Missing projectId' }, { status: 400, headers });
  }

  const { error } = await supabase.from('projects').delete().eq('id', projectId).eq('user_id', user.id);

  if (error) {
    console.error('[Delete Project] Error:', error);
    return json({ success: false, error: error.message }, { status: 500, headers });
  }

  return json({ success: true }, { headers });
}
