# Chef Integration Guide

## Overview

We're integrating Chef (the AI app builder by Convex) into AppForge AI to handle the code generation phase after the design wizard. This document explains the architecture and setup process.

## Architecture Decision

### Why Hybrid Approach?

Chef is built with **Remix** (not Next.js) and uses **Convex** as its database. Rather than rewriting thousands of lines of code, we're using a hybrid approach:

1. **AppForge AI** (Next.js) - Handles auth, design wizard, credit system
2. **Chef** (Remix) - Handles AI code generation, file editing, preview
3. **Bridge** - `/appbuild` route embeds Chef in an iframe with postMessage communication

### Data Flow

```
┌─────────────────────┐
│   Design Wizard     │
│   (Steps 1-6)       │
│   /wizard           │
└──────────┬──────────┘
           │
           ├─> Generates PRD
           │
           v
┌─────────────────────┐
│   /appbuild Page    │  Next.js wrapper
│   (Next.js)         │  - Loads session data
└──────────┬──────────┘  - Generates PRD from wizard
           │             - Embeds Chef in iframe
           │             - Tracks credit usage
           v
┌─────────────────────┐
│   Chef App          │  Remix app on port 5173
│   (Remix/Convex)    │  - Receives PRD via postMessage
└──────────┬──────────┘  - Generates Expo code
           │             - Shows file tree & editor
           │             - Runs Expo preview
           v
┌─────────────────────┐
│   Expo Preview      │  Mobile app running
│   (QR Code Scan)    │
└─────────────────────┘
```

## Setup Instructions

### 1. Set Up Chef Locally

The Chef repository has been cloned to `chef-temp/`. Follow these steps:

```bash
cd chef-temp

# Install Node version manager and use the correct Node version
nvm install
nvm use

# Install pnpm globally
npm install -g pnpm

# Install dependencies
pnpm i

# Create environment file
echo 'VITE_CONVEX_URL=placeholder' >> .env.local

# Set up Convex project
npx convex dev --once
# Follow the prompts to create a Convex project

# Add API keys to .env.local
# Add your AI provider keys (at least one required):
echo 'ANTHROPIC_API_KEY=your_key_here' >> .env.local
echo 'OPENAI_API_KEY=your_key_here' >> .env.local
echo 'GOOGLE_API_KEY=your_key_here' >> .env.local
```

### 2. Configure Chef OAuth (Optional for Local Dev)

For local development, you can skip this. For production:

1. Go to [Convex Dashboard](https://dashboard.convex.dev/team/settings/applications/oauth-apps)
2. Create an OAuth application
3. Set redirect URI to `http://127.0.0.1:5173`
4. Add credentials to Convex environment variables

### 3. Run Chef Backend and Frontend

In the `chef-temp` directory:

```bash
# Terminal 1: Run the frontend
pnpm run dev

# Terminal 2 (separate terminal): Run Convex backend
npx convex dev
```

Chef should now be running at `http://127.0.0.1:5173/`

### 4. Configure AppForge AI

Add Chef URL to your `.env.local`:

```env
NEXT_PUBLIC_CHEF_URL=http://127.0.0.1:5173
```

### 5. Test the Integration

1. Start your Next.js app: `npm run dev`
2. Go through the design wizard at `/wizard`
3. On Step 6, click "Start Building" (we need to add this button)
4. Should navigate to `/appbuild?sessionId=xxx`
5. The page should load Chef in an iframe with the PRD pre-filled

## Customization Tasks

### Phase 1: Make It Work
- [x] Clone Chef repository
- [x] Create `/appbuild` wrapper page
- [ ] Set up Chef locally
- [ ] Test iframe embedding
- [ ] Implement postMessage communication
- [ ] Verify PRD is received by Chef

### Phase 2: Styling Updates
- [ ] Customize Chef's color scheme to match AppForge AI
- [ ] Replace Chef logo with AppForge AI branding
- [ ] Update Chef's gradient backgrounds (orange → blue)
- [ ] Match typography and spacing
- [ ] Hide/customize Chef header

### Phase 3: Expo-Only Mode
- [ ] Modify Chef system prompt to only generate Expo code
- [ ] Remove web framework options
- [ ] Configure WebContainer for Expo dev server
- [ ] Set up QR code generation for mobile preview
- [ ] Hide web preview components

### Phase 4: Credit Integration
- [ ] Intercept AI API calls in Chef
- [ ] Send token usage to AppForge AI via postMessage
- [ ] Deduct credits from user wallet
- [ ] Show real-time credit usage in UI
- [ ] Block generation if insufficient credits

### Phase 5: Production Setup
- [ ] Deploy Chef separately (Vercel/Fly.io)
- [ ] Set up proper OAuth with Convex
- [ ] Configure CORS for iframe communication
- [ ] Add session persistence
- [ ] Implement project export functionality

## File Locations

### AppForge AI (Next.js)
- `/app/appbuild/page.tsx` - Main wrapper page that embeds Chef
- `/app/wizard/page.tsx` - Design wizard (needs "Start Building" button)
- `/app/api/design-sessions/route.ts` - Session data API
- `/docs/CHEF-INTEGRATION.md` - This file

### Chef (Remix)
- `chef-temp/app/routes/_index.tsx` - Main Chef page
- `chef-temp/app/components/` - UI components to customize
- `chef-temp/app/styles/` - Styling files to update
- `chef-temp/chef-agent/` - AI agent logic (system prompts)
- `chef-temp/convex/` - Backend database

## Communication Protocol

### Messages from AppForge → Chef

```typescript
// When Chef iframe loads and is ready
{
  type: 'LOAD_PRD',
  prd: string,  // Generated PRD markdown
  mode: 'expo-only'
}
```

### Messages from Chef → AppForge

```typescript
// When Chef is ready to receive data
{
  type: 'CHEF_READY'
}

// When AI generates code (track usage)
{
  type: 'CREDIT_USAGE',
  tokens: number,
  provider: 'anthropic' | 'openai' | 'google'
}

// When user saves the project
{
  type: 'PROJECT_SAVED',
  projectId: string
}
```

## Styling Customization

To match AppForge AI's design:

### Colors to Change in Chef

Current (Orange):
- Primary: `#FF6B2C` (orange)
- Background: `#FFFFFF` (white)

Target (Blue/Slate):
- Primary: `#3B82F6` (blue-500)
- Background: `#0F172A` (slate-950)
- Gradient: `from-slate-950 to-slate-900`

### Files to Modify

1. `chef-temp/app/styles/index.css` - Global styles
2. `chef-temp/tailwind.config.ts` - Tailwind color scheme
3. `chef-temp/app/components/Header.tsx` - Replace logo/branding
4. `chef-temp/app/root.tsx` - Meta tags and theme

## Next Steps

1. **Get Chef Running** - Follow setup instructions above
2. **Test Integration** - Verify iframe loads correctly
3. **Implement postMessage** - Set up two-way communication
4. **Customize Styling** - Match AppForge AI brand
5. **Add Expo Mode** - Configure for mobile-only generation
6. **Integrate Credits** - Track AI usage and deduct from wallet

## Resources

- [Chef Repository](https://github.com/get-convex/chef)
- [Chef Documentation](https://docs.convex.dev/chef)
- [Convex Platform](https://convex.dev)
- [Chef Prompting Guide](https://stack.convex.dev/chef-cookbook-tips-working-with-ai-app-builders)

---

**Note**: Chef is Apache 2 licensed, so we're free to modify and integrate it into AppForge AI.
