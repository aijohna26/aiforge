import type { AIProvider, AIProviderConfig } from "./types";
import { AnthropicProvider } from "./providers/anthropic";
import { OpenAIProvider } from "./providers/openai";
import { GoogleProvider } from "./providers/google";

export function getAIProvider(): AIProvider {
    const provider = process.env.AI_PROVIDER?.toLowerCase() || "anthropic";
    const customModel = process.env.AI_MODEL;

    switch (provider) {
        case "anthropic": {
            const apiKey = process.env.ANTHROPIC_API_KEY;
            if (!apiKey) {
                throw new Error("ANTHROPIC_API_KEY environment variable is required when using provider: anthropic");
            }
            return new AnthropicProvider({
                apiKey,
                model: customModel || "claude-sonnet-4-5-20250929",
            });
        }

        case "openai": {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) {
                throw new Error("OPENAI_API_KEY environment variable is required when using provider: openai");
            }
            return new OpenAIProvider({
                apiKey,
                model: customModel || "gpt-5.1",
            });
        }

        case "google": {
            const apiKey = process.env.GOOGLE_AI_API_KEY;
            if (!apiKey) {
                throw new Error("GOOGLE_AI_API_KEY environment variable is required when using provider: google");
            }
            return new GoogleProvider({
                apiKey,
                model: customModel || "gemini-1.5-flash",
            });
        }

        default:
            throw new Error(
                `Unknown AI provider: ${provider}. Supported providers: anthropic, openai, google. Current AI_PROVIDER=${process.env.AI_PROVIDER}`
            );
    }
}

export function getProviderInfo(): { provider: string; model: string } {
    const provider = process.env.AI_PROVIDER?.toLowerCase() || "anthropic";
    const customModel = process.env.AI_MODEL;

    const defaultModels = {
        anthropic: "claude-sonnet-4-5-20250929",
        openai: "gpt-5.1",
        google: "gemini-1.5-flash",
    };

    return {
        provider,
        model: customModel || defaultModels[provider as keyof typeof defaultModels] || "unknown",
    };
}
