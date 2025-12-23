import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

export interface StudioBranding {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    appName: string;
    description?: string;
    logo?: string;
    footer?: string;
    uiStyle?: string;
    personality?: string;
}

export interface StudioScreenRequest {
    id: string;
    name: string;
    type: string;
    purpose: string;
    keyElements: string[];
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
      
      DESIGN SYSTEM SPECIFICATIONS:
      - Use ONLY Tailwind CSS classes for styling.
      - App Name: ${branding.appName}
      - App Description: ${branding.description || 'N/A'}
      
      SEMANTIC COLORS (MAPPED TO THEME):
      - Background: Use "bg-background"
      - Text: Use "text-foreground"
      - Primary Action: Use "bg-primary" or "text-primary"
      - Card/Surface: Use "bg-card"
      - Icons/Accents: Use "text-accent" or "bg-accent"
      - Muted elements: Use "text-muted-foreground" or "bg-muted"
      
      CRITICAL: Always use the semantic variable names (primary, secondary, background, foreground, etc.) for colors instead of hardcoded hex values to ensure theme compatibility.
      
      BRAND CONTEXT:
      - App Name: ${branding.appName}
      - Brand Logo: ${branding.logo ? 'A specific logo image is provided. Place a placeholder for it in the header/splash areas.' : 'No specific logo provided.'}
      - Brand Footer: ${branding.footer ? 'A specific footer/sponsorship image is provided. Place it at the bottom where appropriate.' : 'No footer image provided.'}
      - Brand Personality: ${branding.personality || 'modern and professional'}.
      - Visual Style: ${branding.uiStyle || 'clean and minimalist'}.
      
      UI GUIDELINES:
      1. COMPOSABILITY: Create modular layouts using flex and grid.
      2. TYPOGRAPHY: Use a clear hierarchy with bold headings and readable body text.
      3. INTERACTION: Every button must have a clear hover/active state (using tailwind).
      4. IOS/ANDROID NEUTRAL: Design to be consistent across platforms but feel native to a mobile device.
      5. PREMIUM FEEL: Use subtle gradients, soft shadows (shadow-sm/md), and generous negative space (px-6, py-8).
      6. ICONOGRAPHY: Use Lucide-style iconography represented by SVG path strings or common Lucide patterns.
      
      OUTPUT REQUIREMENTS:
      - Return ONLY the HTML code block.
      - NO <html>, <head>, or <body> tags.
      - Use a parent <div> with class "flex flex-col h-full w-full overflow-hidden" as the container.
      - DO NOT use external scripts or non-standard CSS.`,
            prompt: prompt,
        });

        return {
            id: screen.id,
            title: screen.name,
            html: this.extractHtml(text),
        };
    }

    private constructPrompt(branding: StudioBranding, screen: StudioScreenRequest) {
        return `
      Generate a ${screen.type} screen for a mobile app named "${branding.appName}".
      
      Screen Name: ${screen.name}
      Purpose: ${screen.purpose}
      Key Elements to include: ${screen.keyElements.join(', ')}
      
      UI Style Preference: ${branding.uiStyle || 'modern'}
      Brand Personality: ${branding.personality || 'professional'}
      
      The design should be a high-fidelity mobile UI. Ensure it looks like a real app screen.
      Use modern design trends like glassmorphism, soft shadows, and clean typography.
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
