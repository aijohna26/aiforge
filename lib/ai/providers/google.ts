import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, AIGenerationOptions, AIEditOptions, GeneratedProject, AIProviderConfig } from "../types";

const SYSTEM_PROMPT = `You are an elite React Native and Expo architect. You build production-ready mobile apps that work perfectly on first run.

Return ONLY valid JSON (no markdown, no code fences) with this structure:
{
  "projectName": "kebab-case-name",
  "description": "Brief description",
  "files": [{"path": "...", "language": "...", "content": "..."}]
}`;

export class GoogleProvider implements AIProvider {
    name = "google";
    private client: GoogleGenerativeAI;
    private model: string;

    constructor(config: AIProviderConfig) {
        this.client = new GoogleGenerativeAI(config.apiKey);
        this.model = config.model || "gemini-1.5-flash";
    }

    async generateProject(options: AIGenerationOptions): Promise<GeneratedProject> {
        const model = this.client.getGenerativeModel({ model: this.model });

        const result = await model.generateContentStream({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `${SYSTEM_PROMPT}\n\nCreate a mobile app for: ${options.prompt}\n\nIMPORTANT: Return ONLY valid JSON.`,
                        },
                    ],
                },
            ],
            generationConfig: {
                maxOutputTokens: options.maxTokens || 32768,
                temperature: options.temperature || 0.7,
            },
        });

        let fullText = "";
        let lastProgressUpdate = Date.now();
        let charCount = 0;

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullText += chunkText;
            charCount += chunkText.length;

            const now = Date.now();
            if (options.onProgress && (now - lastProgressUpdate > 500 || charCount > 500)) {
                options.onProgress({ type: "progress", content: "generating" });
                lastProgressUpdate = now;
                charCount = 0;
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
        const model = this.client.getGenerativeModel({ model: this.model });

        const result = await model.generateContentStream({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `You are an expert React Native developer. Return ONLY valid JSON:
{
  "modifications": [{"path": "...", "content": "...", "action": "edit"}],
  "summary": "..."
}

Current project files:
${options.context}

User request: ${options.prompt}`,
                        },
                    ],
                },
            ],
            generationConfig: {
                maxOutputTokens: options.maxTokens || 16384,
                temperature: 0.7,
            },
        });

        let fullText = "";
        let lastProgressUpdate = 0;

        for await (const chunk of result.stream) {
            fullText += chunk.text();

            const charsProcessed = fullText.length;
            if (options.onProgress && charsProcessed - lastProgressUpdate > 500) {
                options.onProgress({ type: "status", content: "Processing your request..." });
                lastProgressUpdate = charsProcessed;
            }
        }

        const jsonText = this.extractJSON(fullText);
        const result2 = JSON.parse(jsonText);

        if (!result2.modifications || !Array.isArray(result2.modifications)) {
            throw new Error("AI response missing 'modifications' array");
        }

        return result2;
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
