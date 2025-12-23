import { generatePRD } from './prdGenerator';

/**
 * Transforms the structured Design Wizard state into a detailed natural language technical blueprint.
 * This blueprint is used as the initial "Super Prompt" to seed the Bolt generation engine.
 */
export function generateBootstrapPrompt(data: DesignWizardData): string {
  const { step1, step3, step4, step6 } = data;
  const prd = generatePRD(data);

  const brandColors = step3.colorPalette ? `
        PRIMARY: ${step3.colorPalette.primary}
        SECONDARY: ${step3.colorPalette.secondary}
        ACCENT: ${step3.colorPalette.accent}
        BACKGROUND: ${step3.colorPalette.background}
    ` : 'Standard professional dark theme';

  const prompt = `
Generate a high-fidelity, production-ready Expo application based on the attached PRD and Design System.

## PRODUCT REQUIREMENTS DOCUMENT (PRD)
${prd}

## INSTRUCTIONS FOR ITERATIVE GENERATION:
1. **Scaffold First**: Start by setting up the project baseline (app.json, tailwind.config.js, basic folder structure). **STRICT REQUIREMENT**: Use Expo SDK 54 and React 19. Do NOT downgrade to SDK 52 or 53.
2. **Work Incrementally**: After the baseline is set, **STOP** and ask me which Epic or Screen to build first.
3. **Wait for Feedback**: For each screen or major feature, implement it fully and then **STOP** to wait for my review and feedback before proceeding to the next one.
4. **Style Consistency**: Ensure all components strictly follow the Brand Colors and Typography defined in the PRD.
5. **No Downgrades**: If a dependency error occurs (like ETARGET), fix the specific version in package.json (e.g. use expo-av@~15.0.1) instead of reverting the global SDK version.
6. **Config Plugins (CRITICAL)**: Do NOT add \`expo-web-browser\` or \`expo-font\` to the \`plugins\` array in \`app.json\`. These packages do not have config plugins and will cause a \`PluginError\` on startup. Use only \`expo-router\` and other valid plugins.
7. **CRITICAL ASSET RULE**: You are FORBIDDEN from using Pexels, Unsplash, or any other external placeholder domains. Using them will result in a failed build. You MUST use the Supabase URLs provided in the PRD for all brand assets (logo, splash, icon).
       
### Technical Stack:
- Expo SDK (Managed Workflow)
- Expo Router
- TypeScript
- NativeWind (Tailwind CSS)

Let's start by scaffolding the project baseline.
    `;

  return prompt.trim();
}
