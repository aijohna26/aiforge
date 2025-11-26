# Product Requirements Document (PRD)
## AppForge AI - Mobile App Builder (Simplified)

**Version:** 3.0 - Monaco Editor Edition  
**Date:** November 23, 2025  
**Status:** Ready to Build

---

## 1. Executive Summary

### Vision
Build an AI-powered mobile app generator using Claude + Expo/React Native. Focus on stability, great UX, and closing the deployment gap that competitors leave open.

### Key Differentiators vs Competitors
1. **Stability First** - Rork's reviews complain about bugs/crashes
2. **Free Tier** - Test before paying (Rork requires upfront payment)
3. **One Editor Forever** - Monaco from Day 1, no switching
4. **Integrated Backend** - Supabase setup built-in
5. **Clear Deployment** - Guide users to app stores

### Market Validation
- Rork: $1M ARR in 3 months, 4-person team
- Rocket.new: $15M seed funding
- Clear demand exists, execution matters

---

## 2. Core Technology Decisions

### Code Editor: Monaco (Final Decision) ⭐

**Why Monaco from Day 1:**
- ✅ Same as VS Code (familiar to users)
- ✅ Works read-only OR editable (just flip a prop)
- ✅ Built-in TypeScript IntelliSense
- ✅ Professional experience
- ✅ No refactoring needed later
- ✅ Industry standard (GitHub, StackBlitz use it)

**Installation:**
```bash
pnpm add @monaco-editor/react
```

**The Trade-off:**
- Size: ~2MB (loads in 0.3s on average connection)
- Benefit: Save 8+ hours not switching editors later
- Verdict: Worth it

**Alternative Considered:**
- Prism (100KB) - Too limited, would need switching
- CodeMirror (500KB) - Less features than Monaco
- Decision: Monaco wins

---

## 3. Tech Stack (Locked In)

### Frontend
```yaml
Framework: Next.js 16 (App Router - Latest)
Language: TypeScript
Styling: Tailwind CSS
UI Library: shadcn/ui
Code Editor: Monaco Editor ⭐ (no switching)
Icons: Lucide React
State: React Context + Zustand
React: 19 (comes with Next.js 16)
```

### Backend
```yaml
API: Next.js API Routes
Database: Supabase (Postgres)
Auth: Supabase Auth
Storage: Supabase Storage
AI: Claude Sonnet 4.5 + Haiku 4.5
Payments: Stripe
Queue: Inngest (Phase 2)
```

### Infrastructure
```yaml
Hosting: Vercel
Build System: Docker + Expo CLI (Phase 2)
Preview: Expo Dev Containers (Phase 2)
Monitoring: Sentry
Analytics: PostHog
```

---

## 4. Phase 1 - MVP (Week 1-2)

### Goal
Working prototype: User prompts → AI generates → Show code → QR preview

### Time Estimate
60-80 hours of focused work

---

### Feature 1.1: Landing Page

**Reference:** Rocket.new, Bolt.new

**What to Build:**
```
┌─────────────────────────────────────┐
│                                     │
│     AppForge AI                     │
│     Build Mobile Apps with AI       │
│                                     │
│  ┌────────────────────────────┐    │
│  │ Describe your app...       │    │
│  │                            │    │
│  └────────────────────────────┘    │
│              [Build Now]            │
│                                     │
│  ✓ Free tier  ✓ Export code        │
│                                     │
└─────────────────────────────────────┘
```

**Code:**
```typescript
// app/page.tsx
export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-white mb-4">
            Build Mobile Apps with AI
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Turn ideas into React Native apps in minutes
          </p>
          
          <div className="bg-slate-900 rounded-lg p-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the mobile app you want to build..."
              className="w-full h-32 bg-transparent text-white p-4 resize-none outline-none"
            />
            <div className="flex justify-between items-center px-4 py-2">
              <span className="text-sm text-slate-400">
                Press Enter to start building
              </span>
              <Button onClick={handleBuild}>
                Build Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Success Criteria:**
- [ ] Loads in <2 seconds
- [ ] Mobile responsive
- [ ] Clear value proposition
- [ ] Call-to-action obvious

---

### Feature 1.2: Chat Interface

**Reference:** Rocket.new, Rork

**Layout:**
```
┌─────────────────────────────────────┐
│  AppForge AI        [User Menu]     │
├─────────────────────────────────────┤
│                                     │
│  User: Build a habit tracker        │
│                                     │
│  AI: I'll create a habit tracker... │
│  • Created app/_layout.tsx          │
│  • Created app/index.tsx            │
│  • Created components/...           │
│                                     │
│  ┌────────────────────────────┐    │
│  │ Ask me... (or @ / command) │    │
│  └────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Component:**
```typescript
// components/Chat/ChatContainer.tsx
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    filesCreated?: string[];
  };
}

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      // Call API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await response.json();
      
      // Add AI response
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        metadata: {
          filesCreated: data.filesCreated,
        },
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to generate:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isGenerating && <TypingIndicator />}
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me... (or type @ to context or / to command)"
            className="flex-1 bg-slate-900 text-white px-4 py-2 rounded-lg outline-none"
            disabled={isGenerating}
          />
          <Button 
            onClick={handleSend}
            disabled={isGenerating || !input.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Success Criteria:**
- [ ] Messages display instantly
- [ ] Auto-scroll to latest
- [ ] Enter key sends message
- [ ] Disabled while generating

---

### Feature 1.3: AI Generation Endpoint

**API Route:**
```typescript
// app/api/generate/route.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert React Native/Expo developer.
Generate production-ready code for mobile apps.

CRITICAL RULES:
1. Always use Expo SDK 51+ (latest stable)
2. Use TypeScript exclusively
3. Use expo-router for navigation (file-based)
4. Use modern React hooks (no class components)
5. Include proper error boundaries
6. Add loading states for async operations
7. Make responsive designs (mobile-first)

PROJECT STRUCTURE:
app/
  _layout.tsx          # Root layout with providers
  index.tsx            # Home screen
  [feature]/           # Feature screens
components/
  ui/                  # Reusable UI components
lib/
  hooks/              # Custom hooks
  utils/              # Helper functions
constants/
  Colors.ts           # Theme colors

RESPONSE FORMAT (JSON only):
{
  "projectName": "kebab-case-name",
  "description": "Brief description",
  "files": [
    {
      "path": "app/_layout.tsx",
      "content": "// Full file content",
      "language": "typescript"
    }
  ],
  "dependencies": {
    "expo": "~51.0.0"
  }
}

Do NOT include markdown, explanations, or anything outside JSON.`;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse response
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Extract JSON from response
    let jsonText = content.text;
    // Remove markdown code fences if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const project = JSON.parse(jsonText);

    return Response.json({
      success: true,
      message: `Created ${project.projectName} with ${project.files.length} files`,
      project,
      filesCreated: project.files.map((f: any) => f.path),
    });
  } catch (error) {
    console.error('Generation error:', error);
    return Response.json(
      { success: false, error: 'Failed to generate app' },
      { status: 500 }
    );
  }
}
```

**Success Criteria:**
- [ ] Returns valid JSON
- [ ] Files have correct structure
- [ ] TypeScript compiles
- [ ] Response time <30 seconds

---

### Feature 1.4: File Tree

**Reference:** Rocket.new, Rork

**Component:**
```typescript
// components/FileTree/FileTree.tsx
interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export function FileTree({ 
  files, 
  onFileSelect 
}: { 
  files: FileNode[];
  onFileSelect: (path: string) => void;
}) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set(['/'])
  );
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const handleSelect = (path: string, type: string) => {
    if (type === 'file') {
      setSelectedPath(path);
      onFileSelect(path);
    } else {
      toggleExpand(path);
    }
  };

  return (
    <div className="h-full bg-slate-900 border-r border-slate-800">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">Explorer</span>
        <Button variant="ghost" size="sm">
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-2">
        {files.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            level={0}
            isExpanded={expandedPaths.has(node.path)}
            isSelected={selectedPath === node.path}
            onToggle={toggleExpand}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}

function FileTreeNode({ 
  node, 
  level, 
  isExpanded, 
  isSelected,
  onToggle,
  onSelect 
}: any) {
  const Icon = node.type === 'folder' 
    ? (isExpanded ? FolderOpen : Folder)
    : File;

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 px-2 py-1 rounded cursor-pointer
          hover:bg-slate-800
          ${isSelected ? 'bg-slate-800' : ''}
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelect(node.path, node.type)}
      >
        {node.type === 'folder' && (
          <ChevronRight 
            className={`h-4 w-4 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        )}
        <Icon className="h-4 w-4 text-slate-400" />
        <span className="text-sm text-slate-300">{node.name}</span>
      </div>
      
      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              isExpanded={expandedPaths.has(child.path)}
              isSelected={selectedPath === child.path}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Success Criteria:**
- [ ] Renders 100+ files smoothly
- [ ] Expand/collapse works
- [ ] Selection highlights
- [ ] Keyboard navigation

---

### Feature 1.5: Code Editor (Monaco) ⭐

**Reference:** Rocket.new, VS Code

**Component:**
```typescript
// components/Editor/CodeEditor.tsx
'use client';

import Editor from '@monaco-editor/react';
import { useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';

interface CodeEditorProps {
  file: {
    path: string;
    content: string;
    language: string;
  };
  onChange?: (value: string) => void;
  readOnly?: boolean; // Phase 1: true, Phase 2: false
}

export function CodeEditor({ 
  file, 
  onChange, 
  readOnly = true 
}: CodeEditorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path.split('/').pop() || 'file.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <span className="text-sm font-mono text-slate-300">
          {file.path}
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-slate-800 rounded transition-colors"
            title="Copy code"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-slate-400" />
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-slate-800 rounded transition-colors"
            title="Download file"
          >
            <Download className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-400">Loading editor...</span>
            </div>
          </div>
        )}
        
        <Editor
          height="100%"
          language={file.language}
          value={file.content}
          theme="vs-dark"
          onChange={onChange}
          onMount={() => setIsLoading(false)}
          options={{
            // Viewing (always on)
            readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderLineHighlight: 'all',
            tabSize: 2,
            insertSpaces: true,
            
            // Editing (disabled in Phase 1, flip to enable in Phase 2)
            quickSuggestions: !readOnly,
            suggestOnTriggerCharacters: !readOnly,
            formatOnPaste: !readOnly,
            formatOnType: !readOnly,
            
            // UI
            renderWhitespace: 'selection',
            folding: true,
            foldingStrategy: 'indentation',
          }}
        />
      </div>
    </div>
  );
}
```

**Key Points:**
- ✅ Read-only mode for Phase 1
- ✅ Just change `readOnly={false}` for Phase 2
- ✅ No refactoring needed
- ✅ Copy and download built-in
- ✅ Professional experience from Day 1

**Success Criteria:**
- [ ] Loads in <2 seconds
- [ ] Syntax highlighting accurate
- [ ] Copy works
- [ ] Download works
- [ ] Handles 10k+ line files
- [ ] Smooth scrolling

---

### Feature 1.6: Mobile Preview Frame

**Reference:** Rork

**Component:**
```typescript
// components/Preview/MobileFrame.tsx
export function MobileFrame({ qrCode }: { qrCode?: string }) {
  return (
    <div className="h-full flex flex-col p-4 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-300">Preview</span>
        <select className="text-sm bg-slate-800 text-slate-300 px-3 py-1 rounded">
          <option>iPhone 14 Pro</option>
          <option>Pixel 7</option>
        </select>
      </div>

      {/* Device Frame */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          {/* iPhone Frame */}
          <div className="w-[375px] h-[812px] bg-slate-950 rounded-[60px] border-[14px] border-slate-900 shadow-2xl">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-900 rounded-b-3xl" />
            
            {/* Screen */}
            <div className="w-full h-full rounded-[46px] bg-slate-800 overflow-hidden flex items-center justify-center">
              {qrCode ? (
                <div className="text-center p-8">
                  <div className="w-48 h-48 bg-white rounded-lg p-4 mb-4">
                    {/* QR Code will go here */}
                    <div className="w-full h-full bg-slate-200 rounded" />
                  </div>
                  <p className="text-sm text-slate-400">
                    Scan with Expo Go
                  </p>
                </div>
              ) : (
                <div className="text-center p-8">
                  <p className="text-slate-500 mb-2">No preview yet</p>
                  <p className="text-xs text-slate-600">
                    Generate an app to see preview
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-slate-800 rounded-lg">
        <h3 className="text-sm font-medium text-slate-300 mb-2">
          Test on your phone
        </h3>
        <ol className="text-sm text-slate-400 space-y-1">
          <li>1. Install Expo Go from App Store</li>
          <li>2. Open Camera app</li>
          <li>3. Scan QR code above</li>
          <li>4. App opens in Expo Go</li>
        </ol>
        <div className="mt-3 p-2 bg-blue-950/30 border border-blue-900/50 rounded text-xs text-blue-300">
          ℹ️ Browser preview lacks native functions. Test on device for best results.
        </div>
      </div>
    </div>
  );
}
```

**Success Criteria:**
- [ ] Frame looks realistic
- [ ] Responsive layout
- [ ] Instructions clear
- [ ] Ready for real QR in Phase 2

---

## 5. Main App Layout

**Three-Column Layout:**
```typescript
// app/editor/page.tsx
export default function EditorPage() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">AppForge AI</h1>
          {project && (
            <span className="text-sm text-slate-400">
              {project.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Export</Button>
          <Button>Launch</Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat */}
        <div className="w-80 border-r border-slate-800">
          <ChatContainer onProjectGenerated={setProject} />
        </div>

        {/* Center: File Tree + Code Editor */}
        <div className="flex-1 flex">
          <div className="w-64 border-r border-slate-800">
            <FileTree 
              files={project?.files || []}
              onFileSelect={setSelectedFile}
            />
          </div>
          <div className="flex-1">
            {selectedFile && project ? (
              <CodeEditor
                file={project.files.find(f => f.path === selectedFile)!}
                readOnly={true}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Select a file to view
              </div>
            )}
          </div>
        </div>

        {/* Right: Mobile Preview */}
        <div className="w-96 border-l border-slate-800">
          <MobileFrame qrCode={project?.previewUrl} />
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Installation & Setup

### One Command Setup:
```bash
# Create project with Next.js 16
pnpm create next-app@latest appforge-ai --typescript --tailwind --app

# Navigate
cd appforge-ai

# Install ALL dependencies (including Monaco)
pnpm add @anthropic-ai/sdk @monaco-editor/react lucide-react \
  class-variance-authority clsx tailwind-merge zustand

# Setup shadcn/ui
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input card textarea select scroll-area

# Create .env.local
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env.local

# Start dev server
pnpm dev
```

### Project Structure:
```
appforge-ai/
├── app/
│   ├── page.tsx              # Landing page
│   ├── editor/
│   │   └── page.tsx          # Main editor
│   └── api/
│       └── generate/
│           └── route.ts      # AI generation
├── components/
│   ├── Chat/
│   │   ├── ChatContainer.tsx
│   │   └── ChatMessage.tsx
│   ├── Editor/
│   │   └── CodeEditor.tsx    # Monaco Editor (one & only)
│   ├── FileTree/
│   │   └── FileTree.tsx
│   ├── Preview/
│   │   └── MobileFrame.tsx
│   └── ui/                   # shadcn components
├── lib/
│   └── types.ts              # TypeScript types
├── .env.local                # API keys
└── package.json
```

---

## 7. Phase 1 Success Criteria

### By End of Week 2:
- [ ] User can land on homepage
- [ ] User can enter prompt
- [ ] AI generates Expo project
- [ ] Files show in tree
- [ ] Clicking file shows code in Monaco
- [ ] Code is syntax highlighted
- [ ] Copy button works
- [ ] Mobile frame displays
- [ ] No critical bugs
- [ ] Responsive on desktop

### Demo Flow:
1. Visit http://localhost:3000
2. Type: "Build a simple counter app"
3. Click "Build Now"
4. See chat interface
5. Watch AI generate files
6. See file tree populate
7. Click app/index.tsx
8. See code in Monaco editor
9. Copy code successfully
10. See QR placeholder

---

## 8. Phase 2 Preview (Week 3-4)

### What Changes:
1. **Real Preview:** Spin up dedicated Expo dev containers with QR codes
2. **Enable Editing:** Change `readOnly={false}` in Monaco
3. **Live Updates:** Code changes reflect in preview
4. **Integrations:** Supabase connection panel

### What Stays Same:
- Monaco Editor (no switching!)
- Chat interface
- File tree
- Layout

---

## 9. Key Decisions Locked In

### ✅ Final Decisions:
1. **Monaco Editor** - From Day 1, forever
2. **Next.js 16** - App Router (with React 19)
3. **Supabase** - Database + Auth
4. **Claude API** - Sonnet 4.5 primary
5. **Expo/React Native** - Mobile framework
6. **Tailwind + shadcn/ui** - Styling

### ❌ Not Using:
- Prism (too limited)
- CodeMirror (Monaco is better)
- Firebase (Supabase is simpler)
- Flutter (Expo has better preview story)
- Next.js 14 or older (using latest 16)

### 🎉 Next.js 16 Benefits:
- React 19 out of the box
- Better streaming for our AI responses
- Improved App Router stability
- Enhanced caching for faster loads
- Better TypeScript support

---

## 10. Next Steps

### Today:
```bash
# 1. Install Node/pnpm if needed
brew install node@20
npm install -g pnpm

# 2. Create project with Next.js 16
pnpm create next-app@latest appforge-ai --typescript --tailwind --app
cd appforge-ai

# 3. Install dependencies
pnpm add @anthropic-ai/sdk @monaco-editor/react lucide-react \
  class-variance-authority clsx tailwind-merge

# 4. Setup shadcn (updated CLI)
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input card

# 5. Get Anthropic API key
# Visit: https://console.anthropic.com

# 6. Add to .env.local
echo "ANTHROPIC_API_KEY=your-key" > .env.local

# 7. Start coding!
pnpm dev
```

### This Week:
- [ ] Day 1: Landing page + Chat interface
- [ ] Day 2: AI generation endpoint
- [ ] Day 3: File tree component
- [ ] Day 4: Monaco editor integration
- [ ] Day 5: Mobile frame + layout
- [ ] Weekend: Polish + bug fixes

---

## Ready to Build? 🚀

**You have everything you need:**
- ✅ Clear tech stack (Next.js 16 + React 19)
- ✅ Monaco editor (no switching)
- ✅ Component examples
- ✅ API structure
- ✅ Installation commands

**Start with:**
```bash
pnpm create next-app@latest appforge-ai --typescript --tailwind --app
```

**Key Next.js 16 Benefits:**
- ✅ React 19 (better performance)
- ✅ Improved App Router
- ✅ Better streaming
- ✅ Enhanced caching
- ✅ Faster builds

Let me know when you're set up and I'll help you build the first component!
