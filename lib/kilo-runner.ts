import Anthropic from "@anthropic-ai/sdk";
import fs from "fs/promises";
import path from "path";

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

const anthropic = anthropicApiKey
  ? new Anthropic({ apiKey: anthropicApiKey })
  : null;

const SYSTEM_PROMPT = `You are AppForge AI, an expert Expo + React Native engineer.
Generate production-ready code and return ONLY JSON with this shape:
{
  "files": [
    { "path": "app/index.tsx", "content": "// code" }
  ],
  "summary": "Description",
  "tokens": { "input": 0, "output": 0 }
}

IMPORTANT - CORE FILES (DO NOT MODIFY):
The following files are core template files and must NEVER be modified:
- package.json (managed by AppForge, user cannot change dependencies)
- app.json (managed by AppForge, contains app configuration)
- tsconfig.json (managed by AppForge, TypeScript configuration)
- app/_layout.tsx (managed by AppForge, root navigation layout)
- README.md (managed by AppForge, setup instructions)
- .gitignore (managed by AppForge, version control config)

You can only modify or create files in:
- app/index.tsx (main app screen)
- app/**/*.tsx (additional screens/components)
- Any new files the user requests

DO NOT include core files in your response unless explicitly asked.`;

export interface RunAiCommandOptions {
  prompt: string;
  projectId: string;
  workspacePath: string;
}

export interface AiCommandResult {
  files: { path: string; content: string }[];
  summary: string;
  tokens: { input: number; output: number };
}

export async function runAiCommand(
  options: RunAiCommandOptions
): Promise<AiCommandResult> {
  if (!anthropic) {
    return {
      files: [
        {
          path: `notes/${Date.now()}.md`,
          content: `# AI Command\n\nPrompt:\n${options.prompt}\n\n(Anthropic API key missing, placeholder file.)`,
        },
      ],
      summary: "Anthropic API key missing; wrote placeholder note.",
      tokens: { input: 0, output: 0 },
    };
  }

  const fileContext = await buildFileContext(options.workspacePath);
  const userPrompt = [
    `Project structure:\n${fileContext}`,
    `Instruction:\n${options.prompt}`,
  ].join("\n\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
    temperature: 0.2,
  });

  const contentBlock = response.content.find(
    (block) => block.type === "text"
  ) as { type: "text"; text: string } | undefined;

  if (!contentBlock) {
    throw new Error("Claude did not return text content");
  }

  const json = safeJson(contentBlock.text.trim());

  // Filter out any core files that AI might have tried to modify
  const { isCoreFile } = await import("@/lib/templates/react-native-base");
  const filteredFiles = (json.files ?? []).filter((file: { path: string }) => {
    if (isCoreFile(file.path)) {
      console.warn(`[AI Command] Blocked attempt to modify core file: ${file.path}`);
      return false;
    }
    return true;
  });

  return {
    files: filteredFiles,
    summary: json.summary ?? "No summary",
    tokens: {
      input: response.usage?.input_tokens ?? 0,
      output: response.usage?.output_tokens ?? 0,
    },
  };
}

async function buildFileContext(workspacePath: string) {
  const entries: string[] = [];
  const walk = async (dir: string) => {
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.name === ".git") continue;
      const fullPath = path.join(dir, item.name);
      const rel = path.relative(workspacePath, fullPath);
      if (item.isDirectory()) {
        entries.push(`${rel}/`);
        if (entries.length < 200) {
          await walk(fullPath);
        }
      } else {
        entries.push(rel);
      }
      if (entries.length > 200) break;
    }
  };
  try {
    await walk(workspacePath);
  } catch {
    return "(unable to read project files)";
  }
  return entries.slice(0, 200).join("\n");
}

function safeJson(text: string) {
  try {
    const normalized = text
      .replace(/```json/g, "```")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(normalized);
  } catch (error) {
    throw new Error(`Failed to parse Claude response as JSON: ${text}`);
  }
}
