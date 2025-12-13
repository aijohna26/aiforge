import OpenAI from "openai";
import type { AIProvider, AIGenerationOptions, AIEditOptions, GeneratedProject, AIProviderConfig } from "../types";

const SYSTEM_PROMPT = `You are an elite React Native and Expo architect. You build production-ready mobile apps that work perfectly on first run.

Return ONLY valid JSON (no markdown, no code fences) with this structure:
{
  "projectName": "kebab-case-name",
  "description": "Brief description",
  "files": [{"path": "...", "language": "...", "content": "..."}]
}`;

export class OpenAIProvider implements AIProvider {
    name = "openai";
    private client: OpenAI;
    private model: string;

    constructor(config: AIProviderConfig) {
        this.client = new OpenAI({
            apiKey: config.apiKey,
            timeout: 300000,
            maxRetries: 2,
        });
        this.model = config.model || "gpt-5.1";
    }

    async generateProject(options: AIGenerationOptions): Promise<GeneratedProject> {
        const stream = await this.client.chat.completions.create({
            model: this.model,
            max_completion_tokens: options.maxTokens || 32768,
            temperature: options.temperature || 0.7,
            stream: true,
            messages: [
                {
                    role: "system",
                    content: SYSTEM_PROMPT,
                },
                {
                    role: "user",
                    content: `Create a mobile app for: ${options.prompt}\n\nIMPORTANT: Return ONLY valid JSON.`,
                },
            ],
        });

        let fullText = "";

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                fullText += content;

                // Send each chunk immediately for real-time streaming
                if (options.onProgress) {
                    options.onProgress({ type: "progress", content });
                }
            }
        }

        const jsonText = this.extractJSON(fullText);
        const parsed: GeneratedProject = JSON.parse(jsonText);

        if (!parsed.projectName || !parsed.files || !Array.isArray(parsed.files)) {
            throw new Error("Invalid project structure from AI");
        }

        return parsed;
    }

    async editCode(options: AIEditOptions): Promise<{ modifications: any[]; summary: string }> {
        const stream = await this.client.chat.completions.create({
            model: this.model,
            max_completion_tokens: options.maxTokens || 16384,
            temperature: 0.7,
            stream: true,
            messages: [
                {
                    role: "system",
                    content: `You are an expert React Native developer. Return ONLY valid JSON:
{
  "modifications": [{"path": "...", "content": "...", "action": "edit"}],
  "summary": "..."
}

Current project files:
${options.context}`,
                },
                {
                    role: "user",
                    content: options.prompt,
                },
            ],
        });

        let fullText = "";
        let lastProgressUpdate = 0;

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            fullText += content;

            const charsProcessed = fullText.length;
            if (options.onProgress && charsProcessed - lastProgressUpdate > 500) {
                options.onProgress({ type: "status", content: "Processing your request..." });
                lastProgressUpdate = charsProcessed;
            }
        }

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
