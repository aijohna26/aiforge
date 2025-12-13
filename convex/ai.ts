import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * AppForge AI Integration
 * Handles AI chat and code generation
 */

export const chat = action({
  args: {
    projectId: v.id("chats"),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
        content: v.string(),
      })
    ),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ content: string; usage: any }> => {
    // Get API keys from environment
    const apiKey =
      args.provider === "openai"
        ? process.env.OPENAI_API_KEY
        : process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error(`API key not found for provider: ${args.provider || "anthropic"}`);
    }

    // Call the appropriate AI provider
    const provider = args.provider || "openai";
    const model = args.model || (provider === "openai" ? "gpt-4o" : "claude-3-5-sonnet-20241022");

    try {
      // Make API call
      const response = await fetch(
        provider === "openai"
          ? "https://api.openai.com/v1/chat/completions"
          : "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            ...(provider === "anthropic" && {
              "anthropic-version": "2023-06-01",
              "x-api-key": apiKey,
            }),
          },
          body: JSON.stringify(
            provider === "openai"
              ? {
                  model,
                  messages: args.messages,
                  temperature: 0.7,
                  max_tokens: 4000,
                }
              : {
                  model,
                  messages: args.messages.map((m) => ({
                    role: m.role === "system" ? "user" : m.role,
                    content: m.content,
                  })),
                  max_tokens: 4000,
                  temperature: 0.7,
                }
          ),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI API error: ${error}`);
      }

      const data = await response.json();

      // Extract response based on provider
      const content =
        provider === "openai"
          ? data.choices[0].message.content
          : data.content[0].text;

      return {
        content,
        usage: provider === "openai" ? data.usage : data.usage,
      };
    } catch (error) {
      console.error("AI chat error:", error);
      throw error;
    }
  },
});

// Generate code based on a prompt
export const generateCode = action({
  args: {
    projectId: v.id("chats"),
    prompt: v.string(),
    currentFiles: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<{ content: string; usage: any }> => {
    // Build system prompt for Expo code generation
    const systemPrompt = `You are an expert Expo React Native developer.
Generate clean, modern, production-ready code for Expo applications.

IMPORTANT RULES:
- Only generate Expo React Native code (not web or other frameworks)
- Use TypeScript for all code
- Follow React Native best practices
- Use Expo SDK components and APIs when possible
- Keep code simple and readable
- Include proper TypeScript types
- Use StyleSheet for styling

When modifying files:
1. Show the complete file content after changes
2. Ensure all imports are correct
3. Follow existing code patterns
4. Add helpful comments for complex logic`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      {
        role: "user" as const,
        content: `Current project files:\n${JSON.stringify(args.currentFiles, null, 2)}\n\nTask: ${args.prompt}`,
      },
    ];

    // Call AI
    const result = await ctx.runAction(api.ai.chat, {
      projectId: args.projectId,
      messages,
      provider: "openai",
    });

    return result;
  },
});
