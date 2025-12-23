import { json, redirect, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { createClient } from '~/lib/supabase/server';
import { default as IndexRoute } from './editor';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const response = new Headers();
  const supabase = createClient(request, response);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return redirect('/?auth=true', {
      headers: response,
    });
  }

  return json({ session, id: params.id }, { headers: response });
}

export default IndexRoute;
