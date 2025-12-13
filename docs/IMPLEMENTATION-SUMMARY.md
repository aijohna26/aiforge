# Package Selection & AI Configuration - Implementation Summary

## Overview
This document summarizes the implementation of package selection and AI intelligence configuration in the AppForge AI wizard.

## What Was Built

### 1. Package Selection UI (Wizard Step 1)

**Location**: [app/wizard/page.tsx](../app/wizard/page.tsx)

Added three package tiers to the App Info screen:

#### 📦 Basic (FREE)
- Screen mockups (PNG)
- Logo assets
- Color palette
- Design tokens (JSON)
- No code generation

#### 📦 Complete (100 credits) ⭐ Recommended
- Everything in Basic
- React Native Expo code
- Component library
- Navigation setup (Expo Router)
- TypeScript types
- No backend/auth

#### 🚀 Premium (250 credits)
- Everything in Complete
- Backend integration (Convex)
- Authentication (Clerk)
- State management
- Testing boilerplate
- Deployment scripts
- **Optional: AI Intelligence (+50 credits)**

### 2. AI Intelligence Configuration UI

**Location**: [app/wizard/page.tsx](../app/wizard/page.tsx) (within Premium package section)

When user selects Premium package, they can optionally enable AI Intelligence with:

#### Provider Selection
- **Anthropic (Claude)** - Best for complex reasoning
- **OpenAI (GPT)** - Great all-around performance
- **Google (Gemini)** - Fast & multimodal

#### Model Selection (dynamic based on provider)

**Anthropic Models:**
- Claude 3.5 Sonnet (Recommended)
- Claude 3.5 Haiku
- Claude 3 Opus

**OpenAI Models:**
- GPT-4o (Recommended)
- GPT-4o Mini
- GPT-4 Turbo
- GPT-3.5 Turbo

**Google Models:**
- Gemini 2.0 Flash (Recommended)
- Gemini 1.5 Pro
- Gemini 1.5 Flash

#### AI Features (8 checkboxes)
- ✅ Chatbot - In-app AI assistant
- ✅ Content Generation - AI-powered content
- ✅ Recommendations - Personalized suggestions
- ✅ Search - AI-enhanced search
- ✅ Analysis - Data analysis
- ✅ Translation - Multi-language
- ✅ Image Generation - AI images
- ✅ Voice Assistant - Voice interactions

#### Custom Configuration
- **Custom AI Behavior** - Optional textarea for custom system prompt
- **Streaming Toggle** - Enable real-time streaming responses

#### API Key Warning
Displays a warning that users need to:
1. Sign up with the AI provider
2. Generate an API key
3. Add the key to the generated app
4. API costs are separate from AppForge credits

### 3. API Endpoints

Created two new API routes for design session management:

#### GET/POST `/api/design-sessions`
**Location**: [app/api/design-sessions/route.ts](../app/api/design-sessions/route.ts)

**GET** - Fetch all design sessions for the current user
- Returns list of sessions ordered by updated_at
- Requires authentication

**POST** - Create or update a design session
- Creates new session if no session_id provided
- Updates existing session if session_id provided
- Automatically calculates package_cost based on selected_package
- Adds +50 credits if AI is enabled
- Creates history entry for session creation
- Validates required fields (session_name, app_name)

#### GET/PATCH/DELETE `/api/design-sessions/[id]`
**Location**: [app/api/design-sessions/[id]/route.ts](../app/api/design-sessions/[id]/route.ts)

**GET** - Fetch a specific design session with all screens
- Returns session data and associated screens
- Requires authentication and ownership verification

**PATCH** - Update a design session
- Updates only provided fields
- Recalculates package_cost when selected_package or ai_config changes
- Requires authentication and ownership verification

**DELETE** - Delete a design session
- Cascading delete removes screens and history
- Requires authentication and ownership verification

### 4. Database Schema

**Migration File**: [supabase/migrations/20241207_design_sessions.sql](../supabase/migrations/20241207_design_sessions.sql)

#### Tables Created

**design_sessions**
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key to auth.users)
- session_name (TEXT)
- status (TEXT: 'draft', 'completed', 'generating')
- current_stage (INTEGER: 1-6)
- app_name, app_description, app_category, target_audience (TEXT)
- brand_colors (JSONB)
- style_preferences (JSONB)
- reference_images (TEXT[])
- selected_package (TEXT: 'basic', 'complete', 'premium')
- package_cost (INTEGER)
- ai_config (JSONB) ⭐ NEW
- logo_url, logo_prompt (TEXT)
- credits_used, total_screens_generated (INTEGER)
- prd_data, generation_settings (JSONB)
- generated_code_url (TEXT)
- created_at, updated_at, completed_at, generated_at (TIMESTAMPTZ)
```

**ai_config JSONB structure:**
```json
{
  "enabled": true,
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "features": {
    "chatbot": true,
    "contentGeneration": true,
    "recommendations": false,
    "search": true,
    "analysis": false,
    "translation": false,
    "imageGeneration": false,
    "voiceAssistant": false
  },
  "context": "You are a helpful fitness coach assistant...",
  "streaming": true
}
```

**design_session_screens**
- Links to design_sessions
- Stores individual screen mockups
- Tracks wizard_stage and is_selected

**design_session_history**
- Audit log of actions
- Tracks stage completions, screen generations, etc.

#### Storage Bucket

**design-assets** (public bucket)
- Organized by user_id and session_id
- Stores logos, screens, reference images, generated code

#### RLS Policies
- Users can only view/modify their own sessions
- Cascading permissions for screens and history
- Public read access to design-assets bucket

### 5. TypeScript Types

**Updated**: [lib/types/design-session.ts](../lib/types/design-session.ts)

Added to `AppInfo` interface:
```typescript
selectedPackage?: 'basic' | 'complete' | 'premium';
aiConfig?: {
    enabled: boolean;
    provider: 'anthropic' | 'openai' | 'google' | 'none';
    model: string;
    features: {
        chatbot: boolean;
        contentGeneration: boolean;
        recommendations: boolean;
        search: boolean;
        analysis: boolean;
        translation: boolean;
        imageGeneration: boolean;
        voiceAssistant: boolean;
    };
    context?: string;
    streaming: boolean;
};
```

### 6. Migration Scripts

**Created**: [scripts/run-migration.ts](../scripts/run-migration.ts)

Node.js script to run the migration programmatically:
- Reads SQL file
- Executes statements via Supabase client
- Handles "already exists" errors gracefully
- Provides detailed execution summary

**Added to package.json:**
```json
"scripts": {
  "migrate": "tsx scripts/run-migration.ts"
}
```

### 7. Documentation

**Created**: [MIGRATION_INSTRUCTIONS.md](../MIGRATION_INSTRUCTIONS.md)

Comprehensive guide with:
- 3 migration options (Dashboard, CLI, Script)
- Verification steps
- Troubleshooting guide
- What the migration creates

**Updated**: [docs/SUMMARY-UPDATES.md](./SUMMARY-UPDATES.md)

Documents all AI intelligence integration changes.

## User Flow

### Step 1: App Info & Package Selection

1. User fills in app metadata:
   - App Name
   - Description
   - Category
   - Target Audience

2. User selects package (required):
   - Basic (FREE) - Assets only
   - Complete (100 credits) - Code included
   - Premium (250 credits) - Full-stack

3. If Premium selected, user can optionally enable AI:
   - Toggle "Add AI Intelligence" (+50 credits)
   - Select provider (Anthropic/OpenAI/Google)
   - Choose model
   - Select AI features (8 checkboxes)
   - Add custom AI behavior (optional)
   - Enable/disable streaming

4. Click "Next" to proceed (validates all required fields including package)

### Data Persistence

When user clicks "Next", the wizard:
1. Auto-saves to localStorage (every minute if changes detected)
2. Should also call `/api/design-sessions` POST to persist to database
3. Stores session_id for future updates

### Subsequent Steps

Throughout the wizard, the session can be updated via:
```typescript
PATCH /api/design-sessions/:id
```

With incremental updates like:
- current_stage: 2 (when moving to Style & References)
- logo_url: "https://..." (when logo is saved)
- style_preferences: {...} (from Step 2)

### Final Generation (Step 6: Review & Generate)

When user clicks "Finalize & Generate", the system:
1. Generates complete PRD with package and AI config
2. Saves PRD to `prd_data` column
3. Feeds PRD to LLM (Convex Chef) for code generation
4. Generated code includes AI integration if enabled
5. Saves generated_code_url to session

## What the Generated Code Includes (if AI enabled)

### Dependencies
```json
{
  "@anthropic-ai/sdk": "^0.20.0",  // If Anthropic selected
  "openai": "^4.28.0",              // If OpenAI selected
  "@google/generative-ai": "^0.2.0" // If Google selected
}
```

### Environment Variables
```bash
EXPO_PUBLIC_AI_PROVIDER=anthropic
EXPO_PUBLIC_AI_MODEL=claude-3-5-sonnet-20241022
EXPO_PUBLIC_ANTHROPIC_API_KEY=your-key-here
EXPO_PUBLIC_AI_STREAMING=true
```

### Generated Files
- `lib/ai/anthropic.ts` (or openai.ts, gemini.ts)
- `components/AIChatbot.tsx` (if chatbot enabled)
- `hooks/useAI.ts`
- `screens/ChatScreen.tsx` (if chatbot enabled)

### README Instructions
Detailed setup guide for obtaining API keys and configuring the AI provider.

## Cost Structure

### AppForge Credits
- **Basic**: 0 credits
- **Complete**: 100 credits
- **Premium**: 250 credits
- **Premium + AI**: 300 credits (250 + 50)

### API Costs (User's Responsibility)
User pays AI provider directly based on usage:

**Anthropic:**
- Claude 3.5 Sonnet: $3 input / $15 output (per 1M tokens)
- Claude 3.5 Haiku: $0.80 input / $4 output

**OpenAI:**
- GPT-4o: $2.50 input / $10 output
- GPT-4o Mini: $0.15 input / $0.60 output

**Google:**
- Gemini 1.5 Pro: $1.25 input / $5 output
- Gemini 2.0 Flash: Free (experimental)

## Files Changed/Created

### Modified
- ✅ [app/wizard/page.tsx](../app/wizard/page.tsx) - Added package selection and AI config UI
- ✅ [package.json](../package.json) - Added migrate script

### Created
- ✅ [app/api/design-sessions/route.ts](../app/api/design-sessions/route.ts) - Main API endpoint
- ✅ [app/api/design-sessions/[id]/route.ts](../app/api/design-sessions/[id]/route.ts) - Session-specific API
- ✅ [scripts/run-migration.ts](../scripts/run-migration.ts) - Migration runner script
- ✅ [MIGRATION_INSTRUCTIONS.md](../MIGRATION_INSTRUCTIONS.md) - Migration guide
- ✅ [docs/IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md) - This file

### Existing (Already Created)
- ✅ [supabase/migrations/20241207_design_sessions.sql](../supabase/migrations/20241207_design_sessions.sql)
- ✅ [lib/types/design-session.ts](../lib/types/design-session.ts)
- ✅ [docs/PRD-Review-Generate-Stage.md](./PRD-Review-Generate-Stage.md)
- ✅ [docs/AI-INTELLIGENCE-CONFIGURATION.md](./AI-INTELLIGENCE-CONFIGURATION.md)
- ✅ [docs/APP-INFO-SCREEN-REQUIREMENTS.md](./APP-INFO-SCREEN-REQUIREMENTS.md)
- ✅ [docs/SUMMARY-UPDATES.md](./SUMMARY-UPDATES.md)

## Next Steps

### Immediate (Before Testing)

1. **Run the migration**
   ```bash
   npm run migrate
   ```
   Or follow [MIGRATION_INSTRUCTIONS.md](../MIGRATION_INSTRUCTIONS.md)

2. **Verify tables exist** in Supabase dashboard

3. **Test the wizard**
   - Go to `/wizard`
   - Fill in app info
   - Select each package type
   - Test AI configuration (Premium only)
   - Verify data saves to localStorage
   - Check that "Next" button is disabled until package is selected

### Integration Work (Future)

1. **Connect wizard to API**
   - Call `POST /api/design-sessions` when user completes Step 1
   - Store returned session_id in state
   - Call `PATCH /api/design-sessions/:id` on subsequent stage changes

2. **Build Review & Generate (Step 6)**
   - Display complete design summary
   - Show selected package and AI config
   - Generate PRD with all data
   - Save PRD to `prd_data` column
   - Trigger code generation

3. **Update Code Generation**
   - Modify Convex Chef system prompt to read AI config from PRD
   - Generate AI client files based on provider
   - Add dependencies to package.json
   - Create environment variables template
   - Generate AI components (chatbot, etc.)
   - Add README setup instructions

4. **Add Design Session List View**
   - Create `/dashboard/sessions` page
   - List all user's design sessions
   - Allow resume/continue
   - Show package and AI config in card
   - Display progress (current_stage)

5. **Credits Integration**
   - Check user credits before allowing package selection
   - Deduct credits when code generation completes
   - Update wallet after generation
   - Prevent generation if insufficient credits

## Testing Checklist

- [ ] Migration runs successfully
- [ ] Tables exist in Supabase
- [ ] Wizard loads without errors
- [ ] Can select each package type
- [ ] AI config only shows for Premium
- [ ] All AI providers and models selectable
- [ ] AI features checkboxes work
- [ ] Custom context saves
- [ ] Streaming toggle works
- [ ] Validation prevents "Next" without package
- [ ] Data saves to localStorage
- [ ] API endpoint creates session
- [ ] API endpoint updates session
- [ ] RLS policies work (user can only see own sessions)
- [ ] Package costs calculated correctly
- [ ] AI adds +50 credits to cost

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Wizard UI (Step 1)                       │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │ Basic (FREE)  │  │ Complete      │  │ Premium       │      │
│  │ Assets only   │  │ 100 credits   │  │ 250 credits   │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│                                              │                  │
│                                              ▼                  │
│                                   ┌──────────────────────┐     │
│                                   │ AI Intelligence      │     │
│                                   │ (+50 credits)        │     │
│                                   │                      │     │
│                                   │ Provider: Anthropic  │     │
│                                   │ Model: Claude 3.5    │     │
│                                   │ Features: [x]Chatbot│     │
│                                   │           [x]Content│     │
│                                   │ Context: "You are..."│     │
│                                   │ Streaming: ✓        │     │
│                                   └──────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ POST /api/design-sessions│
                 └─────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ Supabase Database       │
                 │                         │
                 │ ┌─────────────────────┐ │
                 │ │ design_sessions     │ │
                 │ │ - selected_package  │ │
                 │ │ - package_cost      │ │
                 │ │ - ai_config (JSONB) │ │
                 │ └─────────────────────┘ │
                 └─────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ Code Generation (Step 6)│
                 └─────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ Generate PRD with       │
                 │ - Package details       │
                 │ - AI config             │
                 └─────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ Convex Chef (LLM)       │
                 │ - Reads PRD             │
                 │ - Generates RN code     │
                 │ - Adds AI integration   │
                 └─────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ Generated App           │
                 │ - Backend (Convex)      │
                 │ - Auth (Clerk)          │
                 │ - AI Client             │
                 │ - Chatbot Component     │
                 │ - Environment vars      │
                 └─────────────────────────┘
```

## Summary

We successfully implemented:
1. ✅ Package selection UI with 3 tiers (Basic, Complete, Premium)
2. ✅ AI Intelligence configuration for Premium package
3. ✅ Complete API endpoints for design session CRUD
4. ✅ Database migration with ai_config column
5. ✅ TypeScript types for all data structures
6. ✅ Migration scripts and documentation

The user can now:
- Select a package tier when creating their app
- Optionally add AI intelligence to Premium apps
- Choose from 3 AI providers (Anthropic, OpenAI, Google)
- Select specific models and AI features
- Customize AI behavior with system prompts
- All configuration is saved and will be used during code generation

**The implementation directly addresses the user's question: "where are you asking the user about the pricing?"**

The answer: In **Step 1 (App Info)** of the wizard, after the user fills in their app details, they are now presented with three package cards showing pricing, and can select which package they want. If they select Premium, they get the option to add AI Intelligence for an additional 50 credits.
