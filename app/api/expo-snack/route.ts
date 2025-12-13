import { NextRequest, NextResponse } from "next/server";

/**
 * Create an Expo Snack for device testing
 * POST /api/expo-snack
 * Body: { files: GeneratedFile[], name: string }
 */
export async function POST(req: NextRequest) {
    try {
        const { files, name } = await req.json();

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: "Files are required" },
                { status: 400 }
            );
        }

        // Convert files to Snack format
        const snackFiles: Record<string, { contents: string }> = {};
        files.forEach((file: { path: string; content: string }) => {
            snackFiles[file.path] = { contents: file.content };
        });

        // Create Snack via Expo API
        const response = await fetch("https://exp.host/--/api/v2/snack/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: name || "AppForge Project",
                description: "Created with AppForge AI",
                files: snackFiles,
                dependencies: {
                    "expo": "~54.0.0",
                    "react": "19.1.0",
                    "react-native": "0.81.5",
                },
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to create Snack");
        }

        const data = await response.json();
        const snackUrl = `https://snack.expo.dev/${data.id}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
            snackUrl
        )}`;

        return NextResponse.json({
            success: true,
            snackUrl,
            qrCodeUrl,
            snackId: data.id,
        });
    } catch (error) {
        console.error("[Expo Snack] Failed to create snack:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "Failed to create Snack",
            },
            { status: 500 }
        );
    }
}
