export const PRICING_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '5 preview sessions per month',
      '10 minute session timeout',
      'Community support',
      'Basic editor features',
    ],
    limits: {
      sessionsPerMonth: 5,
      timeoutMinutes: 10,
    },
  },
  pro: {
    name: 'Pro',
    price: 25,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      'Unlimited preview sessions',
      '30 minute session timeout',
      'Priority support',
      'Advanced editor features',
      'Custom domains',
    ],
    limits: {
      sessionsPerMonth: Infinity,
      timeoutMinutes: 30,
    },
  },
  business: {
    name: 'Business',
    price: 49,
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    features: [
      'Everything in Pro',
      '60 minute session timeout',
      'Team collaboration',
      'Advanced analytics',
      'SLA support',
      'Custom integrations',
    ],
    limits: {
      sessionsPerMonth: Infinity,
      timeoutMinutes: 60,
    },
  },
} as const;

export type PlanTier = keyof typeof PRICING_PLANS;

/**
 * Image Generation Pricing
 * Based on Kie.ai API costs with 3x markup
 * Costs are in credits (1 credit = $0.01)
 */
export const IMAGE_GENERATION_PRICING = {
  'nano-banana': {
    kieCredits: 4, // Kie.ai cost: ~$0.02
    platformCredits: 6, // Our cost: $0.06 (3x markup)
    description: 'Nano Banana Standard - Basic generation',
    supportsReferenceImages: false,
  },
  'nano-banana-pro': {
    kieCredits: 18, // Kie.ai cost: ~$0.09 (1K/2K resolution)
    platformCredits: 27, // Our cost: $0.27 (3x markup)
    description: 'Advanced generation with style references',
    supportsReferenceImages: true,
    resolutionPricing: {
      '1K/2K': { kieCredits: 18, platformCredits: 27 },
      '4K': { kieCredits: 24, platformCredits: 36 },
    },
  },
  'nano-banana-edit': {
    kieCredits: 4, // Kie.ai cost: ~$0.02
    platformCredits: 6, // Our cost: $0.06 (3x markup)
    description: 'Image editing and transformation',
    supportsReferenceImages: true,
  },
  'qwen-image-edit': {
    kieCredits: 2, // Kie.ai cost: ~$0.01
    platformCredits: 3, // Our cost: $0.03 (3x markup)
    description: 'Qwen Image Edit - Fast and affordable',
    supportsReferenceImages: true,
  },
  'seedream-4.5-edit': {
    kieCredits: 4.33, // Kie.ai cost: ~$0.022 (6.5 credits * $0.0032)
    platformCredits: 7, // Our cost: $0.07 (rounded, ~3x markup)
    description: 'Seedream 4.5 Edit - Precise editing',
    supportsReferenceImages: true,
  },
  'gpt-image-1': {
    kieCredits: 6,
    platformCredits: 10,
    description: 'Kie.ai 4o Image Generation',
    supportsReferenceImages: false,
  },
  'dall-e-3': {
    kieCredits: 5,
    platformCredits: 8,
    description: 'DALL-E 3 High Quality',
    supportsReferenceImages: false,
  },
  'dall-e-2': {
    kieCredits: 2,
    platformCredits: 4,
    description: 'DALL-E 2 Standard',
    supportsReferenceImages: false,
  },
} as const;

export type ImageModel = keyof typeof IMAGE_GENERATION_PRICING;

/**
 * Calculate the cost for an image generation
 * @param model - The image generation model to use
 * @param resolution - Optional resolution for nano-banana-pro
 * @returns Cost in credits (1 credit = $0.01)
 */
export function calculateImageGenerationCost(model: ImageModel, resolution?: '1K/2K' | '4K'): number {
  const pricing = IMAGE_GENERATION_PRICING[model];

  if (model === 'nano-banana-pro' && resolution) {
    const proPricing = IMAGE_GENERATION_PRICING['nano-banana-pro'];
    return proPricing.resolutionPricing[resolution].platformCredits;
  }

  return pricing.platformCredits;
}

/**
 * Check if a model supports reference images
 */
export function supportsReferenceImages(model: ImageModel): boolean {
  return IMAGE_GENERATION_PRICING[model].supportsReferenceImages;
}
