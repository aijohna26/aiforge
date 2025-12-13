import { NextRequest, NextResponse } from "next/server";
import { BundleCompiler } from "@/lib/bundle-compiler";

export async function POST(
    req: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        const { projectId } = params;
        const { files } = await req.json();

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: "Files are required" },
                { status: 400 }
            );
        }

        // Find entry file
        const entryFile = files.find((f: any) =>
            f.path === 'App.tsx' ||
            f.path === 'App.js' ||
            f.path === 'index.tsx' ||
            f.path === 'index.js'
        );

        if (!entryFile) {
            return NextResponse.json(
                { error: "Entry file not found (App.tsx/App.js)" },
                { status: 400 }
            );
        }

        console.log(`[Bundle API] Compiling ${projectId}...`);

        // Compile bundle
        const html = await BundleCompiler.compile({
            projectId,
            files,
            entry: entryFile.path,
        });

        // Return HTML for immediate preview
        return new NextResponse(html, {
            headers: {
                "Content-Type": "text/html",
                "Cache-Control": "no-cache",
            },
        });
    } catch (error) {
        console.error("[Bundle API] Compilation failed:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Compilation failed" },
            { status: 500 }
        );
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: { projectId: string } }
) {
    // For device testing - serve cached bundle
    return NextResponse.json({
        message: "Use POST to compile bundle",
    });
}
