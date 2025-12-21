import type { DesignWizardData } from "../stores/designWizard";

export function generatePRD(data: DesignWizardData): string {
  const { step1, step3, step4, step5, step6, step7 } = data;
  const selectedScreens = step5.generatedScreens.filter(s => s.selected);
  const enabledIntegrations = step6.integrations.filter(i => i.enabled);

  const integrationsPrompt = enabledIntegrations.map(i => {
    if (i.id === 'supabase') return 'Implement Supabase for the backend (Database, Auth, Storage). Use @supabase/supabase-js.';
    if (i.id === 'supabase-auth') return 'Enable Supabase Authentication (Email/Password, Social).';
    if (i.id === 'ai-features') return 'Implement AI-powered features using the provided LLM context.';
    return `Implement ${i.id} integration.`;
  }).join('\n');

  return `# ${step1.appName || 'Untitled App'} - Product Requirements Document

## 1. Overview
**Project Name:** ${step1.appName}
**Category:** ${step1.category || 'N/A'}
**Target Audience:** ${step1.targetAudience}
**Primary Goal:** ${step1.primaryGoal}
**Platform:** ${step1.platform.toUpperCase()}

### Description
${step1.description}

**Additional Context & Requirements:**
${step1.additionalDetails || 'None provided.'}

---

## 2. Brand Identity & Design System

### 2.1 Brand Personality
- **Typography Style:** ${data.step2.typography}
- **UI Style:** ${data.step2.uiStyle}
- **Personality:** ${data.step2.personality}
- **Component Style:** ${data.step2.components} corners

### 2.2 Visual Assets
- **Logo:** ${step3.logo?.url || 'Pending'}
- **Color Palette:**
  - Primary: ${step3.colorPalette?.primary}
  - Secondary: ${step3.colorPalette?.secondary}
  - Accent: ${step3.colorPalette?.accent}
  - Background: ${step3.colorPalette?.background}
  - Surface: ${step3.colorPalette?.surface}

### 2.3 Typography Scale
- **Font Family:** ${step3.typography?.fontFamily || 'Inter'}
- **H1:** ${step3.typography?.scale?.h1?.size || 32}px / ${step3.typography?.scale?.h1?.weight || 'bold'}
- **Body:** ${step3.typography?.scale?.body?.size || 16}px / ${step3.typography?.scale?.body?.weight || 'normal'}

---

## 3. Application Architecture

### 3.1 Screen Inventory
Total screens: ${step4.screens?.length || 0}

${(step4.screens || []).map(s => `
#### ${s.name || 'Untitled Screen'} (${s.type || 'standard'})
- **Purpose:** ${s.purpose || 'N/A'}
- **Key Elements:** ${(s.keyElements || []).join(', ')}
`).join('\n')}

### 3.2 Navigation
- **Navigation Type:** ${step4.navigation?.type === 'bottom' ? 'Bottom Tab Bar' : 'None'}
${step4.navigation?.items?.length > 0 ? `- **Tabs:** ${step4.navigation.items.join(', ')}` : ''}

---

## 4. UI Prototypes (Generated Screens)
The following screen designs match the visual style guide:

${selectedScreens.map(s => `
### ${s.name}
- **Design URL:** ${s.url}
- **Prompt:** ${s.prompt}
`).join('\n')}

---

## 5. Technical Configuration & Integrations

### 5.1 Project Settings
- **Framework:** Expo SDK 54 (Managed Workflow)
- **Routing:** Expo Router (File-based)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Project Name:** ${step7.projectName}
- **Bundle Identifier:** ${step7.bundleIdentifier}
- **Typescript:** Enabled

---

---
## 6. Visual Assets (Remote)
- **Logo:** ${step3.logo?.url || 'N/A'}
- **Generated Screens:**
${selectedScreens.map(s => `  - ${s.name}: ${s.url}`).join('\n')}

---

## 7. Development Prompt
*Use this prompt to initialize the project in the code generator:*

Build a mobile application called "${step1.appName}" using Expo React Native and NativeWind.

**App Context:**
${step1.description}

**Specific Requirements & Logic:**
${step1.additionalDetails || 'Synthesize logic based on description.'}

*Instruction for Assistant:*
- **Synthesize Missing Logic**: Based on the description above, synthesize any missing application logic, edge cases, and state management requirements.
- **Data Models**: Implement the data models defined in section 5.
- **Integrations**: ${integrationsPrompt}

**Asset Management (CRITICAL):**
The following assets are available remotely. You MUST download them and place them into the project's **assets/images/** folder using **curl** before using them in the code:
- **Logo**: ${step3.logo?.url ? `${step3.logo.url}` : 'N/A'} (Save as **assets/images/logo.png**)
- **Generated Screens (Reference)**:
${selectedScreens.map(s => `  - ${s.name}: ${s.url}`).join('\n')}

**Structure & Navigation:**
The app should include ${step4.screens.length} screens: ${step4.screens.map(s => s.name).join(', ')}.
${step4.navigation.type === 'bottom' ? `Implement a bottom navigation bar with: ${step4.navigation.items.join(', ')}.` : ''}

**Performance & Best Practices:**
- Use clean, modular components.
- Implement proper TypeScript types.
- Ensure the app is responsive across different mobile screen sizes.
`;
}
