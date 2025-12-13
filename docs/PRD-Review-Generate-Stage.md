# PRD: Review & Generate Stage - Design to Code Handoff

## Overview
The Review & Generate stage is the final step in the App Design Wizard that packages all design decisions, assets, and specifications into a structured format for LLM-based code generation using React Native Expo.

## Purpose
Prepare a comprehensive Product Requirements Document (PRD) that an LLM coding agent (built on Convex Chef) can consume to generate a complete React Native Expo application with accurate styling, screens, and components.

---

## Data Structure for Code Generation

### 1. App Metadata (Captured in App Info Stage)
```typescript
interface AppMetadata {
  projectName: string;           // e.g., "FitTrack"
  description: string;            // Brief app description
  category: string;               // e.g., "Health & Fitness", "Social", "Productivity"
  targetAudience: string;         // e.g., "Fitness enthusiasts aged 25-40"
  platform: 'ios' | 'android' | 'both';
  expoSdkVersion: string;         // e.g., "50.0.0"

  // Package & Pricing (selected in App Info or Review & Generate)
  selectedPackage: PackageType;
  packageDetails: PackageDetails;
}

type PackageType = 'basic' | 'complete' | 'premium';

interface PackageDetails {
  name: string;                   // "Basic", "Complete", "Premium"
  price: number;                  // Credits cost
  features: string[];             // List of included features
  includesBackend: boolean;
  includesAuth: boolean;
  includesTests: boolean;
  includesDeployment: boolean;
}
```

### 2. Brand & Style System
```typescript
interface BrandSystem {
  logo: {
    url: string;                  // Generated logo URL
    format: 'png' | 'svg';
    dimensions: { width: number; height: number };
  };

  colorPalette: {
    primary: string;              // Hex color
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    error: string;
    success: string;
    warning: string;
  };

  typography: {
    fontFamily: string;           // e.g., "Inter", "Roboto"
    scale: {
      h1: { size: number; weight: string; lineHeight: number };
      h2: { size: number; weight: string; lineHeight: number };
      h3: { size: number; weight: string; lineHeight: number };
      body: { size: number; weight: string; lineHeight: number };
      caption: { size: number; weight: string; lineHeight: number };
    };
  };

  spacing: {
    xs: number;                   // 4
    sm: number;                   // 8
    md: number;                   // 16
    lg: number;                   // 24
    xl: number;                   // 32
  };

  borderRadius: {
    sm: number;                   // 4
    md: number;                   // 8
    lg: number;                   // 16
    xl: number;                   // 24
  };
}
```

### 3. Style Preferences (from wizard steps)
```typescript
interface StylePreferences {
  typography: 'serif' | 'sans-serif' | 'monospace' | 'handwritten';
  uiStyle: 'minimal' | 'modern' | 'playful' | 'elegant' | 'bold';
  personality: 'professional' | 'friendly' | 'energetic' | 'calm' | 'luxurious';
  components: 'rounded' | 'sharp' | 'mixed';
}
```

### 4. Screen Assets & Specifications
```typescript
interface ScreenAsset {
  id: string;
  name: string;                   // e.g., "Home Screen", "Profile Screen"
  type: 'splash' | 'signin' | 'signup' | 'home' | 'profile' | 'settings' | 'custom';
  url: string;                    // Generated mockup URL

  // Screen analysis (extracted by LLM from mockup)
  analysis: {
    layout: 'list' | 'grid' | 'tabs' | 'stack' | 'carousel';
    components: string[];         // ["header", "search-bar", "card-list", "bottom-nav"]
    interactions: string[];       // ["tap", "swipe", "pull-to-refresh"]
    dataRequirements: string[];   // ["user-profile", "activity-list", "stats"]
  };

  // Navigation
  isInitialRoute: boolean;
  canNavigateTo: string[];        // Screen IDs this screen can navigate to
}

interface ScreenCollection {
  screens: ScreenAsset[];
  totalCount: number;
  essentialScreens: ScreenAsset[]; // Splash, SignIn, SignUp, Home
  customScreens: ScreenAsset[];
}
```

### 5. Navigation Structure
```typescript
interface NavigationStructure {
  type: 'stack' | 'tab' | 'drawer' | 'hybrid';

  stacks: {
    name: string;                 // e.g., "AuthStack", "MainStack"
    screens: string[];            // Screen IDs
    initialRoute: string;
  }[];

  tabs?: {
    screens: string[];            // Screen IDs for bottom tabs
    icons: Record<string, string>; // Icon names per screen
  };

  drawer?: {
    screens: string[];
    position: 'left' | 'right';
  };
}
```

### 6. Component Library
```typescript
interface ComponentLibrary {
  buttons: {
    primary: ButtonSpec;
    secondary: ButtonSpec;
    text: ButtonSpec;
  };

  inputs: {
    text: InputSpec;
    password: InputSpec;
    search: InputSpec;
  };

  cards: CardSpec[];

  navigation: {
    header: HeaderSpec;
    bottomTab: TabBarSpec;
  };
}

interface ButtonSpec {
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  paddingVertical: number;
  paddingHorizontal: number;
  fontSize: number;
  fontWeight: string;
}
```

### 7. Feature Requirements
```typescript
interface FeatureRequirements {
  authentication: {
    enabled: boolean;
    methods: ('email' | 'social' | 'phone')[];
    providers?: ('google' | 'apple' | 'facebook')[];
  };

  dataManagement: {
    stateManagement: 'context' | 'redux' | 'zustand' | 'none';
    backend: 'firebase' | 'supabase' | 'convex' | 'custom' | 'none';
    localStorage: boolean;
  };

  // AI/LLM Intelligence Configuration
  aiIntelligence?: {
    enabled: boolean;
    provider: 'anthropic' | 'openai' | 'google' | 'custom' | 'none';
    model: string;              // e.g., "claude-3-5-sonnet-20241022", "gpt-4o", "gemini-2.0-flash-exp"
    apiEndpoint?: string;       // Custom API endpoint if needed
    features: {
      chatbot: boolean;         // In-app AI chatbot
      contentGeneration: boolean; // AI-generated content
      recommendations: boolean; // AI-powered recommendations
      search: boolean;          // AI-enhanced search
      analysis: boolean;        // Data analysis with AI
      translation: boolean;     // AI translation
      imageGeneration: boolean; // AI image generation
      voiceAssistant: boolean;  // Voice-based AI assistant
    };
    context?: string;           // Custom system prompt/instructions for the AI
    streaming: boolean;         // Enable streaming responses
  };

  features: {
    pushNotifications: boolean;
    analytics: boolean;
    crashReporting: boolean;
    inAppPurchases: boolean;
    darkMode: boolean;
    offline: boolean;
  };
}
```

### 8. AI/LLM Intelligence Details

When `aiIntelligence.enabled === true`, the app should include AI capabilities.

#### Available LLM Providers and Models

**Anthropic (Claude)**
- `claude-3-5-sonnet-20241022` - Most intelligent, best for complex tasks
- `claude-3-5-haiku-20241022` - Fast, cost-effective for simple tasks
- `claude-3-opus-20240229` - Previous generation, very capable
- API: `https://api.anthropic.com/v1/messages`
- SDK: `@anthropic-ai/sdk`
- Rate Limits: Tier-based (check dashboard)

**OpenAI**
- `gpt-4o` - Latest, multimodal capabilities
- `gpt-4o-mini` - Faster, more affordable
- `gpt-4-turbo` - Previous generation
- `gpt-3.5-turbo` - Fast, cost-effective
- API: `https://api.openai.com/v1/chat/completions`
- SDK: `openai`
- Rate Limits: Tier-based (check dashboard)

**Google (Gemini)**
- `gemini-2.0-flash-exp` - Latest, fastest, experimental
- `gemini-1.5-pro` - Most capable, production ready
- `gemini-1.5-flash` - Fast, efficient
- API: `https://generativelanguage.googleapis.com/v1beta/models`
- SDK: `@google/generative-ai`
- Rate Limits: Free tier available

**Custom/Local**
- `ollama` - Run models locally (llama3, mistral, etc.)
- `custom` - Custom API endpoint
- Specify `apiEndpoint` for custom implementations

#### Implementation Examples

**Chat Feature with Anthropic**
```typescript
// lib/ai/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
});

export async function chat(
  message: string,
  context?: string,
  streaming: boolean = false
) {
  if (streaming) {
    return anthropic.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: context || 'You are a helpful assistant in a mobile app.',
      messages: [{ role: 'user', content: message }],
    });
  }

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: context || 'You are a helpful assistant in a mobile app.',
    messages: [{ role: 'user', content: message }],
  });

  return response.content[0].text;
}
```

**Chat Feature with OpenAI**
```typescript
// lib/ai/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

export async function chat(
  message: string,
  context?: string,
  streaming: boolean = false
) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: context || 'You are a helpful assistant in a mobile app.' },
      { role: 'user', content: message },
    ],
    stream: streaming,
  });

  if (streaming) {
    return response; // Return stream
  }

  return response.choices[0].message.content;
}
```

**Chat Feature with Google Gemini**
```typescript
// lib/ai/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GOOGLE_API_KEY!);

export async function chat(
  message: string,
  context?: string,
  streaming: boolean = false
) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    systemInstruction: context || 'You are a helpful assistant in a mobile app.',
  });

  if (streaming) {
    const result = await model.generateContentStream(message);
    return result.stream;
  }

  const result = await model.generateContent(message);
  return result.response.text();
}
```

#### React Native Chat UI Component

```typescript
// components/AIChatbot.tsx
import { useState } from 'react';
import { View, TextInput, ScrollView, Text, TouchableOpacity } from 'react-native';
import { chat } from '@/lib/ai/[provider]';

export function AIChatbot({ systemContext }: { systemContext?: string }) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await chat(userMessage, systemContext);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {messages.map((msg, idx) => (
          <View
            key={idx}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.role === 'user' ? '#3B82F6' : '#E5E7EB',
              borderRadius: 16,
              padding: 12,
              marginBottom: 8,
              maxWidth: '80%',
            }}
          >
            <Text style={{ color: msg.role === 'user' ? '#FFF' : '#000' }}>
              {msg.content}
            </Text>
          </View>
        ))}
        {loading && <Text style={{ color: '#6B7280' }}>Thinking...</Text>}
      </ScrollView>

      <View style={{ flexDirection: 'row', padding: 16, borderTopWidth: 1, borderColor: '#E5E7EB' }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: '#D1D5DB',
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 8,
            marginRight: 8,
          }}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={loading || !input.trim()}
          style={{
            backgroundColor: '#3B82F6',
            borderRadius: 24,
            paddingHorizontal: 20,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: '600' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

#### Environment Variables Template

When AI is enabled, add to `.env.example`:

```bash
# AI/LLM Configuration
EXPO_PUBLIC_AI_PROVIDER=anthropic  # or openai, google, custom
EXPO_PUBLIC_AI_MODEL=claude-3-5-sonnet-20241022

# API Keys (only include the one you're using)
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_GOOGLE_API_KEY=AI...

# AI Feature Configuration
EXPO_PUBLIC_AI_STREAMING=true
EXPO_PUBLIC_AI_MAX_TOKENS=1024
```

---

## PRD Structure for LLM Consumption

### Complete PRD Format
```typescript
interface AppDesignPRD {
  // Metadata
  version: string;                // PRD version
  generatedAt: string;            // ISO timestamp

  // Core sections
  metadata: AppMetadata;
  brandSystem: BrandSystem;
  stylePreferences: StylePreferences;
  screens: ScreenCollection;
  navigation: NavigationStructure;
  components: ComponentLibrary;
  features: FeatureRequirements;

  // Additional context
  designRationale: string;        // Why these choices were made
  technicalNotes: string[];       // Special considerations
  dependencies: string[];         // Required npm packages
}
```

---

## Review & Generate UI Components

### 1. Design Summary Section
- **Visual Grid**: Display all saved assets (logo + screens) in a grid
- **Asset Count**: Show total number of screens, logo status
- **Quick Preview**: Click any asset to view full-screen
- **Navigation Flow**: Visual diagram showing screen connections

### 2. Style System Review
Display extracted design tokens:
- Color palette swatches with hex codes
- Typography scale preview
- Spacing and border radius examples
- Component style previews (button, input, card)

### 3. Generation Options

#### Export Formats
- [ ] Download all assets (ZIP)
- [ ] Export Figma-compatible JSON
- [ ] Generate React Native starter code
- [ ] Create design system documentation

#### Code Generation Settings
```typescript
interface CodeGenerationSettings {
  // Framework
  framework: 'expo' | 'bare-react-native';
  expoRouter: boolean;            // Use Expo Router vs React Navigation
  typescript: boolean;

  // Styling
  stylingMethod: 'stylesheet' | 'styled-components' | 'tailwind' | 'nativewind';

  // Backend
  includeBackend: boolean;
  backendProvider?: 'firebase' | 'supabase' | 'convex';

  // Testing
  includeTests: boolean;
  testFramework?: 'jest' | 'vitest';

  // Code quality
  includeEslint: boolean;
  includePrettier: boolean;
  includeHusky: boolean;
}
```

### 4. Package Selection UI
```
┌─────────────────────────────────────────┐
│  📦 BASIC                               │
│  • All screen mockups (PNG)             │
│  • Logo assets                          │
│  • Color palette                        │
│  FREE                                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📦 COMPLETE ⭐ Recommended             │
│  Everything in Basic, plus:             │
│  • React Native starter code            │
│  • Component library                    │
│  • Navigation setup                     │
│  • Design tokens (JSON)                 │
│  100 credits                            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📦 PREMIUM                             │
│  Everything in Complete, plus:          │
│  • Backend integration (Convex)         │
│  • Authentication flows                 │
│  • State management setup               │
│  • Testing boilerplate                  │
│  • Deployment scripts                   │
│  250 credits                            │
└─────────────────────────────────────────┘
```

### 5. Final Customization Panel
- **Project Name**: Text input with validation
- **Bundle Identifier**: Auto-generated (com.appforge.projectname)
- **Export Preferences**: File format selections
- **Code Generation Settings**: Toggle advanced options

### 6. Action Buttons
```
[← Back to Additional Screens]  [Generate App Code →]

Secondary actions:
- Save Progress
- Download Assets Only
- Export to Figma
- Share Design Link
```

### 7. Preview Features
- **Design Consistency Check**: Automated analysis of color/spacing consistency
- **Screen Flow Visualization**: Interactive diagram showing navigation
- **Mobile Preview**: Simulated phone frame with screen transitions
- **Code Preview**: Snippet of what the generated code will look like

---

## API Endpoint for Code Generation

### `/api/generate/app`
```typescript
POST /api/generate/app

Request Body:
{
  prd: AppDesignPRD;
  settings: CodeGenerationSettings;
  packageType: 'basic' | 'complete' | 'premium';
}

Response:
{
  success: boolean;
  projectId: string;
  downloadUrl: string;          // ZIP file with generated code
  previewUrl?: string;          // Live preview URL
  generatedFiles: {
    path: string;
    content: string;
  }[];
  estimatedSetupTime: string;   // e.g., "5 minutes"
}
```

---

## LLM Prompt Template for Convex Chef Integration

### System Prompt for Code Generation Agent
```markdown
You are an expert React Native Expo developer. You will receive a Product Requirements Document (PRD) containing:
1. App metadata and target audience
2. Complete brand system (colors, typography, spacing)
3. Screen mockups with analysis
4. Navigation structure
5. Component specifications
6. Feature requirements

Your task:
- Generate a complete, production-ready React Native Expo application
- Use TypeScript for all files
- Follow the exact design specifications in the brand system
- Implement all screens matching the mockups
- Set up navigation according to the navigation structure
- Include proper error handling and loading states
- Add comments explaining key decisions
- Ensure code follows React Native best practices

Output:
- Full project structure with all necessary files
- Package.json with all dependencies
- README with setup instructions
- Environment variable template (.env.example)

Important:
- Match colors, typography, and spacing exactly as specified
- Use the specified styling method (e.g., StyleSheet, NativeWind)
- Implement navigation using Expo Router or React Navigation as specified
- Include authentication scaffolding if authentication.enabled is true
- Set up state management using the specified method
```

### User Prompt Template
```markdown
Generate a React Native Expo application based on this PRD:

{JSON.stringify(prd, null, 2)}

Code Generation Settings:
{JSON.stringify(settings, null, 2)}

Please create a complete project with:
1. App.tsx / _layout.tsx (depending on router choice)
2. All screen components matching the mockups
3. Shared components (Button, Input, Card, etc.)
4. Navigation configuration
5. Theme/design system file
6. Authentication flows (if enabled)
7. State management setup (if specified)
8. Package.json with dependencies
9. README.md with setup instructions

Ensure the app:
- Runs without errors on both iOS and Android
- Matches the design mockups exactly
- Uses the specified brand colors and typography
- Has proper TypeScript types
- Includes loading and error states
- Follows React Native best practices
```

---

## Data Flow

```
App Design Wizard
  ↓
[Review & Generate Stage]
  ↓
User Reviews & Configures
  ↓
Generate PRD (AppDesignPRD)
  ↓
Send to /api/generate/app
  ↓
Convex Chef Agent (Modified)
  ↓
- Analyze PRD
- Generate file structure
- Create components
- Set up navigation
- Apply styling
- Configure features
  ↓
Return Generated Code (ZIP)
  ↓
User Downloads & Runs
```

---

## Implementation Checklist

### Phase 1: PRD Generation
- [ ] Create AppDesignPRD TypeScript interface
- [ ] Build PRD from wizard state (metadata, brand, screens)
- [ ] Extract design tokens from generated assets
- [ ] Analyze screen mockups to identify components
- [ ] Generate navigation structure from screen relationships

### Phase 2: Review UI
- [ ] Design summary grid component
- [ ] Style system preview component
- [ ] Generation options form
- [ ] Package selection cards
- [ ] Final customization panel
- [ ] Preview features (consistency check, flow diagram)

### Phase 3: Code Generation API
- [ ] Create /api/generate/app endpoint
- [ ] Integrate with Convex Chef agent
- [ ] Modify agent prompt for React Native Expo
- [ ] Add error handling and validation
- [ ] Implement ZIP file creation
- [ ] Set up progress tracking

### Phase 4: Testing & Refinement
- [ ] Test with various app types
- [ ] Validate generated code runs without errors
- [ ] Ensure design accuracy (colors, spacing, typography match)
- [ ] Test navigation flows
- [ ] Verify all features work as expected

---

## Success Metrics

1. **Design Accuracy**: Generated app matches mockups 95%+
2. **Code Quality**: Passes ESLint with zero errors
3. **Functionality**: All screens and navigation work on first build
4. **Setup Time**: Developer can run app in < 10 minutes
5. **User Satisfaction**: 4.5+ star rating on code quality

---

---

## Supabase Database Schema for Design Sessions

### Design Session Persistence
All design wizard data must be saved to Supabase so users can:
- View a list of their design sessions
- Resume incomplete designs
- Access generated assets
- Track credits used per session

### Database Tables

#### 1. `design_sessions`
```sql
CREATE TABLE design_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session metadata
  session_name TEXT NOT NULL,           -- User-friendly name (defaults to app name)
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'completed', 'generating'
  current_stage INTEGER DEFAULT 1,      -- 1-6 (wizard stage)

  -- App Info (Stage 1)
  app_name TEXT,
  app_description TEXT,
  app_category TEXT,
  target_audience TEXT,
  brand_colors JSONB,                   -- { primary, secondary, accent }

  -- Style & References (Stage 2)
  style_preferences JSONB,              -- { typography, uiStyle, personality, components, keywords, notes }
  reference_images TEXT[],              -- Array of URLs

  -- Package Selection
  selected_package TEXT,                -- 'basic' | 'complete' | 'premium'
  package_cost INTEGER,                 -- Credits

  -- Logo (Stage 3)
  logo_url TEXT,
  logo_prompt TEXT,

  -- Tracking
  credits_used INTEGER DEFAULT 0,
  total_screens_generated INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Full PRD (stored when user clicks "Generate App Code")
  prd_data JSONB,                       -- Complete AppDesignPRD
  generation_settings JSONB,            -- CodeGenerationSettings

  -- Generated code
  generated_code_url TEXT,              -- URL to ZIP file in storage
  generated_at TIMESTAMPTZ
);

CREATE INDEX idx_design_sessions_user_id ON design_sessions(user_id);
CREATE INDEX idx_design_sessions_status ON design_sessions(status);
CREATE INDEX idx_design_sessions_created_at ON design_sessions(created_at DESC);
```

#### 2. `design_session_screens`
```sql
CREATE TABLE design_session_screens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES design_sessions(id) ON DELETE CASCADE,

  -- Screen details
  screen_type TEXT NOT NULL,            -- 'splash', 'signin', 'signup', 'home', 'custom', etc.
  screen_name TEXT NOT NULL,
  screen_url TEXT NOT NULL,             -- URL in Supabase Storage

  -- Generation details
  prompt_used TEXT,
  provider TEXT,                        -- 'gemini', 'openai'
  model TEXT,                           -- 'nano-banana', 'dall-e-3', etc.
  credits_cost INTEGER,

  -- Stage context
  wizard_stage INTEGER NOT NULL,        -- 3=Logo, 4=Key Screens, 5=Additional
  is_selected BOOLEAN DEFAULT false,    -- User selected this variation

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Reference images used
  reference_images TEXT[]
);

CREATE INDEX idx_screens_session_id ON design_session_screens(session_id);
CREATE INDEX idx_screens_type ON design_session_screens(screen_type);
```

#### 3. `design_session_history`
```sql
CREATE TABLE design_session_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES design_sessions(id) ON DELETE CASCADE,

  action TEXT NOT NULL,                 -- 'stage_completed', 'screen_generated', 'screen_edited', 'prd_generated'
  stage INTEGER,
  details JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_history_session_id ON design_session_history(session_id);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE design_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_session_screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_session_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions"
  ON design_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON design_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON design_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON design_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Similar policies for screens and history
CREATE POLICY "Users can view own screens"
  ON design_session_screens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM design_sessions
      WHERE design_sessions.id = design_session_screens.session_id
      AND design_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own screens"
  ON design_session_screens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM design_sessions
      WHERE design_sessions.id = design_session_screens.session_id
      AND design_sessions.user_id = auth.uid()
    )
  );

-- History policies
CREATE POLICY "Users can view own history"
  ON design_session_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM design_sessions
      WHERE design_sessions.id = design_session_history.session_id
      AND design_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own history"
  ON design_session_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM design_sessions
      WHERE design_sessions.id = design_session_history.session_id
      AND design_sessions.user_id = auth.uid()
    )
  );
```

### Supabase Storage Buckets

```typescript
// Storage structure
design-assets/
  {user_id}/
    {session_id}/
      logo/
        logo-{timestamp}.png
      screens/
        splash-{timestamp}.png
        signin-{timestamp}.png
        custom-{screen_id}-{timestamp}.png
      reference-images/
        ref-{timestamp}.png
      generated-code/
        {session_id}-code.zip
```

### Storage Bucket Configuration
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('design-assets', 'design-assets', true);

-- RLS for storage
CREATE POLICY "Users can upload their own assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'design-assets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'design-assets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public can view design assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'design-assets');
```

---

## Authentication Requirements

### User Authentication Flow
```typescript
interface AuthRequirements {
  // Required auth methods
  emailPassword: boolean;           // Email/password signup
  googleOAuth: boolean;             // Google OAuth
  githubOAuth: boolean;             // GitHub OAuth (optional)

  // User profile data
  requiredFields: {
    email: string;
    fullName: string;
  };

  optionalFields: {
    avatarUrl?: string;
    company?: string;
  };

  // Session management
  sessionDuration: string;          // "7 days"
  rememberMe: boolean;
}
```

### Supabase Auth Configuration
Already configured in your existing setup. Additional requirements:
- OAuth providers: Google (required), GitHub (optional)
- Email verification: Required for email/password signups
- Password reset flow
- Session refresh tokens

---

## LLM System Prompt for Convex Database Generation

### System Prompt for Convex Chef Agent

When the selected package includes backend (`packageDetails.includesBackend === true`), the LLM should:

```markdown
# System Prompt: React Native Expo + Convex Backend Generation

You are an expert full-stack React Native developer specializing in Expo and Convex.dev backends.

## Your Task

Generate a complete, production-ready React Native Expo application with a Convex backend based on the provided PRD (Product Requirements Document).

## What You Will Receive

1. **AppDesignPRD**: Complete design specifications including:
   - App metadata (name, description, category, target audience)
   - Brand system (colors, typography, spacing, border radius)
   - Style preferences (typography tone, UI style, personality)
   - Screen mockups (splash, signin, signup, custom screens)
   - Selected package (basic/complete/premium)

2. **CodeGenerationSettings**: Technical preferences including:
   - Framework choice (expo with Expo Router)
   - Styling method (StyleSheet, NativeWind, etc.)
   - Backend provider (Convex)
   - Testing requirements

## Your Responsibilities

### 1. Analyze Screen Mockups and Infer Data Model

**CRITICAL**: You must carefully analyze each screen mockup image to understand:
- What data is being displayed
- What user inputs are captured
- What entities/models are needed
- What relationships exist between entities
- What queries and mutations are needed

**Example Analysis**:
```
Screen: "Home - Activity Feed"
Visual Elements Observed:
- List of activity cards showing: user avatar, user name, activity type, timestamp, description
- Like count and comment count per activity
- Current user's profile picture in header

Inferred Data Model:
- User: { id, name, avatarUrl, email }
- Activity: { id, userId, type, description, timestamp, likeCount, commentCount }
- Need queries: getActivities, getUserProfile
- Need mutations: createActivity, likeActivity, commentActivity
```

### 2. Generate Convex Schema

Based on your analysis, create `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // Add tables based on screen analysis
  activities: defineTable({
    userId: v.id("users"),
    type: v.string(),
    description: v.string(),
    timestamp: v.number(),
    likeCount: v.number(),
    commentCount: v.number(),
  }).index("by_user", ["userId"]),

  // More tables as needed...
});
```

### 3. Generate Convex Queries

Create queries in `convex/queries.ts` for data fetching:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getActivities = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("activities")
      .order("desc")
      .take(20);
  },
});

export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});
```

### 4. Generate Convex Mutations

Create mutations in `convex/mutations.ts` for data modification:

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createActivity = mutation({
  args: {
    type: v.string(),
    description: v.string(),
  },
  handler: async (ctx, { type, description }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    return await ctx.db.insert("activities", {
      userId: user._id,
      type,
      description,
      timestamp: Date.now(),
      likeCount: 0,
      commentCount: 0,
    });
  },
});
```

### 5. Generate React Native Screens

Implement all screens from the PRD, matching the mockups exactly:

```typescript
// app/(tabs)/index.tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function HomeScreen() {
  const activities = useQuery(api.queries.getActivities);
  const createActivity = useMutation(api.mutations.createActivity);

  // Implement UI matching the mockup
  // Use exact colors from brandSystem
  // Use exact typography from brandSystem
  // Match spacing, border radius, component styles
}
```

### 6. Set Up Authentication with Convex

If `packageDetails.includesAuth === true`:

```typescript
// convex/auth.config.ts
export default {
  providers: [
    {
      domain: process.env.CLERK_DOMAIN,
      applicationID: process.env.CLERK_APP_ID,
    },
  ],
};

// app/_layout.tsx
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {/* App content */}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

### 7. Match Design Specifications EXACTLY

**Colors**: Use the exact hex values from `prd.brandSystem.colorPalette`
```typescript
const theme = {
  colors: {
    primary: "${prd.brandSystem.colorPalette.primary}",
    secondary: "${prd.brandSystem.colorPalette.secondary}",
    accent: "${prd.brandSystem.colorPalette.accent}",
    // ... exact values
  }
};
```

**Typography**: Use the exact font family and scale from `prd.brandSystem.typography`
```typescript
const typography = {
  h1: {
    fontFamily: "${prd.brandSystem.typography.fontFamily}",
    fontSize: ${prd.brandSystem.typography.scale.h1.size},
    fontWeight: "${prd.brandSystem.typography.scale.h1.weight}",
    lineHeight: ${prd.brandSystem.typography.scale.h1.lineHeight},
  },
  // ... exact values
};
```

**Spacing**: Use exact spacing values from `prd.brandSystem.spacing`

**Components**: Follow `prd.stylePreferences.components` for corners and gradients

### 8. Include Proper Error Handling

```typescript
// Example with error boundaries
if (activities === undefined) {
  return <LoadingSpinner />;
}

if (activities === null) {
  return <ErrorState message="Failed to load activities" />;
}
```

### 9. Output Structure

Generate these files:
```
project-name/
├── app/
│   ├── (auth)/
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/
│   │   ├── index.tsx
│   │   ├── profile.tsx
│   │   └── settings.tsx
│   └── _layout.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   └── ActivityCard.tsx
├── convex/
│   ├── schema.ts
│   ├── queries.ts
│   ├── mutations.ts
│   ├── auth.config.ts
│   └── _generated/
├── constants/
│   └── theme.ts
├── package.json
├── .env.example
└── README.md
```

### 10. Environment Variables Template

Create `.env.example`:
```bash
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 11. README with Setup Instructions

```markdown
# ${prd.metadata.projectName}

${prd.metadata.description}

## Prerequisites
- Node.js 18+
- Expo CLI
- Convex account (https://convex.dev)
- Clerk account (https://clerk.com)

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up Convex:
   \`\`\`bash
   npx convex dev
   \`\`\`

3. Set up Clerk:
   - Create a Clerk application
   - Enable Google OAuth
   - Copy your publishable key

4. Configure environment variables:
   \`\`\`bash
   cp .env.example .env
   # Fill in your Convex URL and Clerk key
   \`\`\`

5. Run the app:
   \`\`\`bash
   npx expo start
   \`\`\`

## Features
${prd.metadata.packageDetails.features.map(f => `- ${f}`).join('\n')}

## Tech Stack
- React Native with Expo
- Expo Router for navigation
- Convex for backend
- Clerk for authentication
- TypeScript
```

## Key Principles

1. **Analyze, Don't Assume**: Carefully study each screen mockup to understand data requirements
2. **Match Designs Exactly**: Use exact colors, fonts, spacing from the PRD
3. **Production Ready**: Include error handling, loading states, TypeScript types
4. **Best Practices**: Follow React Native and Convex best practices
5. **Complete Package**: Generate ALL files needed for the app to run
6. **Data-Driven**: Build Convex schema based on what screens actually need

## Example Data Model Inference

Given a screen showing a "Task List":
- Visual: Task items with title, description, status, assignee avatar, due date
- Infer: Need a `tasks` table with fields: title, description, status, assignedTo (userId), dueDate
- Infer: Need a `users` table for assignee information
- Infer: Need queries: getTasks, getTasksByUser
- Infer: Need mutations: createTask, updateTaskStatus, assignTask

Think step-by-step through each screen to build a complete, coherent data model.
```

---

## Notes for Convex Chef Integration

### Modifications Needed
1. **Input Format**: Accept AppDesignPRD instead of text prompt
2. **Template System**: Create React Native Expo + Convex templates
3. **Component Generator**: Extract components from screen analysis
4. **Style Translator**: Convert design tokens to StyleSheet/NativeWind
5. **Navigation Builder**: Generate navigation config from structure
6. **File Structure**: Output React Native project structure
7. **Data Model Inference**: Analyze mockup images to determine database schema
8. **Convex Integration**: Generate schema, queries, mutations based on screen analysis

### Example Convex Chef Prompt Modification
```typescript
// Original Convex Chef
const prompt = userMessage;

// Modified for AppForge
const systemPrompt = `[Full system prompt from above section]`;

const userPrompt = `
Generate a React Native Expo application with Convex backend based on this PRD:

${JSON.stringify(prd, null, 2)}

Code Generation Settings:
${JSON.stringify(settings, null, 2)}

Selected Package: ${prd.metadata.selectedPackage}
Includes Backend: ${prd.metadata.packageDetails.includesBackend}
Includes Auth: ${prd.metadata.packageDetails.includesAuth}

IMPORTANT:
1. Analyze each screen mockup carefully to infer the data model
2. Generate a complete Convex schema with all necessary tables
3. Create queries and mutations for all screen interactions
4. Match the design specifications EXACTLY (colors, typography, spacing)
5. Include authentication setup using Clerk
6. Ensure the app is production-ready with error handling

Screen Mockups to Analyze:
${prd.screens.screens.map(s => `- ${s.name} (${s.type}): ${s.url}`).join('\n')}

Logo: ${prd.brandSystem.logo.url}

Begin generation...
`;

const prompt = systemPrompt + '\n\n' + userPrompt;
```
