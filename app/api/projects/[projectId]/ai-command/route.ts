import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { walletManager } from "@/lib/wallet";
import { fileCache } from "@/lib/file-cache";
import { getAIProvider } from "@/lib/ai/factory";

const MAX_CONTEXT_CHARS = 20000;
const PRIORITY_FILES = [
  "app/index.tsx",
  "app/_layout.tsx",
  "package.json",
  "app.json",
];

// Credit costs for AI operations
const AI_COMMAND_COST = 1; // Credits per iterative AI edit/command (API cost: ~$0.02, Revenue: $0.25, Profit: 11.5x)

// Smart file selection (Bolt.diy style) - only send relevant files
function buildFileContext(files: any[]): { context: string; filesIncluded: string[] } {
  const filesIncluded: string[] = [];
  let totalChars = 0;
  const contextParts: string[] = [];

  // 1. Always include priority files first
  for (const priorityPath of PRIORITY_FILES) {
    const file = files.find((f) => f.path === priorityPath);
    if (file && totalChars + file.content.length < MAX_CONTEXT_CHARS) {
      contextParts.push(`File: ${file.path}\\n\`\`\`\\n${file.content}\\n\`\`\``);
      filesIncluded.push(file.path);
      totalChars += file.content.length;
    }
  }

  // 2. Include other files until we hit the limit (prioritize smaller files)
  const remainingFiles = files
    .filter((f) => !PRIORITY_FILES.includes(f.path))
    .sort((a, b) => a.content.length - b.content.length); // Smaller files first

  for (const file of remainingFiles) {
    if (totalChars + file.content.length < MAX_CONTEXT_CHARS) {
      contextParts.push(`File: ${file.path}\\n\`\`\`\\n${file.content}\\n\`\`\``);
      filesIncluded.push(file.path);
      totalChars += file.content.length;
    } else {
      break; // Stop when we hit the limit
    }
  }

  console.log(`[Context] Included ${filesIncluded.length}/${files.length} files (${totalChars} chars)`);

  const truncatedNote = filesIncluded.length < files.length
    ? `\\n[Context truncated after ${filesIncluded.length} files. Remaining files (not sent): ${files
        .filter((f) => !filesIncluded.includes(f.path))
        .map((f) => f.path)
        .join(", ")}]`
    : "";

  return {
    context: contextParts.join("\\n\\n") + truncatedNote,
    filesIncluded,
  };
}

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) {
      return Response.json(
        { error: "Missing projectId" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const prompt = body?.text?.trim();
    if (!prompt) {
      return Response.json(
        { error: "Command text is required" },
        { status: 400 }
      );
    }

    // Check and reserve credits
    const hasBalance = await walletManager.reserve(user.id, AI_COMMAND_COST);
    if (!hasBalance) {
      return Response.json(
        { error: `Insufficient credits. You need at least ${AI_COMMAND_COST} credits for AI edits.` },
        { status: 402 }
      );
    }

    // Load existing project files
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      await walletManager.settle(user.id, AI_COMMAND_COST, 0);
      return Response.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const { data: files, error: filesError } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", projectId);

    if (filesError) {
      await walletManager.settle(user.id, AI_COMMAND_COST, 0);
      return Response.json(
        { error: "Failed to load project files" },
        { status: 500 }
      );
    }

    // Stream response using Server-Sent Events (Bolt.diy style)
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "status", message: "Reading project files..." })}\n\n`)
          );

          const provider = getAIProvider();
          console.log(`[AI Command] Using provider: ${provider.name}`);

          const { context: fileContext, filesIncluded } = buildFileContext(files);
          console.log(`[AI Command] Sending ${filesIncluded.length} files to ${provider.name}`);

          let result;
          try {
            result = await provider.editCode({
              prompt,
              context: fileContext,
              maxTokens: 16384,
              onProgress: (chunk) => {
                if (!chunk?.content) return;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: "status",
                    message: chunk.content,
                  })}\n\n`)
                );
              },
            });
          } catch (providerError) {
            console.error(`[AI Command] ${provider.name} error:`, providerError);
            throw providerError;
          }

          if (!result.modifications || !Array.isArray(result.modifications)) {
            throw new Error("AI response missing 'modifications' array");
          }

          // Create snapshot BEFORE applying changes (for rollback)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "status", message: "Creating backup..." })}\n\n`)
          );

          // Load files into cache and create snapshot
          fileCache.loadProject(projectId, files.map((f: any) => ({
            path: f.path,
            content: f.content,
            language: f.language,
          })));
          const snapshotId = fileCache.createSnapshot(projectId, result.summary || "AI edit");

          // Notify frontend that snapshot was created (for rollback button)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "snapshot_created", snapshotId, description: result.summary || "AI edit" })}\n\n`)
          );

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "status", message: "Applying changes..." })}\n\n`)
          );

          // Apply modifications to database
          const modifiedFiles: string[] = [];
          const totalFiles = result.modifications?.length || 0;
          let filesProcessed = 0;

          for (const mod of result.modifications || []) {
            filesProcessed++;

            // Send file-specific progress (Claude Code style)
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: "status",
                message: `Updating ${mod.path}... (${filesProcessed}/${totalFiles})`
              })}\n\n`)
            );

            const originalFile = files.find((f: any) => f.path === mod.path);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "diff",
                  path: mod.path,
                  before: originalFile?.content ?? "",
                  after: mod.content ?? "",
                })}\n\n`
              )
            );

            const { error: updateError } = await supabase
              .from("project_files")
              .update({ content: mod.content, updated_at: new Date().toISOString() })
              .eq("project_id", projectId)
              .eq("path", mod.path);

            if (!updateError) {
              modifiedFiles.push(mod.path);

              // CRITICAL: Update file cache immediately (Bolt.diy optimistic updates!)
              // This ensures refreshFiles() sees the new content
              fileCache.setFile(projectId, {
                path: mod.path,
                content: mod.content,
                language: mod.path.split('.').pop() || 'typescript',
              }, async () => {
                // No additional DB sync needed - already done above
              });

              // Send success for this file
              const progressData = JSON.stringify({
                type: "file_modified",
                path: mod.path,
                action: mod.action || "edit"
              });
              controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));
            }
          }

          // Deduct credits after successful modification
          await walletManager.settle(user.id, AI_COMMAND_COST, AI_COMMAND_COST);

          // Send completion
          const completionData = JSON.stringify({
            type: "complete",
            success: true,
            message: result.summary || "Changes applied successfully",
            filesModified: modifiedFiles,
          });
          controller.enqueue(encoder.encode(`data: ${completionData}\n\n`));

          controller.close();
        } catch (error) {
          console.error("AI command error:", error);
          const errorMessage = error instanceof Error ? error.message : "Failed to process request";

          // Refund credits on error
          await walletManager.settle(user.id, AI_COMMAND_COST, 0);

          const errorData = JSON.stringify({
            type: "error",
            success: false,
            error: errorMessage,
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI command failed:", error);
    return Response.json(
      { error: "Failed to process AI command" },
      { status: 500 }
    );
  }
}
