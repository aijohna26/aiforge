import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { createClient } from "~/lib/supabase/server";

export async function loader({ request, params }: LoaderFunctionArgs) {
    const { id } = params;

    if (!id) {
        return json({ success: false, error: 'Missing project ID' }, { status: 400 });
    }

    const headers = new Headers();
    const supabase = createClient(request, headers);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return json({ success: false, error: "Unauthorized" }, { status: 401, headers });
    }

    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error) {
            console.error('[Get Project] Error:', error);
            return json({ success: false, error: error.message }, { status: 500, headers });
        }

        return json({ success: true, project: data }, { headers });
    } catch (error) {
        console.error('[Get Project] Error:', error);
        return json({ success: false, error: 'Failed to fetch project' }, { status: 500, headers });
    }
}
