import { json, type ActionFunctionArgs } from "@remix-run/node";
import { createClient } from "~/lib/supabase/server";
import { uploadImageToSupabase } from "~/lib/utils/imageUpload";

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, { status: 405 });
    }

    const headers = new Headers();
    const supabase = createClient(request, headers);
    const { data: { user } } = await supabase.auth.getUser();

    // We allow this if the user is authenticated (Ideally we'd check for admin role)
    if (!user) {
        return json({ error: "Unauthorized" }, { status: 401, headers });
    }

    const { table } = await request.json(); // 'saved_logos' or 'saved_screens'

    if (!['saved_logos', 'saved_screens'].includes(table)) {
        return json({ error: "Invalid table specified" }, { status: 400, headers });
    }

    try {
        console.log(`[Migration] Starting image migration for table: ${table}`);

        // 1. Fetch all records that still have temporary URLs
        const { data: records, error: fetchError } = await supabase
            .from(table)
            .select('id, image_url')
            .filter('image_url', 'ilike', '%tempfile.aiquickdraw.com%');

        if (fetchError) throw fetchError;

        if (!records || records.length === 0) {
            return json({ success: true, message: "No records need migration", table }, { headers });
        }

        console.log(`[Migration] Found ${records.length} records to migrate in ${table}`);

        let migratedCount = 0;
        let errorCount = 0;

        // 2. Process records sequentially to avoid rate limits
        for (const record of records) {
            try {
                const pathPrefix = table === 'saved_logos' ? 'logos' : 'screens';
                const newUrl = await uploadImageToSupabase(supabase, record.image_url, 'images', pathPrefix);

                if (newUrl !== record.image_url) {
                    const { error: updateError } = await supabase
                        .from(table)
                        .update({ image_url: newUrl })
                        .eq('id', record.id);

                    if (updateError) throw updateError;
                    migratedCount++;
                    console.log(`[Migration] Migrated ${record.id} -> ${newUrl}`);
                }
            } catch (err) {
                console.error(`[Migration] Failed to migrate record ${record.id}:`, err);
                errorCount++;
            }
        }

        return json({
            success: true,
            summary: {
                table,
                totalFound: records.length,
                migrated: migratedCount,
                errors: errorCount
            }
        }, { headers });

    } catch (error) {
        console.error('[Migration] Critical error:', error);
        return json({ success: false, error: 'Migration failed' }, { status: 500, headers });
    }
}
