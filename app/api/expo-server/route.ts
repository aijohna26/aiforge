import { NextRequest } from "next/server";
import { expoServerManager } from "@/lib/expo-server-manager-v2";
import { fileCache } from "@/lib/file-cache";

export async function POST(req: NextRequest) {
    try {
        const { projectId, files } = await req.json();

        if (!projectId) {
            return Response.json({ error: "Project ID is required" }, { status: 400 });
        }

        // Files can come from request body or cache
        let projectFiles = files;

        if (!projectFiles || projectFiles.length === 0) {
            // Fallback to cache if files not provided
            console.log(`[API] No files in request, checking cache for projectId: ${projectId}`);
            projectFiles = fileCache.getFiles(projectId);
            console.log(`[API] Found ${projectFiles?.length || 0} files in cache`);
        }

        if (!projectFiles || projectFiles.length === 0) {
            console.log(`[API] Cache stats:`, fileCache.getStats(projectId));
            return Response.json({ error: "No files found for project" }, { status: 404 });
        }

        console.log(`[API] Creating Expo server for: ${projectId} with ${projectFiles.length} files`);

        // Start server creation in background (don't await)
        expoServerManager.createServer(projectId, projectFiles).catch((error) => {
            console.error(`[API] Background server creation failed:`, error);
        });

        // Return immediately with starting status
        return Response.json({
            success: true,
            message: "Server creation started",
            server: {
                status: "starting",
            },
        });
    } catch (error) {
        console.error("[API] Expo server creation failed:", error);
        return Response.json(
            { error: error instanceof Error ? error.message : "Failed to start Expo server" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
        return Response.json({ error: "Project ID is required" }, { status: 400 });
    }

    const instance = expoServerManager.getServer(projectId);

    if (!instance) {
        return Response.json({ status: "stopped" });
    }

    return Response.json({
        success: true,
        server: {
            id: instance.id,
            status: instance.status,
            expUrl: instance.expUrl,
            localUrl: instance.localUrl,
            webUrl: instance.webUrl,
            tunnelUrl: instance.tunnelUrl,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                instance.expUrl
            )}`,
            createdAt: instance.createdAt,
            lastAccessedAt: instance.lastAccessedAt,
            connectedDevices: instance.connectedDevices,
            error: instance.error,
        },
    });
}
