# AI Intelligence Configuration Guide

## Overview
When users select the **Premium** package, they have the option to add AI/LLM intelligence to their mobile app. This guide explains how to capture and configure AI settings.

---

## When to Show AI Configuration

### Package-Based Display
- **Basic**: No AI options (not available)
- **Complete**: No AI options (not available)
- **Premium**: Show AI configuration as optional add-on

### UI Flow
1. User selects Premium package
2. Show "Add AI Intelligence" toggle/checkbox
3. If enabled, show AI configuration form
4. Additional +50 credits added to package cost

---

## AI Configuration UI

### Step 1: Enable AI Intelligence

```
┌─────────────────────────────────────────────────────┐
│  🤖 AI Intelligence (Optional)                      │
│  ┌───────────────────────────────────────────────┐ │
│  │ [✓] Add AI capabilities to your app           │ │
│  │     +50 credits                                │ │
│  │                                                │ │
│  │ Enable smart features like:                   │ │
│  │ • In-app AI chatbot                           │ │
│  │ • Content generation                          │ │
│  │ • Intelligent recommendations                 │ │
│  │ • AI-enhanced search                          │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Step 2: Select AI Provider

```
┌─────────────────────────────────────────────────────┐
│  Choose AI Provider                                 │
│  ┌───────────────────────────────────────────────┐ │
│  │ ○ Anthropic (Claude)                          │ │
│  │   Most intelligent, best for complex tasks    │ │
│  │   Models: Claude 3.5 Sonnet, Haiku            │ │
│  │                                                │ │
│  │ ● OpenAI (GPT)                                │ │
│  │   Popular, great all-around performance       │ │
│  │   Models: GPT-4o, GPT-4o Mini                 │ │
│  │                                                │ │
│  │ ○ Google (Gemini)                             │ │
│  │   Fast, multimodal capabilities               │ │
│  │   Models: Gemini 2.0 Flash, Gemini 1.5 Pro    │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Step 3: Select Model

Based on selected provider, show available models:

**If Anthropic selected:**
```
┌─────────────────────────────────────────────────────┐
│  Select Model                                       │
│  ┌───────────────────────────────────────────────┐ │
│  │ Model: [claude-3-5-sonnet-20241022 ▼]         │ │
│  │                                                │ │
│  │ Options:                                       │ │
│  │ • claude-3-5-sonnet-20241022 (Recommended)    │ │
│  │   Most capable, best quality                  │ │
│  │                                                │ │
│  │ • claude-3-5-haiku-20241022                   │ │
│  │   Fast, cost-effective                        │ │
│  │                                                │ │
│  │ • claude-3-opus-20240229                      │ │
│  │   Previous generation, very capable           │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**If OpenAI selected:**
```
┌─────────────────────────────────────────────────────┐
│  Select Model                                       │
│  ┌───────────────────────────────────────────────┐ │
│  │ Model: [gpt-4o ▼]                              │ │
│  │                                                │ │
│  │ Options:                                       │ │
│  │ • gpt-4o (Recommended)                        │ │
│  │   Latest, multimodal                          │ │
│  │                                                │ │
│  │ • gpt-4o-mini                                 │ │
│  │   Faster, more affordable                     │ │
│  │                                                │ │
│  │ • gpt-4-turbo                                 │ │
│  │   Previous generation                         │ │
│  │                                                │ │
│  │ • gpt-3.5-turbo                               │ │
│  │   Fast, budget-friendly                       │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**If Google selected:**
```
┌─────────────────────────────────────────────────────┐
│  Select Model                                       │
│  ┌───────────────────────────────────────────────┐ │
│  │ Model: [gemini-2.0-flash-exp ▼]               │ │
│  │                                                │ │
│  │ Options:                                       │ │
│  │ • gemini-2.0-flash-exp (Recommended)          │ │
│  │   Latest, fastest, experimental               │ │
│  │                                                │ │
│  │ • gemini-1.5-pro                              │ │
│  │   Most capable, production ready              │ │
│  │                                                │ │
│  │ • gemini-1.5-flash                            │ │
│  │   Fast, efficient                             │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Step 4: Select AI Features

```
┌─────────────────────────────────────────────────────┐
│  AI Features                                        │
│  ┌───────────────────────────────────────────────┐ │
│  │ Select which AI features to include:           │ │
│  │                                                │ │
│  │ [✓] Chatbot                                    │ │
│  │     In-app AI assistant for user queries      │ │
│  │                                                │ │
│  │ [✓] Content Generation                        │ │
│  │     AI-powered content creation                │ │
│  │                                                │ │
│  │ [ ] Recommendations                            │ │
│  │     Personalized AI recommendations            │ │
│  │                                                │ │
│  │ [✓] Search                                     │ │
│  │     AI-enhanced semantic search                │ │
│  │                                                │ │
│  │ [ ] Analysis                                   │ │
│  │     Data analysis and insights                 │ │
│  │                                                │ │
│  │ [ ] Translation                                │ │
│  │     Multi-language AI translation              │ │
│  │                                                │ │
│  │ [ ] Image Generation                           │ │
│  │     AI-powered image creation                  │ │
│  │                                                │ │
│  │ [ ] Voice Assistant                            │ │
│  │     Voice-based AI interactions                │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Step 5: Customize AI Behavior (Optional)

```
┌─────────────────────────────────────────────────────┐
│  Customize AI Behavior (Optional)                   │
│  ┌───────────────────────────────────────────────┐ │
│  │ Custom Instructions:                           │ │
│  │ ┌───────────────────────────────────────────┐ │ │
│  │ │ You are a fitness coach assistant in the  │ │ │
│  │ │ FitTrack app. Help users with workout    │ │ │
│  │ │ plans, nutrition advice, and motivation.  │ │ │
│  │ │ Be encouraging and supportive.            │ │ │
│  │ │                                           │ │ │
│  │ │                                           │ │ │
│  │ └───────────────────────────────────────────┘ │ │
│  │                                                │ │
│  │ [✓] Enable streaming responses                 │ │
│  │     Show AI responses as they're generated     │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Data Storage

### Database Schema Addition

The `design_sessions` table should store AI configuration:

```sql
ALTER TABLE design_sessions ADD COLUMN IF NOT EXISTS ai_config JSONB;

-- Example stored value:
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
  "context": "You are a fitness coach assistant...",
  "streaming": true
}
```

### TypeScript Interface

```typescript
export interface AIIntelligenceConfig {
  enabled: boolean;
  provider: 'anthropic' | 'openai' | 'google' | 'custom' | 'none';
  model: string;
  apiEndpoint?: string;
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
}
```

---

## Model Recommendations by Use Case

### Chatbot
**Best**: Claude 3.5 Sonnet (most natural conversations)
**Alternative**: GPT-4o (great all-around)
**Budget**: Claude 3.5 Haiku or GPT-4o Mini

### Content Generation
**Best**: Claude 3.5 Sonnet (highest quality writing)
**Alternative**: GPT-4o
**Budget**: Gemini 1.5 Flash

### Analysis
**Best**: GPT-4o (excellent at structured analysis)
**Alternative**: Claude 3.5 Sonnet
**Budget**: Gemini 1.5 Pro

### Search
**Best**: Gemini 2.0 Flash (fastest, great for embeddings)
**Alternative**: Claude 3.5 Haiku
**Budget**: GPT-3.5 Turbo

### Translation
**Best**: GPT-4o (best multilingual support)
**Alternative**: Gemini 1.5 Pro
**Budget**: Gemini 1.5 Flash

---

## Cost Information

### API Cost per 1M tokens (approximate):

**Anthropic**
- Claude 3.5 Sonnet: $3 input / $15 output
- Claude 3.5 Haiku: $0.80 input / $4 output

**OpenAI**
- GPT-4o: $2.50 input / $10 output
- GPT-4o Mini: $0.15 input / $0.60 output
- GPT-3.5 Turbo: $0.50 input / $1.50 output

**Google**
- Gemini 1.5 Pro: $1.25 input / $5 output
- Gemini 1.5 Flash: $0.075 input / $0.30 output
- Gemini 2.0 Flash: Free (experimental)

---

## PRD Integration

When generating the PRD, include AI configuration:

```typescript
const prd: AppDesignPRD = {
  // ... other fields
  features: {
    authentication: { ... },
    dataManagement: { ... },
    aiIntelligence: {
      enabled: true,
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      features: {
        chatbot: true,
        contentGeneration: true,
        recommendations: false,
        search: true,
        analysis: false,
        translation: false,
        imageGeneration: false,
        voiceAssistant: false,
      },
      context: 'You are a helpful fitness coach...',
      streaming: true,
    },
    features: { ... },
  },
};
```

---

## Generated Code Includes

When AI is enabled, the generated app will include:

### Dependencies
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.20.0",  // If Anthropic
    "openai": "^4.28.0",              // If OpenAI
    "@google/generative-ai": "^0.2.0" // If Google
  }
}
```

### Environment Variables
```bash
EXPO_PUBLIC_AI_PROVIDER=anthropic
EXPO_PUBLIC_AI_MODEL=claude-3-5-sonnet-20241022
EXPO_PUBLIC_ANTHROPIC_API_KEY=your-api-key-here
EXPO_PUBLIC_AI_STREAMING=true
```

### Code Files
- `lib/ai/[provider].ts` - AI client implementation
- `components/AIChatbot.tsx` - Chat UI component
- `hooks/useAI.ts` - React hook for AI features
- `screens/ChatScreen.tsx` - Full chat screen (if chatbot enabled)

### Setup Instructions in README
```markdown
## AI Configuration

This app uses Anthropic's Claude for AI features.

1. Get an API key from https://console.anthropic.com
2. Add to .env:
   ```
   EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Features enabled:
   - AI Chatbot
   - Content Generation
   - Semantic Search
```

---

## User Warning

When user enables AI, show this warning:

```
┌─────────────────────────────────────────────────────┐
│  ⚠️ API Key Required                                │
│  ┌───────────────────────────────────────────────┐ │
│  │ To use AI features, you'll need to:            │ │
│  │                                                │ │
│  │ 1. Sign up for an account with your chosen    │ │
│  │    AI provider                                │ │
│  │                                                │ │
│  │ 2. Generate an API key                        │ │
│  │                                                │ │
│  │ 3. Add the key to your app's environment      │ │
│  │    variables                                  │ │
│  │                                                │ │
│  │ The generated app will include detailed       │ │
│  │ instructions on how to set this up.           │ │
│  │                                                │ │
│  │ API costs are separate from AppForge credits. │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [Cancel]  [I Understand, Continue]                │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: UI Components
- [ ] Create AI configuration toggle
- [ ] Build provider selection UI
- [ ] Implement model dropdown per provider
- [ ] Add feature selection checkboxes
- [ ] Create custom context textarea
- [ ] Add streaming toggle
- [ ] Show cost information
- [ ] Display API key warning

### Phase 2: State Management
- [ ] Add AI config to design session state
- [ ] Persist to database (ai_config column)
- [ ] Include in PRD generation
- [ ] Validate selections

### Phase 3: Code Generation
- [ ] Modify Convex Chef prompt to include AI setup
- [ ] Generate AI client files
- [ ] Add dependencies to package.json
- [ ] Create environment variables template
- [ ] Generate AI components (chatbot, etc.)
- [ ] Add setup instructions to README

### Phase 4: Testing
- [ ] Test with each provider (Anthropic, OpenAI, Google)
- [ ] Verify generated code works
- [ ] Test all feature combinations
- [ ] Validate streaming implementation
- [ ] Check error handling
