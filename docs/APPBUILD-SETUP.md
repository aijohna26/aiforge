# AppBuild Editor Setup Guide

## What We Built

### Pages

1. **`/appbuild`** - Project List Page
   - Shows all Expo projects for the current session
   - "New Project" button (requires session management)
   - Demo link to `/appbuild/test`
   - Currently in "demo mode" without authentication

2. **`/appbuild/test`** - Demo Editor
   - Full code editor with syntax highlighting
   - File tree navigation
   - Default Expo template files
   - No save functionality (local only)
   - AI chat disabled (shows helpful message)

3. **`/appbuild/[id]`** - Full Editor (with valid project ID)
   - CodeMirror editor with TypeScript/React Native syntax
   - File tree with navigation
   - AI chat panel (OpenAI/Anthropic powered)
   - Auto-save to Convex storage
   - Real-time file updates

## Architecture

### Chef Components Used

The editor uses components extracted from Chef:

```
components/chef/
├── editor/codemirror/
│   ├── CodeMirrorEditor.tsx   # Main code editor
│   ├── languages.ts            # Syntax highlighting
│   ├── cm-theme.ts             # Dark theme
│   └── BinaryContent.tsx       # Binary file handling
├── FileTree.tsx                # File tree component
└── Chat.tsx                    # AI chat panel
```

### Convex Backend

```
convex/
├── projects.ts     # Project CRUD operations
├── files.ts        # File storage with Convex storage
├── ai.ts           # OpenAI/Anthropic chat integration
└── sessions.ts     # Session management (not fully integrated)
```

### Data Flow

```
┌─────────────┐
│   /appbuild │  ← Project list (demo mode)
└──────┬──────┘
       │
       ├─→ /appbuild/test          (Demo editor - no save)
       │
       └─→ /appbuild/{valid-id}    (Full editor)
            │
            ├─→ Convex queries  → Load files from storage
            ├─→ Convex actions  → Save files, AI chat
            └─→ CodeMirror      → Edit with syntax highlighting
```

## WebContainer Status

**WebContainer is NOT used in `/appbuild`**

- WebContainer location: `/lib/webcontainer-manager.ts`
- Used in: `/app/editor/page.tsx` (for web preview)
- **Why not in appbuild:** Expo is mobile-focused, uses Convex for file storage instead

### Comparison:

| Feature | `/appbuild/[id]` | `/editor` |
|---------|------------------|-----------|
| Purpose | Expo mobile apps | Web apps |
| Preview | None (mobile only) | WebContainer |
| Storage | Convex | In-memory |
| AI | Yes | Yes |
| Components | Chef | Custom |

## Current Limitations

### 1. Session Management
- No auth integration yet
- Using localStorage would work but needs proper Convex session creation
- Currently shows demo mode for all users

### 2. Project Creation
- "New Project" button redirects to demo
- Needs session management to create real projects

### 3. Missing Features
- No mobile preview (Expo is mobile-only)
- No deployment
- No file upload
- No terminal

## How to Use Right Now

### Option 1: Demo Mode
1. Visit `http://localhost:3000/appbuild`
2. Click "Open Demo"
3. Edit code in browser (changes not saved)

### Option 2: Direct URL (if you have a project ID)
1. Create a project via Convex dashboard
2. Get the project ID (format: `j97abc123...`)
3. Visit `http://localhost:3000/appbuild/{project-id}`
4. Full editor with save + AI

## Next Steps

### To Enable Full Functionality:

1. **Add Session Management**
   ```typescript
   // In app/appbuild/page.tsx
   const createSession = useMutation(api.sessions.startSession);

   // Call on page load
   const newSessionId = await createSession();
   localStorage.setItem('appforge_session_id', newSessionId);
   ```

2. **Integrate with Supabase Auth**
   - Connect Convex sessions to Supabase users
   - Add login/signup flow
   - Link projects to user accounts

3. **Add Mobile Preview** (Optional)
   - Use Expo Snack API
   - Or embed Expo Go QR code
   - Or use WebContainer for web preview

4. **Add File Upload**
   - Upload images, fonts, assets
   - Store in Convex storage
   - Reference in code

## Files Modified

### Created:
- `app/appbuild/page.tsx` - New project list page

### Fixed:
- `app/appbuild/[id]/page.tsx` - Added validation for demo/test URLs

### Existing (Unchanged):
- `components/chef/**` - Chef UI components
- `convex/files.ts` - File storage
- `convex/projects.ts` - Project management
- `convex/ai.ts` - AI chat

## Testing

```bash
# Start Convex
npx convex dev

# Start Next.js
npm run dev

# Visit:
http://localhost:3000/appbuild      # Project list
http://localhost:3000/appbuild/test # Demo editor
```

## Summary

You now have:
- ✅ Working code editor with syntax highlighting
- ✅ File tree navigation
- ✅ AI chat integration
- ✅ Auto-save to Convex (with valid project ID)
- ✅ Demo mode for testing
- ⚠️ Session management needs setup for project creation
- ⚠️ WebContainer is separate (used in `/editor` for web apps)
