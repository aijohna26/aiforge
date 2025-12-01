import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, AIGenerationOptions, AIEditOptions, GeneratedProject, AIProviderConfig } from "../types";

const SYSTEM_PROMPT = `You are an elite React Native and Expo architect. You build production-ready mobile apps that work perfectly on first run.

# CORE PRINCIPLES

1. **COMPLETE IMPLEMENTATIONS ONLY** - Every feature must be fully functional, no TODOs or placeholders
2. **PRODUCTION QUALITY** - Code should be clean, maintainable, and follow best practices
3. **USER EXPERIENCE FIRST** - Smooth animations, proper loading states, error handling
4. **TYPE SAFETY** - Proper TypeScript interfaces and type checking throughout

# TECHNICAL REQUIREMENTS

## Stack (EXACT versions - do not deviate)
- expo: ~54.0.0
- expo-router: ~6.0.0
- expo-status-bar: ~3.0.0
- react: 19.1.0
- react-native: 0.81.4
- typescript: ~5.8.3

## Architecture Rules
1. Use Expo Router for navigation (file-based routing)
2. Keep state management simple - useState/useReducer only
3. No external state libraries (no Redux, Zustand, etc.)
4. All styles via StyleSheet.create() - no inline styles
5. Proper separation of concerns - extract components when needed

# RESPONSE FORMAT

Return ONLY valid JSON (no markdown, no code fences):

{
  "projectName": "kebab-case-name",
  "description": "Brief description of the app",
  "files": [
    {
      "path": "package.json",
      "language": "json",
      "content": "..."
    }
  ]
}`;

export class AnthropicProvider implements AIProvider {
    name = "anthropic";
    private client: Anthropic;
    private model: string;

    constructor(config: AIProviderConfig) {
        this.client = new Anthropic({
            apiKey: config.apiKey,
            timeout: 300000,
            maxRetries: 2,
        });
        this.model = config.model || "claude-sonnet-4-5-20250929";
    }

    async generateProject(options: AIGenerationOptions): Promise<GeneratedProject> {
        const stream = await this.client.messages.stream({
            model: this.model,
            max_tokens: options.maxTokens || 32768,
            thinking: {
                type: "enabled",
                budget_tokens: 10000,
            },
            system: [
                {
                    type: "text",
                    text: SYSTEM_PROMPT,
                    cache_control: { type: "ephemeral" },
                },
            ],
            messages: [
                {
                    role: "user",
                    content: `Create a mobile app for: ${options.prompt}

IMPORTANT: Return ONLY valid JSON (no markdown, no code fences).`,
                },
            ],
        });

        let fullText = "";
        let lastProgressUpdate = Date.now();
        let charCount = 0;

        for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                const text = chunk.delta.text;
                fullText += text;
                charCount += text.length;

                const now = Date.now();
                if (options.onProgress && (now - lastProgressUpdate > 500 || charCount > 500)) {
                    options.onProgress({ type: "progress", content: "generating" });
                    lastProgressUpdate = now;
                    charCount = 0;
                }
            }
        }

        await stream.finalMessage();

        // Extract and parse JSON
        const jsonText = this.extractJSON(fullText);
        const parsed: GeneratedProject = JSON.parse(jsonText);

        if (!parsed.projectName || !parsed.files || !Array.isArray(parsed.files)) {
            throw new Error("Invalid project structure from AI");
        }

        return parsed;
    }

    async editCode(options: AIEditOptions): Promise<{ modifications: any[]; summary: string }> {
        const stream = await this.client.messages.stream({
            model: this.model,
            max_tokens: options.maxTokens || 16384,
            system: `You are an expert React Native developer. The user wants to modify their existing app.

Current project files:
${options.context}

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
}`,
            messages: [
                {
                    role: "user",
                    content: options.prompt,
                },
            ],
        });

        let fullText = "";
        let lastProgressUpdate = 0;

        for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                fullText += chunk.delta.text;

                const charsProcessed = fullText.length;
                if (options.onProgress && charsProcessed - lastProgressUpdate > 500) {
                    options.onProgress({ type: "status", content: "Processing your request..." });
                    lastProgressUpdate = charsProcessed;
                }
            }
        }

        await stream.finalMessage();

        const jsonText = this.extractJSON(fullText);
        const result = JSON.parse(jsonText);

        if (!result.modifications || !Array.isArray(result.modifications)) {
            throw new Error("AI response missing 'modifications' array");
        }

        return result;
    }

    private extractJSON(text: string): string {
        let cleaned = text
            .replace(/```json\s*/gi, "")
            .replace(/```\s*/g, "")
            .trim();

        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }

        return cleaned;
    }
}
