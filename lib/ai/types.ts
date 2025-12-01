// Common types for AI provider abstraction

export interface AIMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface AIStreamChunk {
    type: "progress" | "status" | "complete" | "error";
    content?: string;
    data?: any;
}

export interface AIGenerationOptions {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
    onProgress?: (chunk: AIStreamChunk) => void;
}

export interface AIEditOptions {
    prompt: string;
    context: string;
    maxTokens?: number;
    onProgress?: (chunk: AIStreamChunk) => void;
}

export interface GeneratedProject {
    projectName: string;
    description?: string;
    files: Array<{
        path: string;
        content: string;
        language?: string;
    }>;
}

export interface AIProvider {
    name: string;
    generateProject(options: AIGenerationOptions): Promise<GeneratedProject>;
    editCode(options: AIEditOptions): Promise<{ modifications: any[]; summary: string }>;
}

export interface AIProviderConfig {
    apiKey: string;
    model?: string;
}
