# Chef Integration Progress

## ✅ Phase 1 Complete - Foundation Setup

### What We've Done:

1. **Added Chef Dependencies** ✅
   - CodeMirror (code editor)
   - AI SDK (@ai-sdk/anthropic, @ai-sdk/openai, @ai-sdk/google)
   - Convex client
   - XTerm (terminal emulator)
   - React Markdown
   - Diff library
   - All necessary UI components

2. **Installed Dependencies** ✅
   - Installed 131 new packages via pnpm
   - All dependencies resolved successfully
   - Ready to use

3. **Copied Convex Backend** ✅
   - Full `convex/` folder copied from Chef
   - Contains all backend functions for:
     - Chat storage
     - File operations
     - Project management
     - WebContainer state

4. **Environment Configuration** ✅
   - Added Convex URL to `.env.local`
   - Configured for local development
   - Ready to connect when Convex dev server runs

---

## ✅ Phase 2 Complete - Core Components

### What We've Done:

1. **Code Editor Component** ✅
   - Created `components/chef/editor/codemirror/CodeMirrorEditor.tsx`
   - Supporting files:
     - `cm-theme.ts` - VS Code dark/light theme
     - `languages.ts` - JS, TS, JSX, TSX, HTML, CSS, JSON support
     - `indent.ts` - Tab indentation handling
     - `BinaryContent.tsx` - Binary file display
   - Utility files:
     - `lib/utils/classNames.ts`
     - `lib/utils/debounce.ts`
   - Features:
     - Syntax highlighting for React Native files
     - Auto-completion
     - Dark theme (VS Code style)
     - File tabs
     - Real-time editing
     - Save with Cmd+S

2. **File Tree Component** ✅
   - Created `components/chef/FileTree.tsx`
   - Features:
     - Folder navigation with collapse/expand
     - File/folder icons
     - Selected file highlighting
     - Unsaved changes indicator
     - Diff stats (additions/deletions)
     - Hidden files filtering (node_modules, .next, etc.)

3. **Chat Interface** ✅
   - Created `components/chef/Chat.tsx`
   - Features:
     - Message history display
     - Markdown rendering with syntax highlighting
     - Code block support
     - Streaming indicator
     - Auto-scroll to latest message
     - Multi-line input with Shift+Enter

---

## ✅ Phase 3 Complete - Route Structure

### What We've Done:

1. **Convex Client Provider** ✅
   - Created `lib/convex/ConvexClientProvider.tsx`
   - Wraps app with Convex React client
   - Reads from `NEXT_PUBLIC_CONVEX_URL` env var

2. **App Build Layout** ✅
   - Created `app/appbuild/layout.tsx`
   - Wraps all /appbuild routes with ConvexClientProvider
   - Enables Convex hooks in child components

3. **Code Editor Page** ✅
   - Created `app/appbuild/[id]/page.tsx`
   - Features:
     - Three-panel layout (File Tree | Editor | Chat)
     - File selection and editing
     - AI chat interface
     - Sample Expo project structure
     - Dark theme throughout
   - Ready for Convex integration

---

## 📋 Next Steps - Phase 4

### Goal: Test and Connect to Convex

We need to:

#### 1. Code Editor Component
**From**: `chef-temp/app/components/workbench/CodeMirror.tsx`
**To**: `components/chef/CodeEditor.tsx`

Features:
- Syntax highlighting
- Auto-completion
- Multiple language support (JS, TS, CSS, HTML, JSON)
- Dark theme (VS Code style)
- File tabs
- Real-time editing

#### 2. Chat Interface
**From**: `chef-temp/app/components/chat/`
**To**: `components/chef/Chat.tsx`

Features:
- Message history
- Streaming responses
- Code block rendering
- Markdown support

#### 3. File Tree
**From**: `chef-temp/app/components/workbench/FileTree.tsx`
**To**: `components/chef/FileTree.tsx`

Features:
- Folder navigation
- File creation/deletion
- Context menu
- Drag & drop

#### 4. Preview Frame
**From**: `chef-temp/app/components/workbench/Preview.tsx`
**To**: `components/chef/Preview.tsx`

Features:
- Expo QR code
- Mobile device frame
- Live reload

---

## 🎯 Phase 3 - Route Conversion

### Main Route: Chat + Editor
**From**: `chef-temp/app/routes/chat.$id.tsx` (Remix)
**To**: `app/appbuild/[id]/page.tsx` (Next.js)

**Conversion tasks:**
- Replace Remix `loader` with Server Component data fetching
- Replace `useLoaderData()` with props
- Update navigation to use Next.js `useRouter`
- Keep Convex client calls (they work in Next.js!)

### API Routes
**From**: `chef-temp/app/routes/api.chat.ts`
**To**: `app/api/appbuild/chat/route.ts`

**What it does:**
- Streams AI responses
- Saves messages to Convex
- Handles file operations

---

## 🔐 Phase 4 - Authentication

### Replace WorkOS with Supabase

**Current (Chef)**:
```typescript
// WorkOS authentication
import { useAuth } from '@/lib/workos';
const { user } = useAuth();
```

**New (AppForge)**:
```typescript
// Supabase authentication
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

**Files to update:**
- `app/appbuild/[id]/page.tsx` - Use your auth
- `app/api/appbuild/chat/route.ts` - Check Supabase session
- Remove all WorkOS imports

---

## 🎨 Phase 5 - Customization

### Styling Updates

**Chef's current colors**:
- Primary: Orange (#FF6B2C)
- Background: White

**AppForge AI colors**:
- Primary: Blue (#3B82F6)
- Background: Slate-950 (#0F172A)
- Gradient: from-slate-950 to-slate-900

**Files to update:**
- `components/chef/CodeEditor.tsx` - Dark theme
- `components/chef/Chat.tsx` - Blue accents
- `components/chef/FileTree.tsx` - Slate backgrounds
- `app/appbuild/[id]/page.tsx` - Overall layout

### Expo-Only Configuration

**Current**: Chef generates for multiple frameworks
**Target**: Only Expo React Native

**Changes needed:**
1. Update system prompts in `convex/` backend
2. Remove web framework options from UI
3. Hard-code to Expo template
4. Update file templates

---

## 🚀 Running the Integrated App

### Terminal 1: Convex Backend
```bash
npx convex dev
```

### Terminal 2: Next.js App
```bash
npm run dev
```

### Terminal 3: (Optional) E2B Sandbox Cleanup
```bash
npm run cleanup-sandboxes
```

---

## 📁 Current Project Structure

```
appforge-ai/
├── app/
│   ├── appbuild/          # NEW - Will contain Chef integration
│   │   ├── page.tsx       # NEW - Landing/create project
│   │   └── [id]/          # NEW - Code editor + chat
│   │       └── page.tsx
│   ├── wizard/            # EXISTING - Design wizard
│   └── ...
├── components/
│   ├── chef/              # NEW - Chef components
│   │   ├── CodeEditor.tsx
│   │   ├── Chat.tsx
│   │   ├── FileTree.tsx
│   │   └── Preview.tsx
│   └── ...
├── convex/                # NEW - Convex backend (copied from Chef)
│   ├── chats.ts
│   ├── files.ts
│   ├── projects.ts
│   └── ...
├── lib/
│   ├── convex/            # NEW - Convex client utils
│   └── supabase/          # EXISTING - Your auth
└── ...
```

---

## 📊 Progress Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| **Phase 1: Foundation** | Dependencies, Convex setup | ✅ Complete |
| **Phase 2: Components** | Copy React components | 🔄 Next |
| **Phase 3: Routes** | Convert Remix to Next.js | ⏳ Pending |
| **Phase 4: Auth** | Supabase integration | ⏳ Pending |
| **Phase 5: Polish** | Styling + Expo-only | ⏳ Pending |

**Estimated time remaining**: 1-2 weeks

---

## 🎯 Immediate Next Action

**Copy the Code Editor Component**

This is the most important component. Once we have the code editor working in your Next.js app, everything else will fall into place.

**Command to run next:**
```bash
# Start Convex backend
cd /Users/dollarzv2/Documents/dev/appforge-ai
npx convex dev
```

Then we'll create the first component and test it!

---

## 💡 Key Insights

### What's Working in Our Favor:

1. **Convex is Framework-Agnostic** ✅
   - Works with both Remix and Next.js
   - No backend rewrite needed
   - Just different client setup

2. **React Components are Portable** ✅
   - Chef's components are just React
   - Copy-paste with minimal changes
   - Import paths are the main update

3. **WebContainer Works in Next.js** ✅
   - You already use `@webcontainer/api`
   - Same version as Chef
   - No special configuration needed

### What Needs Conversion:

1. **Remix Loaders → Server Components** (Medium effort)
2. **Remix Actions → Server Actions** (Medium effort)
3. **WorkOS Auth → Supabase Auth** (Easy - just swap imports)
4. **Orange Theme → Blue Theme** (Easy - CSS changes)

---

## 📞 Questions to Consider

Before we continue, think about:

1. **QR Code Generation**: Use E2B (which you have) or WebContainer?
2. **File Storage**: Where to save generated code? Convex or Supabase Storage?
3. **Credit Deduction**: When to charge - per message or per project?
4. **Template**: Use Chef's Convex template or create Expo-only template?

We can decide these as we go!

---

**Ready to continue with Phase 2?** Let me know and I'll start copying the Code Editor component!
