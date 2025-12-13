# Image Generation Service

## Supported Providers

The image generation service supports multiple providers:

1. **Gemini 3 (Imagen 3)** via Kie.ai (Default - Excellent for design)
2. **OpenAI DALL-E 3**
3. **OpenAI GPT-Image-1** (Latest model)
4. **Kie.ai** (Alternative models)
5. **Recraft V3** (Nano Banana Pro - Fast & cheap)
6. **Replicate (Flux)**

---

## Configuration

Set your preferred provider via environment variable:

```bash
# .env.local

# Choose provider: 'gemini', 'openai', 'gpt-image-1', 'kie', 'recraft', or 'replicate'
IMAGE_GENERATION_PROVIDER=gemini  # Default (Gemini 3 via Kie.ai)

# API Keys (add the ones you're using)
KIE_API_KEY=kie_...             # For Gemini 3 (default) and other Kie.ai models
OPENAI_API_KEY=sk-...           # For DALL-E 3 or GPT-Image-1
GOOGLE_AI_API_KEY=AIza...       # For direct Gemini API (alternative)
RECRAFT_API_KEY=recraft_...     # For Recraft V3 (Nano Banana Pro)
REPLICATE_API_KEY=r8_...        # For Flux
```

> **Note**: Gemini 3 is available through Kie.ai at https://kie.ai/gemini-3

---

## Usage

### Simple Usage (Uses Default Provider)

```typescript
import { generate_image } from '@/lib/generate-image';

// Uses Gemini 3 (via Kie.ai) by default
const imageUrl = await generate_image(
  'Create a modern app logo for a fitness tracker',
  'fitness_logo'
);
```

### Advanced Usage (Specify Provider)

```typescript
import { imageService } from '@/lib/generate-image';

const result = await imageService.generateImage({
  prompt: 'Create a modern app logo',
  provider: 'kie', // Override default
  size: '1024x1024',
  quality: 'hd',
  style: 'vivid',
});

console.log(result.url);
console.log(result.provider); // 'kie'
```

### Switch Provider Per Request

```typescript
// Use GPT-Image-1 for high-quality logos
const logo = await generate_image(
  'App logo, minimal design',
  'logo',
  'gpt-image-1'
);

// Use Recraft V3 for fast wireframes
const wireframe = await generate_image(
  'Mobile app home screen wireframe',
  'home_screen',
  'recraft'
);
```

---

## Provider Comparison

| Provider | Speed | Quality | Cost | Best For |
|----------|-------|---------|------|----------|
| **Gemini 3 (via Kie.ai)** | **Fast** | **Excellent** | **$0.04/image** | **Design-focused, UI/UX (Default)** |
| OpenAI DALL-E 3 | Medium | Excellent | $0.04/image | High-quality mockups |
| OpenAI GPT-Image-1 | Fast | Excellent | $0.04/image | Latest model, best quality |
| Kie.ai (other models) | Fast | Good | $0.02/image | Alternative models, quick iterations |
| Recraft V3 | Very Fast | Excellent | $0.005/image | Wireframes, bulk generation |
| Replicate (Flux) | Fast | Excellent | $0.003/image | Cost-sensitive projects |

---

## Environment Variables

```bash
# Required (at least one)
OPENAI_API_KEY=sk-...
KIE_API_KEY=kie_...
REPLICATE_API_KEY=r8_...

# Optional (defaults to 'openai')
IMAGE_GENERATION_PROVIDER=openai
```

---

## Error Handling

```typescript
try {
  const imageUrl = await generate_image('My prompt');
} catch (error) {
  if (error.message.includes('API_KEY')) {
    console.error('API key not configured');
  } else {
    console.error('Image generation failed:', error);
  }
}
```

---

## Cost Optimization

**Strategy 1**: Use cheaper providers for wireframes, expensive for final mockups

```typescript
// Wireframes (cheap)
const wireframe = await generate_image(prompt, 'wireframe', 'kie');

// Final mockups (high quality)
const mockup = await generate_image(prompt, 'mockup', 'openai');
```

**Strategy 2**: Set default to cheapest, override when needed

```bash
# .env.local
IMAGE_GENERATION_PROVIDER=replicate # Cheapest
```

```typescript
// Use default (Replicate) for most images
const image1 = await generate_image(prompt1);

// Override for critical images
const logo = await generate_image(prompt2, 'logo', 'openai');
```

---

## Troubleshooting

### "API_KEY environment variable is required"
- Add the required API key to `.env.local`
- Restart your dev server

### "Unsupported image provider"
- Check `IMAGE_GENERATION_PROVIDER` value
- Must be: 'openai', 'kie', or 'replicate'

### Images not generating
- Check API key is valid
- Verify provider API is accessible
- Check rate limits

