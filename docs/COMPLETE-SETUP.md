# Complete AppForge Setup - Build React/Expo Apps with Chef

## What You Can Do Now

You can now build **real React/Expo applications** using the Chef code editor with full AI assistance!

## How It Works

### 1. Visit the Project List
Navigate to: `http://localhost:3000/appbuild`

### 2. Create a New Project
Click **"New Project"** button
- Creates an anonymous Convex session
- Generates a new Expo project with default template
- Saves to Convex database with storage
- Redirects to full code editor

### 3. Code with AI
You get the full Chef experience:
- **CodeMirror Editor** - Syntax highlighting for TypeScript/React Native
- **File Tree** - Navigate between files
- **AI Chat** - Ask AI to modify your code
  - Powered by OpenAI or Anthropic
  - Understands Expo/React Native
  - Makes code changes for you
- **Auto-Save** - All changes saved to Convex

### 4. Manage Projects
- View all your projects in the list
- Delete projects you don't need
- Each project persists in Convex

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User Flow                            │
└─────────────────────────────────────────────────────────┘

1. Visit /appbuild
   ↓
2. Click "New Project"
   ↓
3. System creates:
   - Anonymous session (saved to Convex)
   - New project (saved to Convex)
   - Default Expo template files
   ↓
4. Redirect to /appbuild/{project-id}
   ↓
5. Full Editor Loads:
   ┌────────────┬──────────────┬──────────┐
   │ File Tree  │   Editor     │ AI Chat  │
   │            │              │          │
   │ App.tsx ✓  │ TypeScript   │ "Add a   │
   │ package.   │ Code with    │  button  │
   │ README.md  │ syntax       │  compo-  │
   │            │ highlighting │  nent"   │
   └────────────┴──────────────┴──────────┘
```

## Tech Stack

### Frontend
- **Next.js 16** - App router
- **React 19** - Latest React
- **Tailwind CSS 4** - Styling
- **Convex React** - Real-time hooks

### Backend
- **Convex** - Database + storage + real-time
  - `sessions` table - Anonymous user sessions
  - `chats` table - Projects
  - `_storage` - File snapshots (JSON blobs)

### Editor
- **CodeMirror** - Code editor
- **@codemirror/lang-javascript** - TypeScript/JSX
- **@codemirror/search** - Find/replace
- **@codemirror/autocomplete** - IntelliSense

### AI
- **OpenAI GPT-4** - Code generation
- **Anthropic Claude** - Alternative AI
- **Vercel AI SDK** - Streaming responses

## Key Features

### 1. Anonymous Sessions
No login required! The system:
- Creates a session on first project
- Stores session ID in localStorage
- Persists across browser refreshes
- Unique to each browser

### 2. File Storage
Files are stored as JSON blobs:
```javascript
{
  "/App.tsx": {
    type: "file",
    content: "import React..."
  },
  "/package.json": {
    type: "file",
    content: "{...}"
  }
}
```

Stored in Convex storage, referenced by `snapshotId`

### 3. Auto-Save
Every edit triggers:
1. Update local state (instant)
2. Debounced save to Convex (background)
3. New snapshot created
4. Project `snapshotId` updated

### 4. AI Code Generation
Chat with AI to:
- "Add a login screen"
- "Create a profile component"
- "Add navigation"
- "Style the button"

AI understands:
- Expo React Native
- TypeScript
- React hooks
- Native components

## API Endpoints (Convex)

### Sessions
```typescript
// Create anonymous session
api.sessions.createAnonymousSession()
// Returns: Id<'sessions'>
```

### Projects
```typescript
// List projects
api.projects.list({ sessionId })
// Returns: Project[]

// Create project
api.projects.create({
  sessionId,
  name: "My App",
  description: "Description"
})
// Returns: Id<'chats'>

// Delete project
api.projects.deleteProject({ projectId })
```

### Files
```typescript
// Get project files
api.files.getProjectFiles({ projectId })
// Returns: FileMap

// Update single file
api.files.updateFile({
  projectId,
  filePath: "/App.tsx",
  content: "..."
})
```

### AI
```typescript
// Chat with AI
api.ai.chat({
  projectId,
  messages: [...],
  provider: "openai"
})
// Returns: { content: string, usage: any }
```

## Environment Variables

Required for full functionality:

```bash
# Convex (auto-configured in dev)
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
CONVEX_DEPLOYMENT=local:local-appforge-ai

# AI (add your keys)
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
```

## File Structure

```
app/
├── appbuild/
│   ├── page.tsx              # Project list
│   └── [id]/
│       └── page.tsx          # Code editor

components/
└── chef/
    ├── editor/
    │   └── codemirror/
    │       └── CodeMirrorEditor.tsx
    ├── FileTree.tsx
    └── Chat.tsx

convex/
├── sessions.ts               # Session management
├── projects.ts               # Project CRUD
├── files.ts                  # File storage
└── ai.ts                     # AI integration

lib/
├── types.ts                  # TypeScript types
└── templates/
    └── react-native-base.ts  # Default Expo template
```

## Usage Example

### 1. Start the Servers
```bash
# Terminal 1: Convex
npx convex dev

# Terminal 2: Next.js
npm run dev
```

### 2. Create a Project
1. Visit `http://localhost:3000/appbuild`
2. Click **"New Project"**
3. Wait for editor to load

### 3. Edit Code
1. Click `App.tsx` in file tree
2. Modify the code
3. See changes save automatically

### 4. Use AI
1. Type in chat: "Add a button that says Hello"
2. AI generates the code
3. Copy code to editor
4. Saved automatically

### 5. Manage Projects
1. Go back to `/appbuild`
2. See your project in the list
3. Click to open
4. Or delete if not needed

## What's Different from Chef

| Feature | Chef (Original) | AppForge |
|---------|----------------|----------|
| **Storage** | IndexedDB (local) | Convex (cloud) |
| **Auth** | WorkOS | Anonymous sessions |
| **Preview** | WebContainer | None (Expo mobile) |
| **Deploy** | Yes | Not yet |
| **AI** | Yes | Yes (same) |
| **Files** | In-memory | Convex storage |

## Limitations

### Current Limitations:
1. **No Mobile Preview** - Editor only, no live preview
   - Expo is mobile-only
   - Would need Expo Snack integration
   - Or QR code for Expo Go

2. **No Authentication** - Anonymous sessions
   - Anyone can access any project (if they have ID)
   - No user accounts
   - Sessions are browser-specific

3. **No Deployment** - Can't publish to app stores
   - Files exist in Convex
   - Can download as ZIP
   - Manual deployment needed

4. **No Terminal** - Can't run commands
   - No `npm install`
   - No `expo start`
   - Files-only editing

### Future Enhancements:
- Supabase auth integration
- Expo Snack preview
- Mobile QR code preview
- File upload
- Export to ZIP
- GitHub integration
- Deployment to Expo EAS

## Troubleshooting

### "Failed to create project"
- Check Convex is running: `npx convex dev`
- Check terminal for errors
- Try refreshing the page

### "AI chat not responding"
- Add API keys to `.env.local`
- Restart Next.js server
- Check API key is valid

### "Changes not saving"
- Check project ID is valid
- Check Convex connection
- Check browser console for errors

### "Measure loop restarted" warnings
- Harmless CodeMirror warnings
- Won't affect functionality
- Can be ignored

## Production Deployment

To deploy to production:

1. **Deploy Convex**
   ```bash
   npx convex deploy
   ```

2. **Update Environment**
   ```bash
   NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
   ```

3. **Deploy Next.js**
   ```bash
   vercel deploy
   ```

4. **Add Auth (Recommended)**
   - Integrate Supabase
   - Connect sessions to users
   - Add project permissions

## Summary

You now have a **fully functional code editor** for building React/Expo apps with AI assistance!

**What works:**
- ✅ Create projects
- ✅ Edit code with syntax highlighting
- ✅ AI code generation
- ✅ Auto-save to cloud (Convex)
- ✅ File tree navigation
- ✅ Project management

**What's next:**
- Add mobile preview
- Add authentication
- Add deployment
- Add file upload

**Try it now:**
1. Visit `http://localhost:3000/appbuild`
2. Click "New Project"
3. Start coding!
