import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');

        // Upload to ImgBB (free tier, no API key needed for basic usage)
        // Note: For production, you should get an API key from imgbb.com
        const imgbbApiKey = process.env.IMGBB_API_KEY || ''; // Optional: add your ImgBB API key to .env.local

        if (!imgbbApiKey) {
            console.warn('[Upload] No IMGBB_API_KEY found, using fallback method');
            // Fallback: Return a data URL (might not work with Kie.ai)
            return NextResponse.json({
                url: `data:${file.type};base64,${base64}`,
                warning: 'Using data URL - may not work with all APIs. Consider adding IMGBB_API_KEY to .env.local'
            });
        }

        // Upload to ImgBB
        const uploadFormData = new FormData();
        uploadFormData.append('image', base64);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
            method: 'POST',
            body: uploadFormData
        });

        if (!response.ok) {
            throw new Error('ImgBB upload failed');
        }

        const data = await response.json();

        if (data.success && data.data?.url) {
            return NextResponse.json({ url: data.data.url });
        }

        throw new Error('ImgBB did not return a URL');
    } catch (error) {
        console.error("Upload handler error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
