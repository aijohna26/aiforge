import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { searchPexels } from '../../utils/pexels';

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
    private modelId = 'gemini-3-pro-preview';

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
            system: `You are a world-class Design Systems Architect and Lead UI Engineer.
Your task is to create a comprehensive, high-fidelity CSS Design System (JSON format) for a mobile application.

THEME ARCHITECTURE REQUIREMENTS:
- You must generate a complete set of semantic variables that power a Tailwind-based UI.
- The colors must be cohesive, professional, and sophisticated. Avoid "default" or "flat" palettes.
- Ensure high contrast and accessibility (WCAG AA standards).
- Include all necessary functional colors (border, input, ring, chart variants).

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "id": "custom-brand",
  "name": "${branding.appName} Design System",
  "style": "\n  --background: ...;\n  --foreground: ...;\n  --primary: ...;\n  --primary-rgb: ...;\n  --primary-foreground: ...;\n  --secondary: ...;\n  --secondary-foreground: ...;\n  --muted: ...;\n  --muted-foreground: ...;\n  --accent: ...;\n  --accent-foreground: ...;\n  --destructive: ...;\n  --destructive-foreground: ...;\n  --card: ...;\n  --card-foreground: ...;\n  --popover: ...;\n  --popover-foreground: ...;\n  --border: ...;\n  --input: ...;\n  --ring: ...;\n  --radius: ...;\n  --chart-1: ...;\n  --chart-2: ...;\n  --chart-3: ...;\n  --chart-4: ...;\n  --chart-5: ...;\n"
}

VIBE & AESTHETIC GUIDELINES:
- **Style Mapping**: Analyze the brand name "${branding.appName}". If it's a game/education app, use vibrant but harmonious colors. If it's tool/utility, use precise and clean tones.
- **Color Core**: Use the provided Color Palette as your source of truth. 
  *   Primary: ${branding.primaryColor}
  *   Secondary: ${branding.colorPalette?.secondary || 'auto'}
  *   Accent: ${branding.colorPalette?.accent || 'auto'}
  *   Background: ${branding.backgroundColor}
- **Visual Branding Context**: 
  ${branding.logo ? `*   Logo URL: ${branding.logo}` : ''}
  ${branding.footer ? `*   Navigation Style URL: ${branding.footer}` : ''}
  (Analyze these assets for their glassmorphism, flat, or skeuomorphic vibes and apply it to the design system).
- **Background**: Use ${branding.backgroundColor} as the base. Create subtle elevation using the --card and --popover variables (slightly lighter or darker than the background).
- **RGB Variables**: For --primary-rgb, output ONLY the numbers (e.g., "79, 70, 229") for opacity support.
- **Personality**: Reflect "${branding.personality || 'modern'}" and "${branding.uiStyle || 'clean'}".
- **Contrast**: Calculate foreground colors (text on backgrounds) to ensure deep readability.
- **Chart Colors**: Generate 5 colors that complement the primary/secondary palette for data visualization.`,
            prompt: `Create a professional and cohesive design system for "${branding.appName}". 
            Brand Description: ${branding.description || 'N/A'}
            Target Audience: ${branding.targetAudience || 'General'}
            Brand Style: ${branding.uiStyle || 'Modern'} / ${branding.personality || 'Professional'}
            Color Palette Context: ${JSON.stringify(branding.colorPalette || { primary: branding.primaryColor, background: branding.backgroundColor, text: branding.textColor })}`
        });

        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "79, 70, 229";
        };

        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const themeData = JSON.parse(jsonMatch[0]);
                if (themeData.name === "Brand Identity") {
                    themeData.name = `${branding.appName} Design System`;
                }
                return themeData;
            }
            throw new Error('Failed to parse theme JSON');
        } catch (e) {
            console.error('[StudioAgent] Theme parse error:', e);
            const priRgb = hexToRgb(branding.primaryColor);
            return {
                id: 'custom-brand',
                name: `${branding.appName} Design System`,
                style: `
  --background: ${branding.backgroundColor};
  --foreground: ${branding.textColor};
  --primary: ${branding.primaryColor};
  --primary-rgb: ${priRgb};
  --primary-foreground: #ffffff;
  --secondary: ${branding.colorPalette?.secondary || '#f3f4f6'};
  --secondary-foreground: #1f2937;
  --muted: #f3f4f6;
  --muted-foreground: #6b7280;
  --accent: ${branding.colorPalette?.accent || branding.primaryColor};
  --accent-foreground: #ffffff;
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;
  --border: #333333;
  --input: #333333;
  --ring: ${branding.primaryColor};
  --radius: 0.75rem;
  --card: ${branding.backgroundColor};
  --card-foreground: ${branding.textColor};
  --popover: ${branding.backgroundColor};
  --popover-foreground: ${branding.textColor};
  --chart-1: ${branding.primaryColor};
  --chart-2: #10b981;
  --chart-3: #f59e0b;
  --chart-4: #8b5cf6;
  --chart-5: #ec4899;
`
            };
        }
    }

    async generateScreen(branding: StudioBranding, screen: StudioScreenRequest, step?: any) {
        const prompt = this.constructPrompt(branding, screen);

        const { text } = await generateText({
            model: this.getModel(),
            maxSteps: 5,
            tools: {
                searchImages: tool({
                    description: 'Search for high-quality stock photos and images from Pexels to use in the design.',
                    parameters: z.object({
                        query: z.string().describe('The search query for images (e.g., "modern kitchen", "abstract background")'),
                        count: z.number().optional().default(5).describe('Number of images to return'),
                    }),
                    execute: async ({ query, count }) => {
                        const search = async () => {
                            console.log(`[StudioAgent] Searching Pexels for: ${query}`);
                            const images = await searchPexels(query, count);
                            return {
                                images: images.map(img => ({
                                    url: img.src.large,
                                    alt: img.alt,
                                    photographer: img.photographer
                                }))
                            };
                        };

                        if (step) {
                            return await step.run(`pexels-search-${query.replace(/\s+/g, '-').toLowerCase()}`, search);
                        }

                        return await search();
                    },
                }),
            },
            system: `You are an elite Mobile UI/UX Design Engineer specializing in high-fidelity prototypes.
      Your task is to generate beautiful, production-ready mobile screen designs using HTML and Tailwind CSS.

      🛠 SUPER POWERS:
      - You can use the 'searchImages' tool to find real, high-quality stock photos.
      - Use these images for hero sections, avatars, product displays, or backgrounds to make the design feel premium and alive.
      - ALWAYS use the actual URLs returned by the tool. DO NOT use placeholder URLs or external image services like Unsplash/Picsum unless the tool provides them.

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

        const navigationDirective = branding.footer
            ? `\n🧭 BRAND NAVIGATION: <img src="${branding.footer}" alt="Navigation Bar" class="w-full h-auto object-cover" crossorigin="anonymous" />\nCRITICAL: For the bottom navigation bar/footer, use this EXACT image tag. Place it at the absolute bottom of the screen if showBottomNav is true. Ensure it spans the full width.`
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
${navigationDirective}

🎯 CRITICAL THEMING RULES:
1. **NO HEX CODES**: Use ONLY semantic classes (e.g., bg-primary, text-foreground, border-border, shadow-md).
2. **Opacity Support**: You MAY use Tailwind's opacity modifiers (e.g., bg-primary/10, text-foreground/60) for overlays and subtle text.
3. **Dynamic Compatibility**: Your code must work perfectly even if the colors behind the variables change.
4. **Target Audience Adherence**: Design MUST be appropriate for ${branding.targetAudience || 'general users'}.
5. **Logo Preference**: ${screen.showLogo === false ? '🚨 HIDDEN: DO NOT include any logo on this screen.' : branding.logo ? 'Use the EXACT logo image tag provided above.' : 'Create a simple text-based logo placeholder.'}
6. **Navigation Preference**: ${screen.showBottomNav === false ? '🚨 HIDDEN: DO NOT include a bottom navigation bar on this screen.' : branding.footer ? 'Use the EXACT navigation image tag provided above at the bottom of the screen.' : 'Create a sleek Tailwind-based bottom navigation bar.'}
7. **Brand Identity**: Reflect "${branding.appName}" while using the semantic theme system.

Create a high-fidelity, production-ready mobile screen that perfectly matches ALL the requirements above.
🚨 ZERO TOLERANCE: DO NOT USE HEX CODES OR RGB. USE ONLY THE SEMANTIC TAILWIND CLASSES (bg-primary, text-foreground, etc.).
DO NOT use rgba() or hsla(). Use Tailwind opacity instead (e.g., bg-primary/20).
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
