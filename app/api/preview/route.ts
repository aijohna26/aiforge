import { NextRequest, NextResponse } from "next/server";
import { SimpleCompiler } from "@/lib/simple-compiler";

export async function POST(req: NextRequest) {
    try {
        const { files } = await req.json();

        console.log(`[Preview API] Received ${files?.length || 0} files`);
        if (files && files.length > 0) {
            console.log(`[Preview API] File paths:`, files.map((f: any) => f.path));
        }

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: "Files are required" },
                { status: 400 }
            );
        }

        console.log(`[Preview API] Compiling preview...`);

        // Compile to HTML
        const html = SimpleCompiler.compile({ files });

        return new NextResponse(html, {
            headers: {
                "Content-Type": "text/html",
                "Cache-Control": "no-cache, no-store, must-revalidate",
            },
        });
    } catch (error) {
        console.error("[Preview API] Compilation failed:", error);

        const errorHtml = `
<!DOCTYPE html>
<html>
<head><title>Compilation Error</title></head>
<body style="padding: 20px; font-family: monospace;">
    <h2 style="color: red;">Compilation Error</h2>
    <pre>${error instanceof Error ? error.message : 'Unknown error'}</pre>
</body>
</html>
        `;

        return new NextResponse(errorHtml, {
            headers: { "Content-Type": "text/html" },
            status: 500,
        });
    }
}
