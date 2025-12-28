/**
 * Image Tool Rules Configuration
 *
 * Defines which image generation tools (generateImage vs searchImages) are allowed
 * for each screen type. Provides programmatic enforcement and LLM guidance.
 *
 * Cost Context:
 * - generateImage (Nano Banana): $0.06 per image, 30-60s generation time
 * - searchImages (Pexels): Free, instant results
 *
 * Strategy:
 * - Hard blocks: Physically prevent generateImage for auth/settings screens
 * - Soft guidance: Enhanced prompts for context-dependent screens (home, custom)
 * - Cost optimization: Default to searchImages unless brand uniqueness is critical
 */

export type ScreenType =
  | 'splash'
  | 'signin'
  | 'signup'
  | 'home'
  | 'profile'
  | 'settings'
  | 'scanner'
  | 'onboarding'
  | 'custom';

export interface ImageToolRule {
  /**
   * Whether generateImage tool is allowed for this screen type
   * If false, the tool will not be available to the LLM
   */
  allowGenerateImage: boolean;

  /**
   * Whether searchImages tool is allowed for this screen type
   * If false, the tool will not be available to the LLM
   */
  allowSearchImages: boolean;

  /**
   * Default tool preference for LLM guidance
   * - 'generateImage': Prefer custom AI generation
   * - 'searchImages': Prefer stock photos
   * - 'none': Prefer no images (CSS backgrounds/gradients)
   */
  defaultTool?: 'generateImage' | 'searchImages' | 'none';

  /**
   * Screen-specific guidance injected into LLM system prompt
   * Should explain WHEN and WHY to use each tool for this screen type
   */
  guidance: string;

  /**
   * Human-readable reasoning for this rule configuration
   * Used for documentation and debugging
   */
  reasoning?: string;
}

/**
 * Comprehensive rule configuration for all screen types
 *
 * Decision Matrix:
 * - Auth screens (signin/signup/profile): BLOCK generateImage (cost, speed)
 * - Settings: BLOCK both tools (no images needed)
 * - Splash/Onboarding: ALLOW generateImage (brand impact)
 * - Home: CONTEXT-DEPENDENT (LLM decides based on keywords)
 * - Custom: FULL ACCESS (flexibility)
 */
export const IMAGE_TOOL_RULES: Record<ScreenType, ImageToolRule> = {
  /*
   * ========================================
   * AUTHENTICATION SCREENS - HARD BLOCKS
   * ========================================
   */

  signin: {
    allowGenerateImage: false,
    allowSearchImages: false,
    defaultTool: 'none',
    guidance: `🚫 CRITICAL RESTRICTION FOR SIGNIN SCREENS:

BOTH generateImage AND searchImages are BLOCKED for login screens.

Required approach:
1. Use the provided logo image (if available in branding.logo)
2. Use CSS gradients or solid colors for backgrounds
3. NO stock photos or generated images
4. Keep it clean, minimal, and fast

Example background styles:
- bg-gradient-to-br from-primary/20 to-background
- bg-secondary with subtle pattern
- Solid color with shadow/glow effects

LOGO USAGE: If branding.logo is provided, display it prominently at the top.

OVERRIDE: User can explicitly request images (e.g., "signin with background photo of office") - in that case, use searchImages.

Keep login screens fast, clean, and conversion-focused.`,
    reasoning:
      'Login screens should load instantly with logo only. No images by default unless user explicitly requests them.',
  },

  signup: {
    allowGenerateImage: false,
    allowSearchImages: false,
    defaultTool: 'none',
    guidance: `🚫 CRITICAL RESTRICTION FOR SIGNUP SCREENS:

BOTH generateImage AND searchImages are BLOCKED for signup screens.

Required approach:
1. Use the provided logo image (if available in branding.logo)
2. Use CSS gradients or solid colors for backgrounds
3. NO stock photos or generated images
4. Keep it clean, minimal, and fast

Example background styles:
- bg-gradient-to-tl from-accent/10 to-transparent
- bg-card with subtle elevation
- Minimal geometric patterns via CSS

LOGO USAGE: If branding.logo is provided, display it prominently at the top.

OVERRIDE: User can explicitly request images (e.g., "signup with hero image") - in that case, use searchImages.

Keep signup screens fast and friction-free.`,
    reasoning:
      'Signup screens should load instantly with logo only. No images by default unless user explicitly requests them.',
  },

  profile: {
    allowGenerateImage: false,
    allowSearchImages: true,
    defaultTool: 'searchImages',
    guidance: `🚫 PARTIAL RESTRICTION FOR PROFILE SCREENS:

DO NOT use generateImage - it is BLOCKED for profile screens.

Acceptable approach:
- Use searchImages for avatar placeholders or cover photo backgrounds
- Search for: "person silhouette", "abstract profile background", "minimal geometric pattern"
- Keep images subtle and non-distracting

The profile is about USER content, not app branding. Stock photos work perfectly for placeholders.`,
    reasoning:
      'Profile screens display user-generated content. Generic avatar placeholders and backgrounds from stock photos are appropriate and instant.',
  },

  settings: {
    allowGenerateImage: false,
    allowSearchImages: false,
    defaultTool: 'none',
    guidance: `🚫 TOTAL RESTRICTION FOR SETTINGS SCREENS:

BOTH generateImage AND searchImages are BLOCKED.

Settings screens should NEVER include decorative images.

Use only:
- Icons (Lucide SVG icons)
- Switches and toggles
- Clean typography
- Semantic colors (bg-card, bg-muted, etc.)
- Subtle borders and dividers

Settings are purely functional. No imagery needed.`,
    reasoning:
      "Settings screens are utility interfaces. Icons and clean UI are all that's needed. Images add zero value.",
  },

  /*
   * ========================================
   * BRANDING SCREENS - SPARING USE
   * ========================================
   */

  splash: {
    allowGenerateImage: true,
    allowSearchImages: true,
    defaultTool: 'generateImage',
    guidance: `✅ ALWAYS USE GENERATED IMAGE FOR SPLASH SCREENS:

REQUIRED approach for splash screens:
1. ALWAYS use generateImage to create a unique branded hero moment
2. ALWAYS display the logo (if available in branding.logo) prominently with the generated image
3. Combine custom-generated background/illustration WITH logo for consistency

Why generateImage is required:
- Splash is the first brand touchpoint - consistency is critical
- Custom imagery creates memorable first impression
- Reinforces unique visual identity from the start

Example composition:
- Generated background: Abstract brand-colored gradient or illustration
- Logo placement: Centered or top-center, overlaid on generated background
- Together they create a cohesive branded splash experience

FALLBACK to searchImages ONLY if:
- User explicitly requests it (e.g., "splash with stock photo of mountains")
- Time is critical and immediate preview needed

LIMIT: Max 1 generated image for background/hero. Logo is separate asset.

OVERRIDE: User can explicitly request searchImages, but default is ALWAYS generateImage + logo.`,
    reasoning:
      'Splash screens are the first brand touchpoint. Consistency requires custom-generated imagery alongside logo. This combination ($0.06, 30-60s) creates a memorable, branded first impression.',
  },

  onboarding: {
    allowGenerateImage: true,
    allowSearchImages: true,
    defaultTool: 'generateImage',
    guidance: `✅ GENERATE BY DEFAULT FOR ONBOARDING SCREENS:

DEFAULT: Use generateImage for onboarding illustrations.

ALWAYS use generateImage when:
- Teaching app-specific concepts or unique mechanics
- Creating step-by-step visual tutorials
- Illustrating branded user journey or flow
- Need custom diagrams or UI mockups

Example use cases (use generateImage):
- "How to scan a barcode" → Custom illustration showing app's specific UI
- "Set your fitness goals" → Branded motivational illustration
- "Connect your wallet" → Custom diagram of app's flow
- Onboarding step illustrations that reinforce brand identity

FALLBACK to searchImages ONLY when:
- User explicitly requests specific content (e.g., "onboarding with 4 cars", "show products")
- Need real-world reference photos (e.g., "people exercising", "office workspace")
- Explicit content request that benefits from stock photography

DECISION RULE:
- Default → generateImage (branded, custom illustrations)
- Explicit content request (e.g., "show 4 cars") → searchImages
- Generic concepts that don't need branding → searchImages

LIMIT: Max 1 image per onboarding step.

OVERRIDE: User can explicitly request searchImages for specific content needs.`,
    reasoning:
      'Onboarding teaches users about YOUR app. Custom-generated illustrations by default enhance comprehension and reinforce brand. Stock photos only for explicit content requests.',
  },

  /*
   * ========================================
   * CONTEXTUAL SCREENS - SMART DECISIONS
   * ========================================
   */

  home: {
    allowGenerateImage: true,
    allowSearchImages: true,
    defaultTool: 'generateImage',
    guidance: `⚖️ FAVOR GENERATE FOR HOME SCREENS:

Both tools available. PREFER generateImage when both could work.

DEFAULT: Use generateImage for home screens.

Use generateImage (PREFERRED) when:
- Creating branded hero banners or featured sections
- Building motivational or identity-reinforcing visuals
- App's value prop benefits from custom imagery
- Need unique illustrations that represent the app's purpose
- Keywords like "branded", "unique", "custom", "motivational" appear

Examples favoring generateImage:
- "Home screen with motivational hero banner for runners"
- "Dashboard with branded achievement visualization"
- "Home with unique app mascot greeting"
- "Home screen" (generic, no specific content) → use generateImage for branded hero

Use searchImages ONLY when:
- User explicitly requests specific content (e.g., "home with 4 cars", "show product photos")
- Screen needs real-world reference images or actual products
- Explicit content request like "featured cars", "product gallery", "photo categories"
- User says "show [specific items]" that need stock photography

Examples favoring searchImages:
- "Home with 4 cars displayed" → explicit content request
- "E-commerce home with product photos" → real product images
- "News feed with article thumbnails" → need real photos
- "Create a screen with 4 cars" → explicit content, use searchImages

DECISION RULE:
1. Explicit content request (e.g., "4 cars", "products", "specific items")? → searchImages
2. Branded/motivational/generic home screen? → generateImage (DEFAULT)
3. When both could work? → FAVOR generateImage

LIMIT: Max 1 image total (either generated or searched).

OVERRIDE: User can explicitly request searchImages for specific content needs.`,
    reasoning:
      'Home screens should favor custom-generated branding by default. Only use stock photos when user explicitly requests specific content (e.g., "4 cars", "products"). This ensures brand consistency while allowing flexibility for content-heavy screens.',
  },

  scanner: {
    allowGenerateImage: true,
    allowSearchImages: true,
    defaultTool: 'none',
    guidance: `⚖️ RARE USE FOR SCANNER SCREENS:

Both tools available, but rarely needed.

Scanner screens are interactive (camera UI). Images are typically unnecessary.

Use generateImage ONLY for:
- Instructional overlay illustrations (e.g., "How to position QR code")
- Example scan result mockups

Use searchImages ONLY for:
- Example product images in scan results
- Generic barcode/QR code graphics

DEFAULT: No images. Scanner UI is functional (camera viewfinder, capture button, guidelines).`,
    reasoning: 'Scanner screens are camera-based interactions. Images are rarely needed beyond instructional overlays.',
  },

  /*
   * ========================================
   * FLEXIBLE SCREENS - FULL ACCESS
   * ========================================
   */

  custom: {
    allowGenerateImage: true,
    allowSearchImages: true,
    defaultTool: 'generateImage',
    guidance: `⚖️ FAVOR GENERATE FOR CUSTOM SCREENS:

Both tools available. PREFER generateImage when both could work.

DEFAULT: Use generateImage for custom screens.

General decision framework:
1. Is this screen BRAND-CRITICAL with UNIQUE VISUAL NEEDS? → generateImage (PREFERRED)
2. Is this screen CONTENT-HEAVY or LIST-BASED? → Depends on content type
3. Is this screen FUNCTIONAL or UTILITY-FOCUSED? → Avoid images (use CSS)
4. When both could work? → FAVOR generateImage

Use generateImage (PREFERRED) when:
- Screen needs branded or unique visual identity
- Creating error states, empty states, or placeholders
- Visual must match specific brand identity
- Need custom illustrations, diagrams, or conceptual imagery
- Generic stock photos don't adequately communicate the concept

Examples favoring generateImage:
- Empty state with friendly encouragement → generateImage
- Error screen with branded illustration → generateImage
- Game results/celebration screen → generateImage
- Achievement/milestone screen → generateImage
- Custom screen without explicit content request → generateImage

Use searchImages ONLY when:
- User explicitly requests specific content (e.g., "show 4 cars", "product photos", "category images")
- Screen needs real-world reference images or actual products
- Explicit content request like "featured items", "product gallery"
- Content-heavy screens where real photos are more appropriate than illustrations

Examples favoring searchImages:
- "Product detail page with product photos" → explicit content
- "Create a screen with 4 cars" → explicit content request
- "Category cards with real food photos" → explicit content
- "News feed with article images" → real photos needed

DECISION RULE:
1. Explicit content request (e.g., "4 cars", "products", "specific items")? → searchImages
2. Brand-critical or custom illustration needs? → generateImage (DEFAULT)
3. When both could work? → FAVOR generateImage

LIMIT: Max 1 image per screen, only if truly necessary.

OVERRIDE: User can explicitly request searchImages for specific content needs.`,
    reasoning:
      'Custom screens should favor custom-generated branding by default. Only use stock photos when user explicitly requests specific content. This ensures brand consistency across all screens while allowing flexibility for content-heavy use cases.',
  },
};

/**
 * Get allowed tools for a specific screen type
 *
 * @param screenType - The type of screen being generated
 * @returns Object with allowGenerateImage and allowSearchImages booleans
 *
 * @example
 * const { allowGenerateImage, allowSearchImages } = getAllowedTools('signin');
 * // Returns: { allowGenerateImage: false, allowSearchImages: true }
 */
export function getAllowedTools(screenType: string): {
  allowGenerateImage: boolean;
  allowSearchImages: boolean;
} {
  // Default to 'custom' rules for unknown screen types (most permissive)
  const rules = IMAGE_TOOL_RULES[screenType as ScreenType] || IMAGE_TOOL_RULES.custom;
  return {
    allowGenerateImage: rules.allowGenerateImage,
    allowSearchImages: rules.allowSearchImages,
  };
}

/**
 * Get enhanced LLM guidance for a specific screen type
 *
 * @param screenType - The type of screen being generated
 * @returns Guidance string to inject into LLM system prompt
 *
 * @example
 * const guidance = getImageToolGuidance('home');
 * // Returns: "⚖️ CONTEXT-DEPENDENT FOR HOME SCREENS: ..."
 */
export function getImageToolGuidance(screenType: string): string {
  const rules = IMAGE_TOOL_RULES[screenType as ScreenType] || IMAGE_TOOL_RULES.custom;
  return rules.guidance;
}

/**
 * Check if a specific tool is allowed for a screen type
 *
 * @param screenType - The type of screen being generated
 * @param toolName - The tool to check ('generateImage' or 'searchImages')
 * @returns True if the tool is allowed, false otherwise
 *
 * @example
 * if (isToolAllowed('signin', 'generateImage')) {
 *   // This will be false - generateImage is blocked for signin screens
 * }
 */
export function isToolAllowed(screenType: string, toolName: 'generateImage' | 'searchImages'): boolean {
  const allowed = getAllowedTools(screenType);
  return toolName === 'generateImage' ? allowed.allowGenerateImage : allowed.allowSearchImages;
}

/**
 * Get the default tool preference for a screen type
 * Useful for UI hints or fallback logic
 *
 * @param screenType - The type of screen being generated
 * @returns The default tool preference, or undefined if no preference
 */
export function getDefaultTool(screenType: string): 'generateImage' | 'searchImages' | 'none' | undefined {
  const rules = IMAGE_TOOL_RULES[screenType as ScreenType] || IMAGE_TOOL_RULES.custom;
  return rules.defaultTool;
}
