import { NextRequest, NextResponse } from "next/server";
import { WorkspaceManager } from "@/lib/workspace-manager";

const workspaceManager = new WorkspaceManager();

// GET /api/projects/:id/files/:path - Get file content
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; path: string[] }> }
) {
  try {
    const { projectId, path } = await params;
    if (!projectId || !path?.length) {
      return NextResponse.json(
        { error: "Missing projectId or path" },
        { status: 400 }
      );
    }

    const filePath = path.join("/");
    await workspaceManager.initProject(projectId);

    try {
      const content = await workspaceManager.readFile(projectId, filePath);
      return NextResponse.json({
        path: filePath,
        content,
      });
    } catch {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Failed to read file:", error);
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/:id/files/:path - Save file content
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; path: string[] }> }
) {
  try {
    const { projectId, path } = await params;
    if (!projectId || !path?.length) {
      return NextResponse.json(
        { error: "Missing projectId or path" },
        { status: 400 }
      );
    }

    const filePath = path.join("/");
    const body = await req.json();
    const content = body?.content;

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    await workspaceManager.initProject(projectId);
    const commitMessage = body?.message || `chore: update ${filePath}`;
    const sha = await workspaceManager.writeFile(
      projectId,
      filePath,
      content,
      commitMessage
    );

    return NextResponse.json({
      path: filePath,
      sha,
      message: "File saved successfully",
    });
  } catch (error) {
    console.error("Failed to save file:", error);
    return NextResponse.json(
      { error: "Failed to save file" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/:id/files/:path - Delete file
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; path: string[] }> }
) {
  try {
    const { projectId, path } = await params;
    if (!projectId || !path?.length) {
      return NextResponse.json(
        { error: "Missing projectId or path" },
        { status: 400 }
      );
    }

    const filePath = path.join("/");
    await workspaceManager.initProject(projectId);

    // Delete file using git rm
    const { worktree } = workspaceManager.getProjectPaths(projectId);
    const fs = await import("fs/promises");
    const pathModule = await import("path");
    const absPath = pathModule.join(worktree, filePath);

    try {
      await fs.unlink(absPath);
      // Commit the deletion
      const { execFile } = await import("child_process");
      const { promisify } = await import("util");
      const execFileAsync = promisify(execFile);
      await execFileAsync("git", ["add", filePath], { cwd: worktree });
      await execFileAsync("git", ["commit", "-m", `chore: delete ${filePath}`], {
        cwd: worktree,
      });

      return NextResponse.json({
        path: filePath,
        message: "File deleted successfully",
      });
    } catch {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Failed to delete file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
