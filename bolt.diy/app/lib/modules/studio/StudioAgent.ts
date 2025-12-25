import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

export interface StudioBranding {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    appName: string;
    description?: string;
    targetAudience?: string;
    category?: string;
    platform?: string;
    logo?: string;
    footer?: string;
    uiStyle?: string;
    personality?: string;
    colorPalette?: any;
    typography?: string;
    components?: string;
}

export interface StudioScreenRequest {
    id: string;
    name: string;
    type: string;
    purpose: string;
    keyElements: string[];
    showLogo?: boolean;
    showBottomNav?: boolean;
}

export class StudioAgent {
    private modelId = 'gemini-3-flash-preview';

    constructor(private apiKey?: string) { }

    private getModel() {
        console.log('[StudioAgent] Initializing model:', this.modelId);

        if (!this.apiKey) {
            console.error('[StudioAgent] ERROR: Missing API Key');
            throw new Error('Google API Key is required for Studio Agent');
        }

        const google = createGoogleGenerativeAI({
            apiKey: this.apiKey
        });

        return google(this.modelId);
    }

    async generateTheme(branding: StudioBranding) {
        const { text } = await generateText({
            model: this.getModel(),
            system: `You are a world-class Design Systems Architect. 
      Your task is to create a custom CSS Design System (JSON format) based on the provided brand identity.
      
      OUTPUT FORMAT (JSON ONLY):
      {
        "id": "custom-brand",
        "name": "Brand Identity",
        "style": "--background: ...; --foreground: ...; --primary: ...; --primary-rgb: ...; --secondary: ...; --radius: ...; ..."
      }
      
      GUIDELINES:
      - PRIMARY COLOR: Should be based on ${branding.primaryColor} but refined for accessibility.
      - BACKGROUND: Use ${branding.backgroundColor} as a base.
      - RADIUS: Use ${branding.uiStyle === 'rounded' ? '1.5rem' : branding.uiStyle === 'sharp' ? '0.1rem' : '0.75rem'}.
      - PERSONALITY: Reflect "${branding.personality}".
      - LOGO CONTEXT: ${branding.logo ? 'Integrate colors from the brand logo.' : 'Use refined professional palettes.'}`,
            prompt: `Create a comprehensive design system for "${branding.appName}". Description: ${branding.description || 'N/A'}`
        });

        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Failed to parse theme JSON');
        } catch (e) {
            console.error('[StudioAgent] Theme parse error:', e);
            return {
                id: 'custom-brand',
                name: 'Brand Identity',
                style: `--primary: ${branding.primaryColor}; --background: ${branding.backgroundColor}; --foreground: ${branding.textColor}; --radius: 0.75rem;`
            };
        }
    }

    async generateScreen(branding: StudioBranding, screen: StudioScreenRequest) {
        const prompt = this.constructPrompt(branding, screen);

        const { text } = await generateText({
            model: this.getModel(),
            system: `You are an elite Mobile UI/UX Design Engineer specializing in high-fidelity prototypes.
      Your task is to generate beautiful, production-ready mobile screen designs using HTML and Tailwind CSS.

      🚨 BRAND CONSISTENCY REQUIREMENTS (HIGHEST PRIORITY):
      1. **Target Audience**: If a target audience is specified (e.g., children, teens, seniors), you MUST design for that specific demographic:
         - Children: Use bright colors, playful elements, simple language, large buttons, fun illustrations, gamification
         - Teens: Trendy, social-first, bold colors, modern typography, engaging visuals
         - Seniors: High contrast, large text, simple navigation, clear labels, accessibility-first
         - Professionals: Clean, minimal, efficient, data-focused
      2. **Logo Consistency**: If an <img> tag is provided for the logo, use it EXACTLY as given. DO NOT create SVG logos, emoji logos, or text-only logos.
      3. **Color Palette**: Use ONLY the colors specified in the prompt. DO NOT introduce new colors or gradients not in the palette.
      4. **UI Style & Personality**: Strictly adhere to the specified UI style (playful/minimal/elegant/modern) and personality (friendly/energetic/calm/professional).

      CRITICAL ARCHITECTURAL RULES:
      1. **Root Structure**: All content must be inside a single root <div>.
      2. **Overflow**: No overflow classes on the root <div>.
         All scrollable content must be in inner containers with hidden scrollbars using: [&::-webkit-scrollbar]:hidden scrollbar-none.
      3. **Height**:
         - For absolute overlays (maps, bottom sheets, modals): Use "relative w-full h-screen" on the top div of the overlay.
         - For regular content: Use "w-full h-full min-h-screen" on the top div.
         - DO NOT use "h-screen" on inner content unless absolutely required. Height must grow with content.
      4. **Iframe-Friendly**: Ensure all elements contribute to the final scrollHeight so the parent iframe can correctly resize.
      5. **No Hardware Frames**: DO NOT generate any device bezels, home indicators, status bars, or hardware notches. Generate ONLY the internal UI of the app.

      SPACING OPTIMIZATION (CRITICAL):
      - **Target Height**: Design should fit within 812px viewport height WITHOUT scrolling for auth screens (sign-in, sign-up, splash).
      - **Compact Padding**: Use tight, efficient spacing (p-4, p-6, py-3, etc.) instead of excessive padding.
      - **Reduced Gaps**: Use gap-3, gap-4, space-y-3, space-y-4 instead of gap-6, gap-8.
      - **Efficient Vertical Space**: Minimize empty space between sections. Every pixel counts.
      - **Smart Grouping**: Group related elements tightly (e.g., form fields should have minimal spacing).
      - **Compact Headers**: Keep hero images, logos, and headers reasonably sized (max 200-250px height).
      - **Tight Forms**: Input fields should use py-2.5 or py-3, not py-4 or larger.
      - **Condensed Buttons**: Use py-2.5 or py-3 for buttons, not py-4.
      - **Minimal Bottom Spacing**: Avoid excessive pb-8, pb-12 at the bottom of screens.

      DESIGN SYSTEM & THEMING (NON-NEGOTIABLE):
      - You MUST use semantic Tailwind classes that map to our dynamic theme variables.
      - NEVER use hardcoded hex codes, RGB, or hsl values for colors in your HTML.
      - THEME-AWARE CLASSES TO USE:
        *   Backgrounds: bg-background, bg-primary, bg-secondary, bg-accent, bg-muted, bg-card, bg-popover
        *   Text: text-foreground, text-primary, text-secondary, text-accent, text-muted, text-card-foreground
        *   Borders: border-border, border-input
        *   Rings/Focus: ring-ring
        *   Radius: rounded-lg, rounded-md, rounded-sm (these map to our theme radius)

      🚨 IMPORTANT: The hex codes provided in the prompt's 'Custom Theme Context' are for REFERENCE ONLY so you understand the brand's intent. Do NOT put these hex codes in your code. Instead, use the semantic classes above (e.g., if the brand primary is purple, use 'bg-primary' to apply it). This allows the user to swap themes instantly.

      UI GUIDELINES:
      - Create modular, composable layouts.
      - Use clear typography hierarchy.
      - Ensure premium feel with gradients (use bg-gradient-to-br from-primary/20 to-transparent for example), micro-interactions, and soft shadows.
      - Use Lucide-style iconography (represent as beautiful SVG or common patterns).

      OUTPUT:
      - Return ONLY raw HTML markup starting with <div>.
      - No markdown code blocks, no <html>, <head>, or <body>.`,
            prompt: prompt,
        });

        return {
            id: screen.id,
            title: screen.name,
            html: this.extractHtml(text),
        };
    }

    private constructPrompt(branding: StudioBranding, screen: StudioScreenRequest) {
        // Build comprehensive context prompt
        const audienceContext = branding.targetAudience
            ? `\n🎯 TARGET AUDIENCE: ${branding.targetAudience}\nIMPORTANT: This is for ${branding.targetAudience}. Design accordingly with appropriate imagery, language, tone, and complexity.`
            : '';

        const logoDirective = branding.logo
            ? `\n🎨 BRAND LOGO: <img src="${branding.logo}" alt="${branding.appName} Logo" class="w-16 h-16 object-contain mix-blend-screen" crossorigin="anonymous" style="filter: drop-shadow(0 2px 8px rgba(0,0,0,0.1));" />\nCRITICAL: Use this EXACT logo image tag wherever a logo is needed. DO NOT generate or imagine a different logo. ALWAYS include crossorigin="anonymous" attribute and mix-blend-screen class to blend the logo naturally with the background.`
            : '';

        const colorContext = branding.colorPalette
            ? `\n🌈 CUSTOM THEME CONTEXT (VARIABLE DEFINITIONS):
The following hex codes are what the semantic variables currently represent in the 'Custom' theme:
- var(--primary) is currently ${branding.colorPalette.primary}
- var(--secondary) is currently ${branding.colorPalette.secondary}
- var(--accent) is currently ${branding.colorPalette.accent}
- var(--background) is currently ${branding.colorPalette.background}
- var(--foreground) is currently ${branding.colorPalette.text?.primary}
- var(--muted) is currently ${branding.colorPalette.text?.secondary}`
            : `\n🌈 COLORS (REFERENCE ONLY): Primary: ${branding.primaryColor}, Background: ${branding.backgroundColor}, Text: ${branding.textColor}`;

        const styleContext = `\n✨ DESIGN SYSTEM INTENT:
- UI Style: ${branding.uiStyle || 'modern'}
- Personality: ${branding.personality || 'professional'}
- Typography: ${branding.typography || 'sans-serif'}
- Base Radius: ${branding.components || 'rounded'}`;

        return `
Generate a ${screen.type} screen for "${branding.appName}".
${branding.description ? `\nApp Description: ${branding.description}` : ''}
${audienceContext}

📱 SCREEN DETAILS:
- Name: ${screen.name}
- Type: ${screen.type}
- Purpose: ${screen.purpose}
- Required Elements: ${screen.keyElements.join(', ')}
${styleContext}
${colorContext}
${logoDirective}

🎯 CRITICAL THEMING RULES:
1. **NO HEX CODES**: Use ONLY semantic classes like bg-primary, text-foreground, border-border.
2. **Dynamic Compatibility**: Your code must work perfectly even if the colors behind the variables change.
3. **Target Audience Adherence**: Design MUST be appropriate for ${branding.targetAudience || 'general users'}.
4. **Logo Preference**: ${screen.showLogo === false ? '🚨 HIDDEN: DO NOT include any logo on this screen.' : branding.logo ? 'Use the EXACT logo image tag provided above.' : 'Create a simple text-based logo placeholder.'}
5. **Navigation Preference**: ${screen.showBottomNav === false ? '🚨 HIDDEN: DO NOT include a bottom navigation bar on this screen.' : 'Include the bottom navigation if it matches the app flow.'}
6. **Brand Identity**: Reflect "${branding.appName}" while using the semantic theme system.

Create a high-fidelity, production-ready mobile screen that perfectly matches ALL the requirements above.
🚨 ZERO TOLERANCE: DO NOT USE HEX CODES OR RGB. USE ONLY THE SEMANTIC TAILWIND CLASSES (bg-primary, text-foreground, etc.).
    `;
    }

    private extractHtml(text: string) {
        // Basic extraction if the LLM wraps it in code blocks
        const match = text.match(/```html?([\s\S]*?)```/);
        if (match) {
            return match[1].trim();
        }
        return text.trim();
    }
}
