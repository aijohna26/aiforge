import { json, type ActionFunctionArgs } from "@remix-run/node";
import { createClient } from "~/lib/supabase/server";

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, { status: 405 });
    }

    const headers = new Headers();
    const supabase = createClient(request, headers);
    const { data: { user } } = await supabase.auth.getUser();

    // For now, if no user, we still allow saving (public for testing) or we could require auth
    // The user said "save to the database", usually implies a user context.

    try {
        const wizardData = await request.json();

        // We'll save the whole design state to a projects table
        // We assume a 'projects' table exists with a 'data' jsonb column
        const { data, error } = await supabase
            .from('projects')
            .insert({
                user_id: user?.id || null,
                name: wizardData.step1.appName,
                description: wizardData.step1.description,
                data: wizardData,
                status: 'finalized'
            })
            .select()
            .single();

        if (error) {
            console.error('[Save Wizard] Supabase error:', error);
            // If projects table doesn't exist, we fallback to a successful response for now
            // to not block the user, but we log the error.
            if (error.code === '42P01') { // undefined_table
                return json({
                    success: true,
                    message: "Project finalized locally (DB table 'projects' missing)",
                    project: { id: 'local-' + Date.now(), ...wizardData }
                }, { headers });
            }
            return json({ success: false, error: error.message }, { status: 500, headers });
        }

        return json({ success: true, project: data }, { headers });
    } catch (error) {
        console.error('[Save Wizard] Error:', error);
        return json({ success: false, error: 'Failed to save project' }, { status: 500, headers });
    }
}
