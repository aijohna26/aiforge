import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { searchPexels } from '../../utils/pexels';
import { inngest } from '../../inngest/client';
import { createJob, getJob } from '../../inngest/db';
import { getAllowedTools, getImageToolGuidance, isToolAllowed } from './ImageToolRules';

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
  userId?: string;
}

export interface StudioScreenRequest {
  id: string;
  name: string;
  type: string;
  purpose: string;
  keyElements: string[];
  showLogo?: boolean;
  showBottomNav?: boolean;
  referenceHtml?: string;
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
      apiKey: this.apiKey,
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
            Color Palette Context: ${JSON.stringify(branding.colorPalette || { primary: branding.primaryColor, background: branding.backgroundColor, text: branding.textColor })}`,
    });

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '79, 70, 229';
    };

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const themeData = JSON.parse(jsonMatch[0]);

        if (themeData.name === 'Brand Identity') {
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
`,
      };
    }
  }

  /**
   * Constructs the system prompt for screen generation with screen-type-specific guidance
   * @param screenType - The type of screen being generated (splash, signin, home, etc.)
   * @returns Enhanced system prompt with screen-specific image tool rules
   */
  private constructSystemPrompt(screenType: string): string {
    // Get screen-specific image tool guidance
    const imageGuidance = getImageToolGuidance(screenType);

    return `You are an elite Mobile UI/UX Design Engineer specializing in high-fidelity prototypes.
      Your task is to generate beautiful, production-ready mobile screen designs using HTML and Tailwind CSS.

      🎨 SCREEN-SPECIFIC IMAGE TOOL GUIDANCE FOR ${screenType.toUpperCase()} SCREENS:
      ${imageGuidance}

      🛠 TOOL USAGE GUIDE:

      1. **searchImages** - For generic stock photos:
         - Returns: {images: [{url: "https://...", alt: "...", photographer: "..."}]}
         - Use for: Generic content (avatars, product photos, backgrounds)
         - How to use: Pick one URL from the images array and use it in an <img> tag

      2. **generateImage** - For custom branded AI imagery:
         - Returns: {imageUrl: "https://...", alt: "...", imageType: "..."}
         - Use for: Branded splash screens, unique illustrations, custom backgrounds
         - How to use: MUST use the returned imageUrl directly in an <img> tag
         - ⚠️ This is expensive - use sparingly!

      OUTPUT FORMAT:
      You must return a single valid JSON object containing:
      {
        "html": "<div class...>",
        "title": "Screen Title",
        "id": "${screenType}"
      }
      The 'html' field MUST contain the complete, valid HTML code for the screen. It cannot be empty.
      Do NOT wrap the output in markdown code blocks (\`\`\`json ... \`\`\`). Return raw JSON only.
      NEVER output placeholder text like 'Navigation Bar', 'Footer', or 'Header'. If an element is not needed, do not render it.

      🎨 CRITICAL IMAGE TOOL RULES:
      - NEVER call both searchImages AND generateImage for the same screen
      - If you call generateImage, ONLY use the returned imageUrl - do NOT also search Pexels
      - When generateImage returns {imageUrl: "https://...", alt: "...", imageType: "..."}:
        * You MUST use imageUrl in your final HTML: <img src="https://..." alt="..." crossorigin="anonymous" />
        * NEVER substitute it with a Pexels URL or placeholder
        * The imageUrl is the custom AI-generated image that perfectly matches the brand

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
      6. **Navigation Logic**:
         - **Authentication Screens**: (Login, Sign Up, Forgot Password, Onboarding, Splash) MUST NOT have a main tab bar, navigation bar, or footer. They must be isolated.
         - **Main Screens**: (Home, Profile, Settings) SHOULD have the navigation bar if provided in the prompt.
         - **CRITICAL - Navigation/Footer Implementation**:
           * NEVER use <img> tags for navigation bars, tab bars, or footers
           * ALWAYS recreate navigation using HTML <div> elements, Tailwind CSS, and Lucide icons/SVG
           * Match the reference design's style, colors, and layout using code, NOT images
           * Use proper HTML structure with semantic elements and interactive states (hover, active, etc.)

      SPACING OPTIMIZATION (CRITICAL):
      - **Target Height**: Design should primarily fit within 812px, BUT for 'Children/Senior' personas or complex forms (Sign Up), allow scrolling to ensure touch targets are large (min 44px). Do not cram content.
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
      - No markdown code blocks, no <html>, <head>, or <body>.`;
  }

  async generateScreen(branding: StudioBranding, screen: StudioScreenRequest, step?: any) {
    const prompt = this.constructPrompt(branding, screen);
    const imageGenCount = 0;

    // Get allowed tools based on screen type
    const { allowGenerateImage, allowSearchImages } = getAllowedTools(screen.type);

    console.log(
      `[StudioAgent] Screen type: ${screen.type}, allowGenerateImage: ${allowGenerateImage}, allowSearchImages: ${allowSearchImages}`,
    );

    // Build tools object dynamically based on screen type rules
    const availableTools: any = {};

    if (allowSearchImages) {
      availableTools.searchImages = tool({
        description: 'Search for high-quality stock photos and images from Pexels to use in the design.',
        parameters: z.object({
          query: z.string().describe('The search query for images (e.g., "modern kitchen vertical", "abstract background", "potted plant centered"). Add "vertical" or "centered" to improve results.'),
          count: z.number().optional().default(5).describe('Number of images to return'),
        }),
        execute: async ({ query, count }) => {
          console.log(`[StudioAgent] Searching Pexels for: ${query}`);

          const images = await searchPexels(query, count);

          return {
            images: images.map((img) => ({
              url: img.src.large,
              alt: img.alt,
              photographer: img.photographer,
            })),
          };
        },
      });
    }

    if (allowGenerateImage) {
      availableTools.generateImage = tool({
        description: `Generate custom branded images for app screens using AI.
Use for: hero banners, splash backgrounds, feature illustrations, onboarding graphics.
DO NOT use for: icons, logos (use provided assets), stock photos (use searchImages).
This tool generates high-quality custom imagery that matches your brand identity.
IMPORTANT: Ensure the generated image does NOT contain any device frames, phones, bezels, or hardware mockups. It must be a flat UI or illustration only.`,
        parameters: z.object({
          description: z.string().optional().describe('Detailed image description'),
          imageType: z
            .enum(['hero', 'background', 'illustration', 'feature-card'])
            .optional()
            .describe('Type of image to generate'),
          aspectRatio: z
            .string()
            .default('9:16')
            .describe('Aspect ratio: 9:16 (portrait), 16:9 (landscape), 1:1 (square)'),
        }),
        execute: async (input) => {
          // Double-check enforcement (defense in depth)
          if (!isToolAllowed(screen.type, 'generateImage')) {
            const errorMsg = `generateImage is not allowed for ${screen.type} screens. Use CSS backgrounds or searchImages instead.`;
            console.error('[StudioAgent] ❌', errorMsg);
            throw new Error(errorMsg);
          }

          const { description = 'App visualization', imageType = 'illustration', aspectRatio = '9:16' } = input || {};

          console.log('[StudioAgent] 🎨 generateImage tool called with:', input);

          const generateImageAsync = async () => {
            console.log('[StudioAgent] 🎨 Starting image generation:', { description, imageType, aspectRatio });

            // Enhance the prompt with branding context
            const enhancedPrompt = this.enhanceImagePromptForBranding(description, imageType, branding);

            // Create job in database
            const jobId = await createJob({
              jobType: 'image-generation',
              userId: branding.userId || 'system',
              inputData: { prompt: enhancedPrompt, imageType, aspectRatio },
              provider: 'kie',
              model: 'nano-banana',
            });

            // Send to Inngest (non-blocking)
            await inngest.send({
              name: 'media/generate.image',
              data: {
                jobId,
                userId: branding.userId || 'system',
                prompt: enhancedPrompt,
                googleModel: 'nano-banana',
                outputFormat: 'png',
                aspectRatio,
                enhanceForUI: true,
              },
            });

            // Poll for completion with shorter timeout (max 15 attempts = 30 seconds)
            const imageUrl = await this.pollJobCompletion(jobId, 15);

            console.log('[StudioAgent] ✅ Image generated successfully!');
            console.log('[StudioAgent] 📸 Returning imageUrl to LLM:', imageUrl);

            const result = {
              imageUrl,
              alt: description,
              imageType,
            };

            console.log('[StudioAgent] 📦 Full response object:', result);

            return result;
          };

          /*
           * Execute directly without step.run to avoid NESTING_STEPS error
           * Retry behavior will be handled by the main function retry mechanism
           */
          return await generateImageAsync();
        },
      });
    }

    const { text } = await generateText({
      model: this.getModel(),
      stopWhen: stepCountIs(10),
      tools: availableTools,
      system: this.constructSystemPrompt(screen.type),
      prompt,
    });

    console.log(`[StudioAgent] Raw response length for ${screen.id}: ${text.length}`);

    const parsed = this.parseScreenResponse(text);

    return {
      id: screen.id,
      title: parsed.title || screen.name,
      html: parsed.html,
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
      ? `\n🧭 BRAND NAVIGATION STYLE: The user has provided a reference footer (URL: ${branding.footer}). DO NOT use this image directly. Instead, recreate a sleek, professional bottom navigation bar using HTML <div> elements, Tailwind CSS, and Lucide icons. It must match the design system and be fully functional code.`
      : '';

    // NEW: Handle reference HTML for editing
    const referenceContext = screen.referenceHtml
      ? `\n📝 REFERENCE CODE (CURRENT STATE):
The user wants to EDIT/MODIFY this existing screen.
--- BEGIN EXISTING HTML ---
${screen.referenceHtml}
--- END EXISTING HTML ---
IMPORTANT INSTRUCTIONS FOR EDITING:
1. You must return the **COMPLETE, VALID HTML** for the new version of the screen.
2. **DO NOT** just append new code to the end. You must integrate changes into the existing structure.
3. **DO NOT** duplicate the entire screen content. If the user asks to "change the title", change it in place.
4. If the user asks for a Modal/Overlay, ensure it has \`fixed inset-0 z-50\` to properly overlay the existing content.
5. If the user wants to REPLACE the screen (e.g. "change this to a setting screen"), you may discard the old content entirely.`
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
${referenceContext}

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
6. **Navigation Preference**: ${screen.showBottomNav === false ? '🚨 HIDDEN: DO NOT include a bottom navigation bar on this screen.' : 'Create a polished Tailwind-based bottom navigation bar using icons. DO NOT use images for navigation.'}
7. **Brand Identity**: Reflect "${branding.appName}" while using the semantic theme system.

Create a high-fidelity, production-ready mobile screen that perfectly matches ALL the requirements above.
🚨 ZERO TOLERANCE: DO NOT USE HEX CODES OR RGB. USE ONLY THE SEMANTIC TAILWIND CLASSES (bg-primary, text-foreground, etc.).
DO NOT use rgba() or hsla(). Use Tailwind opacity instead (e.g., bg-primary/20).
    `;
  }

  /**
   * Enhances an image generation prompt with branding context
   */
  private enhanceImagePromptForBranding(description: string, imageType: string, branding: StudioBranding): string {
    // Inject branding context
    const colorContext = branding.colorPalette
      ? `dominant colors: ${branding.colorPalette.primary}, ${branding.colorPalette.accent}`
      : `colors: ${branding.primaryColor}`;

    const styleContext = branding.uiStyle || 'modern';
    const personality = branding.personality || 'professional';

    return `${imageType} for ${branding.appName} mobile app. ${description}.
Style: ${styleContext}, ${personality}. ${colorContext}.
Mobile-optimized, high quality, professional design.
COMPOSITION: Subject must be CENTERED in the frame. Minimalist background.
IMPORTANT: Do NOT include any phone frames, device mockups, or smartphone bezels. Generate ONLY the content/artwork itself without any device containers.`;
  }

  /**
   * Polls a job until completion or timeout
   * Default: 15 attempts × 2s = 30 seconds
   */
  private async pollJobCompletion(jobId: string, maxAttempts: number = 15): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const job = await getJob(jobId);

      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      if (job.status === 'completed' && job.outputData?.imageUrl) {
        console.log(`[StudioAgent] Image ready after ${i + 1} attempts (${(i + 1) * 2}s)`);
        return job.outputData.imageUrl;
      }

      if (job.status === 'failed') {
        throw new Error(`Image generation failed: ${job.error || 'Unknown error'}`);
      }

      // Wait 2 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const timeoutSeconds = maxAttempts * 2;
    throw new Error(
      `Image generation timed out after ${timeoutSeconds} seconds. The image may still be generating in the background.`,
    );
  }

  private parseScreenResponse(text: string): { html: string; title: string; id?: string } {
    if (!text || text.trim().length < 10) {
      throw new Error('Generated text is empty or too short');
    }

    try {
      // optimized regex to strip markdown code blocks (json or plain)
      const cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();

      // If the cleaned text starts with '{', try to parse it as JSON
      if (cleaned.startsWith('{')) {
        const parsed = JSON.parse(cleaned);

        if (!parsed.html || parsed.html.length < 10) {
          throw new Error('Parsed HTML is empty or too short');
        }

        return parsed;
      }

      /*
       * Legacy/Fallback: If it doesn't look like JSON, assume it's just HTML (old behavior)
       * But we requested JSON, so this is a last resort.
       */
      const htmlMatch = text.match(/```html?([\s\S]*?)```/);

      if (htmlMatch) {
        return { html: htmlMatch[1].trim(), title: 'Generated Screen' };
      }

      // Final fallback: treat as raw HTML if it looks like HTML
      const trimmed = text.trim();

      if (trimmed.startsWith('<div') || trimmed.startsWith('<main')) {
        return { html: trimmed, title: 'Generated Screen' };
      }

      throw new Error('Response does not look like JSON or HTML');
    } catch (e) {
      console.error('[StudioAgent] Failed to parse JSON response:', e);
      console.error('[StudioAgent] Raw text:', text);

      // Fallback: try to find the start and end of JSON object
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');

      if (start !== -1 && end !== -1) {
        try {
          const parsed = JSON.parse(text.substring(start, end + 1));

          if (!parsed.html || parsed.html.length < 10) {
            throw new Error('Parsed HTML is empty or too short (fallback)');
          }

          return parsed;
        } catch (e2) {
          // Last resort: treat as raw HTML
          if (text.length > 20) {
            return { html: text, title: 'Generated Screen' };
          }
        }
      }

      throw e; // Rethrow original error if fallback fails
    }
  }
}
