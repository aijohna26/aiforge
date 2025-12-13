# Design Agent - Setup Guide

## Overview

The Design Agent creates complete app design packages with two modes:
- **Wizard Mode**: Step-by-step control (5-10 min)
- **Express Mode**: AI generates everything (90 sec)

---

## Database Migration

Run the migration to create the `design_packages` table:

```bash
# If using Supabase CLI
supabase db push

# Or apply manually in Supabase dashboard
# File: supabase/migrations/20241204_design_packages.sql
```

---

## Usage

### Mode Selection

Users start at `/design` and choose their mode:

```
🧙‍♂️ Wizard Mode          ⚡ Express Mode
Step-by-step control     AI does everything
⏱️ 5-10 min              ⏱️ 90 sec
```

---

### Express Mode API

```typescript
POST /api/design
Body: {
  appIdea: string,
  mode: 'express',
  preferences?: {
    style: 'minimal' | 'modern' | 'playful',
    colorScheme: 'light' | 'dark' | 'auto'
  }
}

Response (Server-Sent Events):
{
  type: "progress",
  stage: "branding" | "launch" | "core",
  message: string,
  progress: number // 0-100
}

{
  type: "complete",
  design: DesignPackage
}
```

---

### Wizard Mode API

**Step 1: Start wizard and get logo options**

```typescript
POST /api/design
Body: {
  appIdea: string,
  mode: 'wizard',
  preferences?: { style: 'minimal' | 'modern' | 'playful' }
}

Response:
{
  designId: string,
  step: 1,
  logos: Logo[] // 3 options
}
```

**Step 2-5: Progress through wizard**

```typescript
POST /api/design/wizard/step
Body: {
  designId: string,
  step: number, // 1-5
  data: any // Step-specific data
}

Response:
{
  step: number,
  ... // Step-specific response
}
```

---

## Design Package Structure

```typescript
interface DesignPackage {
  id: string;
  mode: 'wizard' | 'express';
  
  featureSpec: {
    appName: string;
    tagline: string;
    coreFeatures: string[];
    userFlows: string[];
  };
  
  branding: {
    logo: Logo;
    colors: ColorPalette;
    typography: Typography;
  };
  
  screens: Screen[]; // All generated screens
  
  status: 'draft' | 'approved' | 'in_development';
}
```

---

## Generated Screens

### Express Mode (Auto-generated)
- Logo & branding
- Splash screen
- Onboarding (3 screens)
- Core screens (5+ screens)

### Wizard Mode (Step-by-step)
1. **Step 1**: Choose logo (3 options)
2. **Step 2**: Select color palette (3 options)
3. **Step 3**: Approve splash & onboarding
4. **Step 4**: Approve core screens
5. **Step 5**: Final review & approval

---

## Next Steps

After design approval:
1. User clicks "Approve & Build App"
2. Design package status → `approved`
3. Proceed to development (existing AppForge flow)
4. Generated code uses approved designs

---

## Cost Estimation

Per design package:
- Feature spec generation: $0.20
- Logo generation (3 options): $0.12
- Screen generation (8-12 screens): $0.40
- **Total: ~$0.70 per design**

---

## Troubleshooting

### "Failed to generate logo"
- Check image generation service is configured
- Verify API keys are set
- Check logs for specific error

### Wizard mode stuck on step
- Check `wizard_state` in database
- Verify step data is being saved correctly
- User can restart wizard if needed

