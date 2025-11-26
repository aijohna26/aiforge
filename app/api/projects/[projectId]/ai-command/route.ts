import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { walletManager } from "@/lib/wallet";
import Anthropic from "@anthropic-ai/sdk";

const anthropicClient = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 120000, // 2 minutes
      maxRetries: 2,
    })
  : null;

// Credit costs for AI operations
const AI_COMMAND_COST = 2; // Credits per iterative AI edit/command

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

          if (!anthropicClient) {
            throw new Error("AI service not configured");
          }

          // Build context from existing files
          const fileContext = files
            .map((f) => `File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
            .join("\n\n");

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "status", message: "Processing your request..." })}\n\n`)
          );

          // Call Claude with STREAMING for instant feedback (Bolt.diy style!)
          const stream = await anthropicClient.messages.stream({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 16384, // Increased to handle large file responses
            system: `You are an expert React Native developer. The user wants to modify their existing app.

Current project files:
${fileContext}

CRITICAL: You MUST respond with ONLY a valid JSON object. No explanations, no markdown, no code fences.

Required JSON structure:
{
  "modifications": [
    {
      "path": "app/index.tsx",
      "content": "...complete file content...",
      "action": "edit"
    }
  ],
  "summary": "Changed button colors from blue to green"
}

Rules:
1. Modify ONLY files that need changes
2. Include COMPLETE file content in each modification
3. Keep summary under 100 characters
4. Start your response with { and end with }
5. NO markdown formatting, NO \`\`\`json blocks`,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          });

          // Stream thinking progress to user (INSTANT feedback!)
          let responseText = '';
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              responseText += chunk.delta.text;

              // Send progress update every 100 chars (gives feeling of activity)
              if (responseText.length % 100 === 0) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: "status",
                    message: "AI is analyzing..."
                  })}\n\n`)
                );
              }
            }
          }

          await stream.finalMessage();

          // Parse AI response from streamed text - try to extract valid JSON
          let result;
          try {
            // First, try to find JSON between triple backticks (if AI wrapped it)
            const codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (codeBlockMatch) {
              result = JSON.parse(codeBlockMatch[1]);
            } else {
              // Otherwise, find the JSON object
              const jsonMatch = responseText.match(/\{[\s\S]*\}/);
              if (!jsonMatch) {
                throw new Error("No JSON found in AI response");
              }
              result = JSON.parse(jsonMatch[0]);
            }
          } catch (parseError) {
            console.error("Failed to parse AI response:", responseText);
            throw new Error(`Invalid AI response format: ${parseError instanceof Error ? parseError.message : 'Parse error'}`);
          }

          // Validate result structure
          if (!result.modifications || !Array.isArray(result.modifications)) {
            throw new Error("AI response missing 'modifications' array");
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "status", message: "Applying changes..." })}\n\n`)
          );

          // Apply modifications to database
          const modifiedFiles: string[] = [];
          for (const mod of result.modifications || []) {
            const { error: updateError } = await supabase
              .from("project_files")
              .update({ content: mod.content, updated_at: new Date().toISOString() })
              .eq("project_id", projectId)
              .eq("path", mod.path);

            if (!updateError) {
              modifiedFiles.push(mod.path);
              // Send progress for each file (without content to avoid JSON issues)
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
