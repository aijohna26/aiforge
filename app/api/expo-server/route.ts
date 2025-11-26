/**
 * Expo Dev Server API
 *
 * POST /api/expo-server - Create a new dev server for a project
 * GET /api/expo-server?id=xxx - Get status of a server
 * DELETE /api/expo-server?id=xxx - Stop a server
 */

import { NextRequest } from "next/server";
import { expoManager } from "@/lib/expo-server-manager";

export const runtime = "nodejs";
export const maxDuration = 120; // Allow up to 2 minutes for server startup

export async function POST(req: NextRequest) {
  try {
    const { project } = await req.json();

    if (!project || !project.files || !project.projectName) {
      return Response.json(
        { success: false, error: "Invalid project data" },
        { status: 400 }
      );
    }

    console.log(`[API] Creating Expo server for: ${project.projectName}`);

    const instance = await expoManager.createServer(project);

    // Generate QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      instance.expUrl
    )}`;

    return Response.json({
      success: true,
      server: {
        id: instance.id,
        status: instance.status,
        expUrl: instance.expUrl,
        localUrl: instance.localUrl,
        tunnelUrl: instance.tunnelUrl,
        qrCodeUrl,
        createdAt: instance.createdAt,
      },
    });
  } catch (error) {
    console.error("[API] Expo server creation failed:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create Expo server",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    // Return all active instances
    const instances = expoManager.getActiveInstances();
    return Response.json({
      success: true,
      servers: instances.map((i) => ({
        id: i.id,
        status: i.status,
        expUrl: i.expUrl,
        localUrl: i.localUrl,
        tunnelUrl: i.tunnelUrl,
        createdAt: i.createdAt,
        lastAccessedAt: i.lastAccessedAt,
      })),
    });
  }

  const instance = expoManager.getServer(id);

  if (!instance) {
    return Response.json(
      { success: false, error: "Server not found" },
      { status: 404 }
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    instance.expUrl
  )}`;

  return Response.json({
    success: true,
    server: {
      id: instance.id,
      status: instance.status,
      expUrl: instance.expUrl,
      localUrl: instance.localUrl,
      tunnelUrl: instance.tunnelUrl,
      qrCodeUrl,
      createdAt: instance.createdAt,
      lastAccessedAt: instance.lastAccessedAt,
      error: instance.error,
    },
  });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return Response.json(
      { success: false, error: "Server ID required" },
      { status: 400 }
    );
  }

  try {
    await expoManager.stopServer(id);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to stop server",
      },
      { status: 500 }
    );
  }
}
