import Anthropic from "@anthropic-ai/sdk";
import type { GeneratedProject, GeneratedFile } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getBaseTemplate, TEMPLATE_VERSION, isCoreFile } from "@/lib/templates/react-native-base";
import { walletManager } from "@/lib/wallet";

const anthropicClient = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 300000, // 5 minutes
      maxRetries: 2,
    })
  : null;

const SYSTEM_PROMPT = `You are an elite React Native and Expo architect. You build production-ready mobile apps that work perfectly on first run.

# CORE PRINCIPLES

1. **COMPLETE IMPLEMENTATIONS ONLY** - Every feature must be fully functional, no TODOs or placeholders
2. **PRODUCTION QUALITY** - Code should be clean, maintainable, and follow best practices
3. **USER EXPERIENCE FIRST** - Smooth animations, proper loading states, error handling
4. **TYPE SAFETY** - Proper TypeScript interfaces and type checking throughout

# TECHNICAL REQUIREMENTS

## Stack (EXACT versions - do not deviate)
- expo: ~53.0.0
- expo-router: ~5.0.0
- expo-status-bar: ~2.2.0
- react: 19.0.0
- react-native: 0.79.3
- typescript: ~5.8.3

## Architecture Rules
1. Use Expo Router for navigation (file-based routing)
2. Keep state management simple - useState/useReducer only
3. No external state libraries (no Redux, Zustand, etc.)
4. All styles via StyleSheet.create() - no inline styles
5. Proper separation of concerns - extract components when needed

## Design System (STRICT - use these exact colors)
- **Background**: #0f172a (slate-950)
- **Surface**: #1e293b (slate-800)
- **Border**: #334155 (slate-700)
- **Text Primary**: #f8fafc (slate-50)
- **Text Secondary**: #94a3b8 (slate-400)
- **Primary**: #2563eb (blue-600)
- **Success**: #10b981 (emerald-500)
- **Warning**: #f59e0b (amber-500)
- **Danger**: #ef4444 (red-500)

## UX Requirements
1. **Touch targets**: Minimum 44x44 pixels
2. **Status bar**: Use paddingTop: 60 for safe area
3. **Loading states**: Show loading indicators for async operations
4. **Empty states**: Proper messaging when no data
5. **Error handling**: User-friendly error messages
6. **Feedback**: Visual feedback for all interactions

# WHAT YOU MUST GENERATE

## Required Files (ALL must be included)
1. **package.json** - Complete dependencies and scripts
2. **app.json** - Full Expo configuration
3. **tsconfig.json** - TypeScript config
4. **app/_layout.tsx** - Root layout (keep simple, just Stack navigator)
5. **app/index.tsx** - Main app screen with ALL functionality

## Core File Templates (USE THESE EXACTLY)

### package.json structure:
{
  "name": "kebab-case-name",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~53.0.0",
    "expo-router": "~5.0.0",
    "expo-status-bar": "~2.2.0",
    "react": "19.0.0",
    "react-native": "0.79.3"
  },
  "devDependencies": {
    "@types/react": "~19.0.10",
    "typescript": "~5.8.3"
  }
}

### app.json structure:
{
  "expo": {
    "name": "Display Name",
    "slug": "kebab-case-slug",
    "version": "1.0.0",
    "scheme": "appscheme",
    "platforms": ["ios", "android"],
    "ios": { "bundleIdentifier": "com.appforge.appname" },
    "android": { "package": "com.appforge.appname" }
  }
}

### app/_layout.tsx (USE THIS EXACT CODE):
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="light" />
    </>
  );
}

# CODE QUALITY STANDARDS

## TypeScript
- Define interfaces for all data structures
- Use proper typing for useState, function parameters, and return types
- No 'any' types - use proper types or 'unknown' with type guards

## Component Structure
- Functional components with hooks
- Destructure props in parameters
- Define prop interfaces
- Export default at bottom

## State Management
- Use useState for simple state
- Use useReducer for complex state (3+ related state variables)
- Keep state as close to usage as possible
- Don't over-optimize - prefer clarity

## Styling
- One StyleSheet.create() per component at bottom
- Organize styles logically (container, content, buttons, text)
- Use consistent spacing (8px grid: 8, 16, 24, 32, 40)
- Proper flexbox usage

## Performance
- Avoid unnecessary re-renders
- Use useCallback for event handlers passed to children
- Use useMemo for expensive calculations
- FlatList for lists >20 items

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
    },
    {
      "path": "app.json",
      "language": "json",
      "content": "..."
    },
    {
      "path": "tsconfig.json",
      "language": "json",
      "content": "..."
    },
    {
      "path": "app/_layout.tsx",
      "language": "typescript",
      "content": "..."
    },
    {
      "path": "app/index.tsx",
      "language": "typescript",
      "content": "..."
    }
  ]
}

# EXAMPLES OF EXCELLENCE

## Good State Management:
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

const [todos, setTodos] = useState<Todo[]>([]);
const [newTodoText, setNewTodoText] = useState("");

const addTodo = () => {
  if (!newTodoText.trim()) return;
  const todo: Todo = {
    id: Date.now().toString(),
    text: newTodoText.trim(),
    completed: false,
    createdAt: Date.now()
  };
  setTodos([todo, ...todos]);
  setNewTodoText("");
};

## Good Component Structure:
interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <View style={styles.todoItem}>
      <TouchableOpacity onPress={() => onToggle(todo.id)}>
        {/* ... */}
      </TouchableOpacity>
    </View>
  );
}

## Good Error Handling:
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

const loadData = async () => {
  try {
    setLoading(true);
    setError(null);
    // ... load data
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load data");
  } finally {
    setLoading(false);
  }
};

Remember: The app must work PERFECTLY on first run. Users should be impressed by the quality.`;

export const runtime = "nodejs";

// Credit costs for different operations
const GENERATION_COST = 5; // Credits per full app generation

export async function POST(req: Request) {
  try {
    const { prompt, streaming = true } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check credits and reserve if user is authenticated
    if (user) {
      const hasCredits = await walletManager.reserve(user.id, GENERATION_COST);
      if (!hasCredits) {
        return Response.json(
          { success: false, error: `Insufficient credits. You need at least ${GENERATION_COST} credits to generate an app.` },
          { status: 402 } // Payment Required
        );
      }
    }

    // If streaming is disabled, use the old behavior
    if (!streaming) {
      try {
        const project = await resolveProject(prompt);

        // Validate project structure
        if (!project.files || project.files.length === 0) {
          throw new Error("Generated project has no files");
        }

        let projectId: string | null = null;

        // Save to database if user is authenticated
        if (user) {
          try {
            // Create project record with template version
            const { data: dbProject, error: projectError } = await supabase
              .from("projects")
              .insert({
                user_id: user.id,
                name: project.projectName,
                description: project.description || "",
                template_version: TEMPLATE_VERSION,
              })
              .select()
              .single();

            if (projectError) throw projectError;

            projectId = dbProject.id;

            // Save all files to project_files table
            const fileRecords = project.files.map((file) => ({
              project_id: projectId,
              path: file.path,
              content: file.content,
              language: file.language || inferLanguage(file.path),
            }));

            const { error: filesError } = await supabase
              .from("project_files")
              .insert(fileRecords);

            if (filesError) {
              console.error("Failed to save files:", filesError);
              // Don't fail the whole request if file saving fails
            }

            console.log(`[Generate] Saved project ${projectId} with ${project.files.length} files`);

            // Deduct credits after successful generation
            await walletManager.settle(user.id, GENERATION_COST, GENERATION_COST);
          } catch (dbError) {
            console.error("Database error:", dbError);
            // Refund credits on error
            await walletManager.settle(user.id, GENERATION_COST, 0);
            throw dbError;
          }
        }

        return Response.json({
          success: true,
          message: `Created "${project.projectName}" with ${project.files.length} files`,
          project,
          projectId, // Include projectId for frontend to track
          filesCreated: project.files.map((file) => file.path),
        });
      } catch (error) {
        // Release reserved credits on error
        if (user) {
          await walletManager.settle(user.id, GENERATION_COST, 0);
        }
        throw error;
      }
    }

    // Streaming response using Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "status", message: "Starting generation..." })}\n\n`)
          );

          let project: GeneratedProject;

          // Generate with progress updates
          if (!anthropicClient) {
            console.log("[Generate] No API key, using mock project");
            project = buildMockProject(prompt);

            // Send progress for mock
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "progress", chunk: "Generating mock project..." })}\n\n`)
            );
          } else {
            try {
              console.log("[Generate] Calling Claude API with streaming...");

              // Send status: Reading prompt
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "status", message: "Reading your prompt..." })}\n\n`)
              );

              project = await generateWithClaude(prompt, (chunk: string) => {
                // Send each chunk as it arrives
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "progress", chunk })}\n\n`)
                );
              });

              console.log("[Generate] Successfully generated project:", project.projectName);

              // Send status: Code generated
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "status", message: "Code generation complete" })}\n\n`)
              );
            } catch (error) {
              console.error("[Generate] Claude API failed:", error);
              console.log("[Generate] Falling back to mock project");

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "status", message: "API failed, using fallback..." })}\n\n`)
              );

              project = buildMockProject(prompt);
            }
          }

          // Validate project structure
          if (!project.files || project.files.length === 0) {
            throw new Error("Generated project has no files");
          }

          // Send status update
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "status", message: "Saving to database..." })}\n\n`)
          );

          let projectId: string | null = null;

          // Save to database if user is authenticated
          if (user) {
            try {
              // Create project record with template version
              const { data: dbProject, error: projectError } = await supabase
                .from("projects")
                .insert({
                  user_id: user.id,
                  name: project.projectName,
                  description: project.description || "",
                  template_version: TEMPLATE_VERSION,
                })
                .select()
                .single();

              if (projectError) throw projectError;

              projectId = dbProject.id;

              // Save all files to project_files table
              const fileRecords = project.files.map((file) => ({
                project_id: projectId,
                path: file.path,
                content: file.content,
                language: file.language || inferLanguage(file.path),
              }));

              const { error: filesError } = await supabase
                .from("project_files")
                .insert(fileRecords);

              if (filesError) {
                console.error("Failed to save files:", filesError);
              }

              console.log(`[Generate] Saved project ${projectId} with ${project.files.length} files`);

              // Send status: Files saved
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "status", message: `Saved ${project.files.length} files` })}\n\n`)
              );

              // Deduct credits after successful generation
              await walletManager.settle(user.id, GENERATION_COST, GENERATION_COST);
            } catch (dbError) {
              console.error("Database error:", dbError);
              // Refund credits on error
              await walletManager.settle(user.id, GENERATION_COST, 0);
              throw dbError;
            }
          }

          // Send final result
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                success: true,
                message: `Created "${project.projectName}" with ${project.files.length} files`,
                project,
                projectId,
                filesCreated: project.files.map((file) => file.path),
              })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          console.error("Generation error:", error);
          const errorMessage = error instanceof Error ? error.message : "Failed to generate app";

          // Refund credits on error
          if (user) {
            await walletManager.settle(user.id, GENERATION_COST, 0);
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                success: false,
                error: errorMessage,
              })}\n\n`
            )
          );

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate app";
    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function resolveProject(prompt: string): Promise<GeneratedProject> {
  if (!anthropicClient) {
    console.log("[Generate] No API key, using mock project");
    return buildMockProject(prompt);
  }

  try {
    console.log("[Generate] Calling Claude API...");
    const project = await generateWithClaude(prompt);
    console.log("[Generate] Successfully generated project:", project.projectName);
    return project;
  } catch (error) {
    console.error("[Generate] Claude API failed:", error);
    console.log("[Generate] Falling back to mock project");
    return buildMockProject(prompt);
  }
}

async function generateWithClaude(
  prompt: string,
  onProgress?: (chunk: string) => void
): Promise<GeneratedProject> {
  if (!anthropicClient) {
    throw new Error("Anthropic client not configured");
  }

  console.log("[Generate] Starting streaming generation...");

  // Use streaming API with prompt caching and extended thinking
  const stream = await anthropicClient.messages.stream({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 32768,
    thinking: {
      type: "enabled",
      budget_tokens: 10000, // Allow Claude to think deeply about the code
    },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" }, // Cache the system prompt
      },
    ],
    messages: [
      {
        role: "user",
        content: `Create a mobile app for: ${prompt}

IMPORTANT REQUIREMENTS:
1. Generate COMPLETE, FULLY FUNCTIONAL code
2. Include ALL UI components with professional styling
3. Implement FULL state management (useState, useReducer)
4. Include ALL CRUD operations where applicable
5. Add proper loading states, error handling, and empty states
6. Use TypeScript interfaces for all data structures
7. Create polished, production-ready user experience

QUALITY CHECKLIST:
✓ Every button must work
✓ Every feature must be complete
✓ Professional styling throughout
✓ Proper error handling
✓ Loading indicators for async operations
✓ Empty state messaging
✓ TypeScript types for everything
✓ No TODOs, no placeholders

Think through the implementation carefully, then return ONLY valid JSON (no markdown, no code fences).`,
      },
    ],
  });

  let fullText = "";
  let lastProgressUpdate = Date.now();
  let charCount = 0;

  // Stream the response with better progress updates
  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      const text = chunk.delta.text;
      fullText += text;
      charCount += text.length;

      // Send periodic status updates (every 500ms or 500 chars)
      const now = Date.now();
      if (onProgress && (now - lastProgressUpdate > 500 || charCount > 500)) {
        // Send a progress ping to keep the UI active
        // Empty string triggers the frontend to show "Generating code..."
        onProgress("generating");
        lastProgressUpdate = now;
        charCount = 0;
      }
    }
  }

  const message = await stream.finalMessage();

  console.log("[Generate] Claude response length:", fullText.length);
  console.log("[Generate] Stop reason:", message.stop_reason);
  console.log("[Generate] Usage:", message.usage);

  // Check if response was truncated
  if (message.stop_reason === "max_tokens") {
    console.warn("[Generate] Response was truncated due to max_tokens!");
  }

  // Parse the response
  const jsonText = extractJSON(fullText);
  let parsed: GeneratedProject;

  try {
    parsed = JSON.parse(jsonText);
  } catch (parseError) {
    console.error("[Generate] JSON parse error:", parseError);
    console.error("[Generate] Raw response (first 1000 chars):", fullText.substring(0, 1000));
    console.error("[Generate] Raw response (last 500 chars):", fullText.substring(fullText.length - 500));
    throw new Error("Failed to parse Claude response as JSON - response may be truncated");
  }

  // Validate required fields
  if (!parsed.projectName || !parsed.files || !Array.isArray(parsed.files)) {
    throw new Error("Invalid project structure from Claude");
  }

  // Ensure all files have required fields
  parsed.files = parsed.files.map((file): GeneratedFile => ({
    path: file.path,
    language: file.language || inferLanguage(file.path),
    content: file.content || "",
  }));

  // Add default layout if missing
  const hasLayout = parsed.files.some((f) => f.path === "app/_layout.tsx");
  if (!hasLayout) {
    parsed.files.unshift({
      path: "app/_layout.tsx",
      language: "typescript",
      content: `import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="light" />
    </>
  );
}
`,
    });
  }

  return parsed;
}

function extractJSON(text: string): string {
  // Remove markdown code fences if present
  let cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Try to find JSON object boundaries
  const firstBrace = cleaned.indexOf("{");
  let lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  } else if (firstBrace !== -1) {
    // JSON might be truncated - try to repair it
    cleaned = cleaned.substring(firstBrace);
    cleaned = repairTruncatedJSON(cleaned);
  }

  return cleaned;
}

function repairTruncatedJSON(json: string): string {
  // Try to repair truncated JSON by closing unclosed structures
  let repaired = json;

  // Count open brackets and braces
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\") {
      escape = true;
      continue;
    }

    if (char === '"' && !escape) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{") openBraces++;
      else if (char === "}") openBraces--;
      else if (char === "[") openBrackets++;
      else if (char === "]") openBrackets--;
    }
  }

  // If we're in a string, close it
  if (inString) {
    repaired += '"';
  }

  // Close any unclosed brackets
  for (let i = 0; i < openBrackets; i++) {
    repaired += "]";
  }

  // Close any unclosed braces
  for (let i = 0; i < openBraces; i++) {
    repaired += "}";
  }

  return repaired;
}

function inferLanguage(path: string): string {
  if (path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".jsx")) return "javascript";
  if (path.endsWith(".js")) return "javascript";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".css")) return "css";
  return "text";
}

// ============================================================================
// MOCK PROJECT BUILDER (Fallback when no API key)
// ============================================================================

function buildMockProject(prompt: string): GeneratedProject {
  const name = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 30) || "demo-app";

  const displayName = name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const lowerPrompt = prompt.toLowerCase();
  const template = detectAppTemplate(lowerPrompt);

  return {
    projectName: name,
    description: template.description,
    files: [
      {
        path: "package.json",
        language: "json",
        content: JSON.stringify({
          name: name,
          version: "1.0.0",
          main: "expo-router/entry",
          scripts: {
            start: "expo start",
            android: "expo start --android",
            ios: "expo start --ios",
            web: "expo start --web"
          },
          dependencies: {
            "expo": "~53.0.0",
            "expo-router": "~5.0.0",
            "expo-status-bar": "~2.2.0",
            "react": "19.0.0",
            "react-native": "0.79.3"
          },
          devDependencies: {
            "@types/react": "~19.0.10",
            "typescript": "~5.8.3"
          }
        }, null, 2),
      },
      {
        path: "app.json",
        language: "json",
        content: JSON.stringify({
          expo: {
            name: displayName,
            slug: name,
            version: "1.0.0",
            scheme: name.replace(/-/g, ""),
            platforms: ["ios", "android"],
            ios: { bundleIdentifier: `com.appforge.${name.replace(/-/g, "")}` },
            android: { package: `com.appforge.${name.replace(/-/g, "")}` }
          }
        }, null, 2),
      },
      {
        path: "tsconfig.json",
        language: "json",
        content: JSON.stringify({
          extends: "expo/tsconfig.base",
          compilerOptions: {
            strict: true,
            paths: { "@/*": ["./*"] }
          },
          include: ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
        }, null, 2),
      },
      {
        path: "app/_layout.tsx",
        language: "typescript",
        content: `import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#f8fafc",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#0f172a" }
        }}
      />
      <StatusBar style="light" />
    </>
  );
}
`,
      },
      {
        path: "app/index.tsx",
        language: "typescript",
        content: template.indexContent,
      },
    ],
    dependencies: {
      expo: "~53.0.0",
      "expo-router": "~5.0.0",
      "expo-status-bar": "~2.2.0",
    },
  };
}

function detectAppTemplate(prompt: string): { description: string; indexContent: string } {
  // Todo/Task app
  if (prompt.includes("todo") || prompt.includes("task") || prompt.includes("checklist")) {
    return {
      description: "A todo list app with add, complete, and delete functionality.",
      indexContent: `import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { useState } from "react";

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export default function Index() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "Learn React Native", done: false },
    { id: 2, text: "Build an app", done: false },
  ]);
  const [newTodo, setNewTodo] = useState("");

  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodos([...todos, { id: Date.now(), text: newTodo, done: false }]);
    setNewTodo("");
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Tasks</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a task..."
          placeholderTextColor="#64748b"
          value={newTodo}
          onChangeText={setNewTodo}
          onSubmitEditing={addTodo}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addTodo}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.list}>
        {todos.map((todo) => (
          <View key={todo.id} style={styles.todoItem}>
            <TouchableOpacity onPress={() => toggleTodo(todo.id)} style={styles.checkbox}>
              {todo.done && <View style={styles.checked} />}
            </TouchableOpacity>
            <Text style={[styles.todoText, todo.done && styles.todoDone]}>{todo.text}</Text>
            <TouchableOpacity onPress={() => deleteTodo(todo.id)}>
              <Text style={styles.deleteBtn}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: "700", color: "#f8fafc", marginBottom: 20 },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  input: { flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14, color: "#fff", fontSize: 16 },
  addBtn: { width: 50, height: 50, backgroundColor: "#2563eb", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  addBtnText: { color: "#fff", fontSize: 28, fontWeight: "600" },
  list: { flex: 1 },
  todoItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#1e293b", padding: 16, borderRadius: 12, marginBottom: 10 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: "#3b82f6", marginRight: 12, alignItems: "center", justifyContent: "center" },
  checked: { width: 14, height: 14, borderRadius: 3, backgroundColor: "#3b82f6" },
  todoText: { flex: 1, color: "#f8fafc", fontSize: 16 },
  todoDone: { textDecorationLine: "line-through", color: "#64748b" },
  deleteBtn: { color: "#ef4444", fontSize: 24, fontWeight: "600", paddingLeft: 10 },
});
`,
    };
  }

  // Notes app
  if (prompt.includes("note") || prompt.includes("memo")) {
    return {
      description: "A simple notes app to capture your thoughts.",
      indexContent: `import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { useState } from "react";

interface Note {
  id: number;
  title: string;
  content: string;
}

export default function Index() {
  const [notes, setNotes] = useState<Note[]>([
    { id: 1, title: "Welcome", content: "Start writing your notes!" },
  ]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const addNote = () => {
    if (!title.trim()) return;
    setNotes([{ id: Date.now(), title, content }, ...notes]);
    setTitle("");
    setContent("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notes</Text>
      <View style={styles.form}>
        <TextInput style={styles.titleInput} placeholder="Title" placeholderTextColor="#64748b" value={title} onChangeText={setTitle} />
        <TextInput style={styles.contentInput} placeholder="Write something..." placeholderTextColor="#64748b" value={content} onChangeText={setContent} multiline />
        <TouchableOpacity style={styles.saveBtn} onPress={addNote}>
          <Text style={styles.saveBtnText}>Save Note</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.list}>
        {notes.map((note) => (
          <View key={note.id} style={styles.noteCard}>
            <Text style={styles.noteTitle}>{note.title}</Text>
            <Text style={styles.noteContent}>{note.content}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 20, paddingTop: 60 },
  header: { fontSize: 32, fontWeight: "700", color: "#f8fafc", marginBottom: 20 },
  form: { marginBottom: 20 },
  titleInput: { backgroundColor: "#1e293b", borderRadius: 12, padding: 14, color: "#fff", fontSize: 18, fontWeight: "600", marginBottom: 10 },
  contentInput: { backgroundColor: "#1e293b", borderRadius: 12, padding: 14, color: "#fff", fontSize: 16, minHeight: 80, textAlignVertical: "top", marginBottom: 10 },
  saveBtn: { backgroundColor: "#2563eb", borderRadius: 12, padding: 14, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  list: { flex: 1 },
  noteCard: { backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 },
  noteTitle: { fontSize: 18, fontWeight: "600", color: "#f8fafc", marginBottom: 6 },
  noteContent: { fontSize: 14, color: "#94a3b8" },
});
`,
    };
  }

  // Calculator
  if (prompt.includes("calculator") || prompt.includes("calc")) {
    return {
      description: "A simple calculator app.",
      indexContent: `import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";

export default function Index() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);

  const press = (val: string) => {
    if (display === "0" || display === "Error") setDisplay(val);
    else setDisplay(display + val);
  };

  const operate = (nextOp: string) => {
    setPrev(parseFloat(display));
    setOp(nextOp);
    setDisplay("0");
  };

  const calculate = () => {
    if (prev === null || op === null) return;
    const curr = parseFloat(display);
    let result: number | string = 0;
    if (op === "+") result = prev + curr;
    else if (op === "-") result = prev - curr;
    else if (op === "×") result = prev * curr;
    else if (op === "÷") result = curr !== 0 ? prev / curr : "Error";
    setDisplay(String(result));
    setPrev(null);
    setOp(null);
  };

  const clear = () => { setDisplay("0"); setPrev(null); setOp(null); };

  const buttons = [["7","8","9","÷"],["4","5","6","×"],["1","2","3","-"],["C","0","=","+"]];

  return (
    <View style={styles.container}>
      <Text style={styles.display}>{display}</Text>
      <View style={styles.buttons}>
        {buttons.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((btn) => (
              <TouchableOpacity
                key={btn}
                style={[styles.btn, "÷×-+=".includes(btn) && styles.opBtn, btn === "C" && styles.clearBtn]}
                onPress={() => btn === "C" ? clear() : btn === "=" ? calculate() : "÷×-+".includes(btn) ? operate(btn) : press(btn)}
              >
                <Text style={styles.btnText}>{btn}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", justifyContent: "flex-end", padding: 20 },
  display: { fontSize: 64, fontWeight: "300", color: "#fff", textAlign: "right", marginBottom: 20 },
  buttons: { gap: 12 },
  row: { flexDirection: "row", gap: 12 },
  btn: { flex: 1, aspectRatio: 1, backgroundColor: "#1e293b", borderRadius: 24, alignItems: "center", justifyContent: "center" },
  opBtn: { backgroundColor: "#f59e0b" },
  clearBtn: { backgroundColor: "#64748b" },
  btnText: { fontSize: 32, color: "#fff", fontWeight: "500" },
});
`,
    };
  }

  // Weather app
  if (prompt.includes("weather")) {
    return {
      description: "A weather display app with current conditions.",
      indexContent: `import { View, Text, StyleSheet } from "react-native";

export default function Index() {
  const weather = { temp: 72, condition: "Sunny", location: "San Francisco", high: 78, low: 65, humidity: 45 };

  return (
    <View style={styles.container}>
      <Text style={styles.location}>{weather.location}</Text>
      <Text style={styles.temp}>{weather.temp}°</Text>
      <Text style={styles.condition}>{weather.condition}</Text>
      <View style={styles.details}>
        <View style={styles.detail}><Text style={styles.detailLabel}>High</Text><Text style={styles.detailValue}>{weather.high}°</Text></View>
        <View style={styles.detail}><Text style={styles.detailLabel}>Low</Text><Text style={styles.detailValue}>{weather.low}°</Text></View>
        <View style={styles.detail}><Text style={styles.detailLabel}>Humidity</Text><Text style={styles.detailValue}>{weather.humidity}%</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0ea5e9", alignItems: "center", justifyContent: "center", padding: 20 },
  location: { fontSize: 24, color: "#fff", fontWeight: "500", marginBottom: 8 },
  temp: { fontSize: 96, color: "#fff", fontWeight: "200" },
  condition: { fontSize: 24, color: "#e0f2fe", marginBottom: 40 },
  details: { flexDirection: "row", gap: 30 },
  detail: { alignItems: "center" },
  detailLabel: { fontSize: 14, color: "#bae6fd" },
  detailValue: { fontSize: 20, color: "#fff", fontWeight: "600" },
});
`,
    };
  }

  // Default: Create a simple starter app
  return {
    description: `A mobile app for: ${prompt.slice(0, 50)}${prompt.length > 50 ? "..." : ""}`,
    indexContent: `import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";

export default function Index() {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to AppForge</Text>
      <Text style={styles.subtitle}>Your app is ready to customize!</Text>
      <View style={styles.card}>
        <Text style={styles.counter}>Tap count: {count}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => setCount((c) => c + 1)} style={styles.button}>
            <Text style={styles.buttonText}>Tap me</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCount(0)} style={[styles.button, styles.resetBtn]}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.hint}>Edit the code to build your app!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "700", color: "#f8fafc", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#94a3b8", marginBottom: 32 },
  card: { backgroundColor: "#1e293b", borderRadius: 16, padding: 24, alignItems: "center", width: "100%", maxWidth: 320 },
  counter: { fontSize: 20, color: "#f8fafc", marginBottom: 20 },
  actions: { flexDirection: "row", gap: 12 },
  button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: "#2563eb" },
  resetBtn: { backgroundColor: "#475569" },
  buttonText: { color: "white", fontWeight: "600", fontSize: 16 },
  hint: { marginTop: 32, fontSize: 14, color: "#64748b" },
});
`,
  };
}
