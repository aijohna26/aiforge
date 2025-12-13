import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type - Kie.ai accepts: image/jpeg, image/png, image/webp
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({
                error: `Invalid file type: ${file.type}. Accepted types: image/jpeg, image/png, image/webp`
            }, { status: 400 });
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json({
                error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max size: 10MB`
            }, { status: 400 });
        }

        console.log(`[Upload] Uploading file: ${file.name}, type: ${file.type}, size: ${(file.size / 1024).toFixed(2)}KB`);

        // Try Supabase first
        try {
            const supabase = await createClient();
            const filename = `temp/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

            const { data, error } = await supabase.storage
                .from('images')
                .upload(filename, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: file.type
                });

            if (!error) {
                const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filename);
                console.log(`[Upload] ✅ Uploaded to Supabase: ${publicUrl}`);
                return NextResponse.json({ url: publicUrl, provider: 'supabase' });
            }

            console.warn(`[Upload] Supabase failed, trying ImgBB fallback:`, error);
        } catch (supabaseError) {
            console.warn(`[Upload] Supabase error, trying ImgBB fallback:`, supabaseError);
        }

        // Fallback to ImgBB
        const imgbbApiKey = process.env.IMGBB_API_KEY;
        if (!imgbbApiKey) {
            return NextResponse.json({
                error: "Upload failed: Supabase unavailable and ImgBB not configured"
            }, { status: 500 });
        }

        console.log(`[Upload] Trying ImgBB fallback...`);

        const imgbbFormData = new FormData();
        imgbbFormData.append('image', file);

        const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
            method: 'POST',
            body: imgbbFormData,
        });

        if (!imgbbResponse.ok) {
            const errorText = await imgbbResponse.text();
            console.error('[Upload] ImgBB error:', errorText);
            return NextResponse.json({
                error: "Both Supabase and ImgBB uploads failed"
            }, { status: 500 });
        }

        const imgbbData = await imgbbResponse.json();

        if (imgbbData.success && imgbbData.data?.url) {
            console.log(`[Upload] ✅ Uploaded to ImgBB: ${imgbbData.data.url}`);
            return NextResponse.json({
                url: imgbbData.data.url,
                provider: 'imgbb'
            });
        }

        return NextResponse.json({
            error: "Upload failed: Invalid response from ImgBB"
        }, { status: 500 });

    } catch (error) {
        console.error("Upload handler error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json(
            { error: errorMessage, details: error instanceof Error ? error.stack : String(error) },
            { status: 500 }
        );
    }
}
