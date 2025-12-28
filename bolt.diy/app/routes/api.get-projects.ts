import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { createClient } from '~/lib/supabase/server';

export async function loader({ request }: LoaderFunctionArgs) {
  const headers = new Headers();
  const supabase = createClient(request, headers);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[Get Projects] Supabase error:', error);

      if (error.code === '42P01') {
        return json(
          {
            success: false,
            error: "The 'projects' table was not found. Please run the setup SQL in your Supabase dashboard.",
            errorCode: 'TABLE_MISSING',
          },
          { status: 404, headers },
        );
      }

      return json({ success: false, error: error.message }, { status: 500, headers });
    }

    return json({ success: true, projects: data }, { headers });
  } catch (error) {
    console.error('[Get Projects] Error:', error);
    return json({ success: false, error: 'Failed to fetch projects' }, { status: 500, headers });
  }
}
