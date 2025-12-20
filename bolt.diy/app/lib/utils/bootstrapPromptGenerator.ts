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
1. **Scaffold First**: Start by setting up the project baseline (app.json, tailwind.config.js, basic folder structure).
2. **Work Incrementally**: After the baseline is set, **STOP** and ask me which Epic or Screen to build first.
3. **Wait for Feedback**: For each screen or major feature, implement it fully and then **STOP** to wait for my review and feedback before proceeding to the next one.
4. **Style Consistency**: Ensure all components strictly follow the Brand Colors and Typography defined in the PRD.

### Technical Stack:
- Expo SDK (Managed Workflow)
- Expo Router
- TypeScript
- NativeWind (Tailwind CSS)

Let's start by scaffolding the project baseline.
    `;

  return prompt.trim();
}
