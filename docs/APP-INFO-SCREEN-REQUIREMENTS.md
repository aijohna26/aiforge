# App Info Screen Requirements

## Overview
The App Info screen (Stage 1) is the entry point of the design wizard. It must capture all essential metadata and package selection to enable proper session tracking and code generation.

---

## Fields to Capture

### 1. App Metadata (Required)
```typescript
interface AppInfoForm {
  // Basic app information
  appName: string;              // REQUIRED - Used as session_name
  appDescription: string;       // REQUIRED - Brief description
  appCategory: string;          // REQUIRED - Dropdown selection
  targetAudience: string;       // REQUIRED - Who is this app for?

  // Brand colors (can be generated or manually entered)
  brandColors: {
    primary: string;            // REQUIRED - Hex color
    secondary: string;          // REQUIRED - Hex color
    accent: string;             // REQUIRED - Hex color
  };
}
```

### 2. Package Selection (Required)
```typescript
interface PackageSelection {
  selectedPackage: 'basic' | 'complete' | 'premium';
}
```

### 3. AI Intelligence Configuration (Optional - for Premium package)
```typescript
interface AIIntelligenceConfig {
  enabled: boolean;              // Enable AI features in the app
  provider: 'anthropic' | 'openai' | 'google' | 'none';
  model: string;                 // Model name
  features: {
    chatbot: boolean;            // In-app AI chatbot
    contentGeneration: boolean;  // AI-generated content
    recommendations: boolean;    // AI-powered recommendations
    search: boolean;             // AI-enhanced search
    analysis: boolean;           // Data analysis with AI
    translation: boolean;        // AI translation
  };
  customContext?: string;        // Custom AI behavior/instructions
}
```

---

## Package Options

### 📦 Basic (FREE)
- All screen mockups (PNG)
- Logo assets
- Color palette
- Design tokens (JSON)
**Cost**: 0 credits
**Features**:
- Download generated assets
- No code generation
- Manual implementation required

### 📦 Complete ⭐ (Recommended)
Everything in Basic, plus:
- React Native Expo starter code
- Component library
- Navigation setup (Expo Router)
- Theme/design system file
- TypeScript types
**Cost**: 100 credits
**Features**:
- Full working app scaffold
- Screens implemented matching mockups
- No backend/auth

### 📦 Premium
Everything in Complete, plus:
- Backend integration (Convex)
- Authentication flows (Clerk)
- State management setup
- Testing boilerplate (Jest)
- Deployment scripts
- Data model inference from screens
- **AI/LLM Integration** (Optional add-on)
  - Choose AI provider (Anthropic, OpenAI, Google)
  - In-app chatbot
  - AI-powered features
**Cost**: 250 credits (+50 credits for AI integration)
**Features**:
- Production-ready full-stack app
- Database schema generated
- Auth configured
- Tests included
- Optional: AI capabilities with selected LLM

---

## Category Options

Provide a dropdown with common app categories:
- Health & Fitness
- Social Networking
- Productivity
- Finance
- Education
- Entertainment
- Food & Drink
- Travel
- Shopping
- Business
- Utilities
- Sports
- News
- Photo & Video
- Music
- Lifestyle
- Games
- Medical
- Navigation
- Books & Reference
- Other

---

## Brand Color Selection

### Option A: Auto-Generate
- Show "Generate Colors" button
- Use AI to suggest palette based on app category and name
- Allow user to regenerate or tweak

### Option B: Manual Entry
- Provide color pickers for primary, secondary, accent
- Show color preview swatches
- Validate hex format

### Recommended UI:
```
Brand Colors:
┌────────────────────────────────────┐
│ [Auto-Generate]  [Manual Entry]    │
├────────────────────────────────────┤
│                                    │
│ Primary:   [#3B82F6] [Color picker]│
│ Secondary: [#8B5CF6] [Color picker]│
│ Accent:    [#F59E0B] [Color picker]│
│                                    │
│ Preview:                           │
│ [Primary Swatch] [Secondary] [Accent]
└────────────────────────────────────┘
```

---

## Database Integration

When user fills out the App Info form:

### 1. Create Design Session
```typescript
// POST /api/design-sessions
{
  session_name: appName,
  status: 'draft',
  current_stage: 1,
  app_name: appName,
  app_description: appDescription,
  app_category: appCategory,
  target_audience: targetAudience,
  brand_colors: {
    primary: brandColors.primary,
    secondary: brandColors.secondary,
    accent: brandColors.accent,
  },
  selected_package: selectedPackage,
  package_cost: getPackageCost(selectedPackage), // 0, 100, or 250
}
```

### 2. Store Session ID
- Store in React state/context
- Use throughout wizard
- Update session on each stage completion

### 3. Auto-save Progress
- Save on blur of each field
- Update `updated_at` timestamp
- Allow user to resume later

---

## UI Layout Recommendation

```
┌─────────────────────────────────────────────────────┐
│  App Design Wizard                          [Save]  │
│  Step 1 of 6: App Information & Package             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📱 App Details                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ App Name *                                    │ │
│  │ [________________________]                     │ │
│  │                                               │ │
│  │ Description *                                 │ │
│  │ [________________________________________]    │ │
│  │ [________________________________________]    │ │
│  │                                               │ │
│  │ Category *              Target Audience *     │ │
│  │ [Select category ▼]     [________________]   │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  🎨 Brand Colors                                    │
│  ┌───────────────────────────────────────────────┐ │
│  │ [Auto-Generate]  [Manual Entry]               │ │
│  │                                               │ │
│  │ Primary    [#3B82F6] 🎨                      │ │
│  │ Secondary  [#8B5CF6] 🎨                      │ │
│  │ Accent     [#F59E0B] 🎨                      │ │
│  │                                               │ │
│  │ Preview:  [██] [██] [██]                      │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  📦 Select Package                                  │
│  ┌───────────────────────────────────────────────┐ │
│  │  ○ Basic (FREE)                               │ │
│  │     Assets only, no code                      │ │
│  │                                               │ │
│  │  ● Complete (100 credits) ⭐ Recommended      │ │
│  │     Working React Native app                  │ │
│  │                                               │ │
│  │  ○ Premium (250 credits)                      │ │
│  │     Full-stack app with backend & auth        │ │
│  │                                               │ │
│  │  [Compare Packages]                           │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Your Credits: 500  [Add Credits]                  │
│                                                     │
│  [← Back]                      [Next: Style →]     │
└─────────────────────────────────────────────────────┘
```

---

## Validation Rules

### App Name
- Required
- Min 2 characters
- Max 50 characters
- No special characters (only letters, numbers, spaces, hyphens)

### App Description
- Required
- Min 20 characters
- Max 500 characters

### Category
- Required
- Must be from predefined list

### Target Audience
- Required
- Min 10 characters
- Max 200 characters

### Brand Colors
- All three colors required
- Must be valid hex format (#RRGGBB)
- Validate contrast ratios (accessibility)

### Package Selection
- Required
- Must select one of: basic, complete, premium
- Check user has sufficient credits for selected package

---

## API Endpoints Needed

### 1. Create Session
```typescript
POST /api/design-sessions
Body: CreateDesignSessionInput
Response: DesignSession
```

### 2. Update Session
```typescript
PATCH /api/design-sessions/:id
Body: UpdateDesignSessionInput
Response: DesignSession
```

### 3. Get User Sessions
```typescript
GET /api/design-sessions
Response: DesignSessionListItem[]
```

### 4. Resume Session
```typescript
GET /api/design-sessions/:id
Response: DesignSessionWithScreens
```

### 5. Generate Colors
```typescript
POST /api/design-sessions/generate-colors
Body: { appName: string; category: string }
Response: { primary: string; secondary: string; accent: string }
```

---

## State Management

### Context Provider
```typescript
interface DesignWizardContext {
  sessionId: string | null;
  currentStage: WizardStage;
  appInfo: AppInfoForm;
  stylePreferences: StylePreferences;
  savedLogo: string | null;
  savedScreens: DesignSessionScreen[];
  selectedPackage: PackageType;

  // Actions
  createSession: (input: CreateDesignSessionInput) => Promise<void>;
  updateSession: (input: UpdateDesignSessionInput) => Promise<void>;
  saveProgress: () => Promise<void>;
  goToStage: (stage: WizardStage) => void;
}
```

---

## Package Comparison Modal

When user clicks "Compare Packages":

```
┌─────────────────────────────────────────────────────┐
│  Package Comparison                          [✕]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Feature              Basic    Complete   Premium   │
│  ─────────────────────────────────────────────────  │
│  Screen mockups         ✓         ✓         ✓      │
│  Logo asset             ✓         ✓         ✓      │
│  Color palette          ✓         ✓         ✓      │
│  Design tokens          ✓         ✓         ✓      │
│  React Native code      ✗         ✓         ✓      │
│  Components             ✗         ✓         ✓      │
│  Navigation             ✗         ✓         ✓      │
│  Backend (Convex)       ✗         ✗         ✓      │
│  Authentication         ✗         ✗         ✓      │
│  State management       ✗         ✗         ✓      │
│  Testing setup          ✗         ✗         ✓      │
│  Deployment scripts     ✗         ✗         ✓      │
│                                                     │
│  Credits Required       0        100       250      │
│                                                     │
│  [Select Basic] [Select Complete] [Select Premium] │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: UI Components
- [ ] Create AppInfoForm component
- [ ] Add form validation with react-hook-form or zod
- [ ] Implement color picker (use @uiw/react-color or similar)
- [ ] Create package selection cards
- [ ] Build package comparison modal
- [ ] Add auto-generate colors feature

### Phase 2: API Integration
- [ ] Create /api/design-sessions endpoints
- [ ] Implement session CRUD operations
- [ ] Add auto-save functionality
- [ ] Integrate with wallet manager for credit checking
- [ ] Add color generation API endpoint

### Phase 3: State Management
- [ ] Create DesignWizardContext
- [ ] Implement session persistence
- [ ] Add resume functionality
- [ ] Handle stage navigation

### Phase 4: Database
- [ ] Run migration: 20241207_design_sessions.sql
- [ ] Test RLS policies
- [ ] Verify storage bucket permissions
- [ ] Test session CRUD operations

---

## Example Implementation

See [PRD-Review-Generate-Stage.md](./PRD-Review-Generate-Stage.md) for:
- Complete database schema
- TypeScript type definitions
- LLM system prompt for code generation
- Full PRD structure
- Convex integration details
