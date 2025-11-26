# Next.js 16 Quick Reference
## AppForge AI - Updated for Latest Next.js

**Date:** November 23, 2025

---

## What Changed from Next.js 14 → 16

### 1. React 19 by Default
```json
// package.json (automatic with Next.js 16)
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

**Benefits for Our App:**
- ✅ Better streaming (perfect for AI responses)
- ✅ Improved concurrent rendering
- ✅ Better TypeScript types
- ✅ Enhanced form handling
- ✅ New `use` hook for data fetching

---

## 2. Installation Commands (Updated)

### Create Project:
```bash
# Use @latest to get Next.js 16
pnpm create next-app@latest appforge-ai --typescript --tailwind --app
```

### shadcn/ui Updated:
```bash
# CLI name changed from shadcn-ui to shadcn
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input card
```

**Old (Next.js 14):**
```bash
pnpm dlx shadcn-ui@latest init
```

**New (Next.js 16):**
```bash
pnpm dlx shadcn@latest init
```

---

## 3. App Router Improvements

### Better Streaming for AI Responses:
```typescript
// app/api/generate/route.ts
import { StreamingTextResponse } from 'ai';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  
  // Next.js 16 has better streaming support
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });

  // More efficient streaming in Next.js 16
  return new Response(stream.toReadableStream(), {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

### Enhanced Caching:
```typescript
// Automatic request memoization (better in Next.js 16)
export async function GET() {
  // This is automatically cached and deduplicated
  const data = await fetch('https://api.example.com/data');
  return Response.json(data);
}
```

---

## 4. React 19 New Features We Can Use

### 1. `use()` Hook for Data Fetching:
```typescript
// components/ProjectList.tsx
import { use } from 'react';

async function getProjects() {
  const res = await fetch('/api/projects');
  return res.json();
}

export function ProjectList() {
  const projects = use(getProjects());
  
  return (
    <div>
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

### 2. Better Form Actions:
```typescript
// app/login/page.tsx
export default function LoginPage() {
  async function handleLogin(formData: FormData) {
    'use server'; // React 19 server actions
    
    const email = formData.get('email');
    const password = formData.get('password');
    
    // Handle login
  }
  
  return (
    <form action={handleLogin}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      <button type="submit">Login</button>
    </form>
  );
}
```

### 3. Improved useOptimistic:
```typescript
// For instant UI updates while saving
import { useOptimistic } from 'react';

export function ProjectName({ id, name }: Props) {
  const [optimisticName, setOptimisticName] = useOptimistic(name);
  
  async function updateName(newName: string) {
    setOptimisticName(newName);
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: newName })
    });
  }
  
  return (
    <input 
      value={optimisticName}
      onChange={(e) => updateName(e.target.value)}
    />
  );
}
```

---

## 5. TypeScript Improvements

### Better Type Inference:
```typescript
// app/api/generate/route.ts
// Next.js 16 has better types for Request/Response

// Old way (Next.js 14):
export async function POST(req: Request) {
  const body = await req.json() as { prompt: string };
  // Manual type assertion needed
}

// New way (Next.js 16):
export async function POST(req: Request) {
  const body = await req.json(); // Better inference
  // TypeScript knows the shape better
}
```

---

## 6. Performance Improvements

### Faster Development:
- 🚀 ~30% faster hot reload
- 🚀 Better build caching
- 🚀 Smaller bundle sizes
- 🚀 Improved tree shaking

### Production:
- ⚡ Better code splitting
- ⚡ Improved streaming
- ⚡ Enhanced caching strategies
- ⚡ Faster API routes

---

## 7. Breaking Changes to Watch For

### None for Our Use Case!
Since we're starting fresh with Next.js 16, we don't have migration issues.

**If upgrading from 14 → 16:**
- Some caching behaviors changed
- Metadata API refined
- Route handlers enhanced

**For us (new project):**
- ✅ No breaking changes
- ✅ Start with best practices
- ✅ Use latest features

---

## 8. Updated Project Setup

### Step-by-Step:
```bash
# 1. Create project
pnpm create next-app@latest appforge-ai

# Options to select:
# ✔ Would you like to use TypeScript? › Yes
# ✔ Would you like to use ESLint? › Yes
# ✔ Would you like to use Tailwind CSS? › Yes
# ✔ Would you like to use `src/` directory? › No
# ✔ Would you like to use App Router? › Yes
# ✔ Would you like to customize the default import alias? › No

# 2. Navigate
cd appforge-ai

# 3. Install dependencies
pnpm add @anthropic-ai/sdk @monaco-editor/react lucide-react \
  class-variance-authority clsx tailwind-merge zustand

# 4. Setup shadcn (note: shadcn not shadcn-ui)
pnpm dlx shadcn@latest init

# 5. Add components
pnpm dlx shadcn@latest add button input card textarea select

# 6. Environment variables
echo "ANTHROPIC_API_KEY=sk-ant-your-key" > .env.local

# 7. Start
pnpm dev
```

---

## 9. Monaco Editor with Next.js 16

### No Changes Needed!
```typescript
// components/Editor/CodeEditor.tsx
'use client'; // Still needed for client components

import Editor from '@monaco-editor/react';

export function CodeEditor({ file }: Props) {
  return (
    <Editor
      height="100%"
      language={file.language}
      value={file.content}
      theme="vs-dark"
      // Everything works the same!
    />
  );
}
```

**Monaco works perfectly with Next.js 16 + React 19** ✅

---

## 10. What This Means for Our App

### Immediate Benefits:
1. **Better AI Streaming** - React 19's improved streaming for Claude responses
2. **Faster Development** - Hot reload improvements speed up iteration
3. **Better TypeScript** - Fewer type errors, better IntelliSense
4. **Modern Foundation** - Starting with latest stable versions
5. **Future-Proof** - Next.js 16 is the current LTS

### No Downsides:
- ✅ Monaco Editor works perfectly
- ✅ All npm packages compatible
- ✅ shadcn/ui fully supported
- ✅ No migration needed
- ✅ Better performance

---

## 11. Verification

### Check Your Versions:
```bash
# After creating project
cd appforge-ai
cat package.json | grep '"next"'
# Should show: "next": "^16.0.0"

cat package.json | grep '"react"'
# Should show: "react": "^19.0.0"
```

### Test Development Server:
```bash
pnpm dev
# Should start on http://localhost:3000
# Should show Next.js 16.x.x in terminal
```

---

## 12. Quick Migration Guide (If Coming from 14)

**We're NOT migrating, but for reference:**

### If you had Next.js 14 project:
```bash
# Update dependencies
pnpm add next@latest react@latest react-dom@latest

# Update shadcn CLI usage
pnpm dlx shadcn@latest add [component]  # not shadcn-ui

# Check for breaking changes
pnpm dev
```

### For our new project:
**Nothing to migrate! Start fresh with 16.** ✅

---

## 13. Resources

### Official Docs:
- Next.js 16: https://nextjs.org/docs
- React 19: https://react.dev/blog/2024/12/05/react-19
- shadcn/ui: https://ui.shadcn.com/

### Breaking Changes:
- None that affect our stack
- Mostly internal improvements
- Better developer experience

---

## Summary: Why Next.js 16?

**Pros:**
- ✅ React 19 (better performance)
- ✅ Improved streaming (perfect for AI)
- ✅ Better TypeScript support
- ✅ Faster development
- ✅ Modern foundation
- ✅ LTS version

**Cons:**
- ❌ None for our use case

**Decision: Use Next.js 16** ✅

---

**Your Setup Command (Copy-Paste):**
```bash
pnpm create next-app@latest appforge-ai --typescript --tailwind --app && \
cd appforge-ai && \
pnpm add @anthropic-ai/sdk @monaco-editor/react lucide-react \
  class-variance-authority clsx tailwind-merge zustand && \
pnpm dlx shadcn@latest init && \
echo "ANTHROPIC_API_KEY=sk-ant-your-key" > .env.local && \
pnpm dev
```

**That's it! You're ready to build with Next.js 16.** 🚀
