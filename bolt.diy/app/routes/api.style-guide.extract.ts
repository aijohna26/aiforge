import { json, type ActionFunctionArgs } from "@remix-run/node";
import Anthropic from "@anthropic-ai/sdk";
import { Buffer } from "node:buffer";

const MODEL_ID = process.env.STYLE_GUIDE_MODEL ?? 'claude-sonnet-4-5';

type ClaudeImagePart = {
    type: 'image';
    source: {
        type: 'base64';
        media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        data: string;
    };
};

const stripJson = (content: string) => {
    const trimmed = content.trim();
    const fenceMatch = trimmed.match(/```json([\s\S]*?)```/i);
    if (fenceMatch) {
        return fenceMatch[1].trim();
    }
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1) return trimmed;
    return trimmed.slice(start, end + 1);
};

const buildInlineImage = async (url: string, request: Request): Promise<ClaudeImagePart> => {
    let resolved = url;
    if (resolved.startsWith('/')) {
        const absolute = new URL(resolved, request.url).toString();
        resolved = absolute;
    }
    if (resolved.includes('/api/image-proxy')) {
        const u = new URL(resolved, request.url);
        const original = u.searchParams.get('url');
        if (original) {
            resolved = decodeURIComponent(original);
        }
    }

    if (resolved.startsWith('data:')) {
        const [meta, data] = resolved.split(',');
        const match = meta.match(/data:(.*);base64/);
        const mimeTypeRaw = match?.[1] || 'image/png';
        const mimeType = (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeTypeRaw)
            ? mimeTypeRaw
            : 'image/png') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        return {
            type: 'image',
            source: {
                type: 'base64',
                media_type: mimeType,
                data,
            },
        };
    }

    const response = await fetch(resolved);
    if (!response.ok) {
        throw new Error(`Failed to fetch image ${resolved}`);
    }
    const mimeTypeRaw = response.headers.get('content-type') || 'image/png';
    const mimeType = (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeTypeRaw)
        ? mimeTypeRaw
        : 'image/png') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    const buffer = Buffer.from(await response.arrayBuffer()).toString('base64');
    return {
        type: 'image',
        source: {
            type: 'base64',
            media_type: mimeType,
            data: buffer,
        },
    };
};

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        return json({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        const { images } = await request.json<{ images: string[] }>();
        if (!Array.isArray(images) || images.length === 0) {
            return json({ error: 'Provide at least one image' }, { status: 400 });
        }

        const apiKey = process.env.ANTHROPIC_API_KEY || process.env.APPFORGE_ANTHROPIC_API_KEY;

        if (!apiKey) {
            return json({ error: 'Anthropic API key not configured' }, { status: 500 });
        }

        const anthropic = new Anthropic({
            apiKey,
            defaultHeaders: {
                'anthropic-beta': 'output-128k-2025-02-19',
            },
        });

        const inlineImages = await Promise.all(
            images
                .slice(0, 5)
                .map((url) => buildInlineImage(url, request).catch((error) => {
                    console.error('[style-guide] failed to load image', error);
                    return null;
                })),
        );

        const validImages = inlineImages.filter((part): part is ClaudeImagePart => Boolean(part));
        if (!validImages.length) {
            return json({ error: 'Unable to load reference images' }, { status: 400 });
        }

        const prompt = `
You are an expert product designer. Analyze the supplied UI inspiration images and output JSON describing inferred design tokens.

IMPORTANT: For typography, use only commonly available web-safe fonts or popular Google Fonts that closely match the visual style. Suggest the nearest-looking alternative if you see uncommon fonts.

Common web-safe fonts: Arial, Helvetica, Times New Roman, Georgia, Courier New, Verdana, Tahoma
Popular Google Fonts: Roboto, Open Sans, Lato, Montserrat, Poppins, Inter, Raleway, Nunito, Playfair Display, Merriweather, Source Sans Pro, Work Sans, DM Sans, Plus Jakarta Sans

Return JSON with this shape (no markdown):
{
  "palettes": [
     {
        "id": "...",
        "name": "Warm Minimal",
        "summary": "Short phrase",
        "colors": [
            { "role": "primary", "hex": "#FFB347", "description": "CTA buttons" },
            { "role": "secondary", "hex": "#FFE0B5", "description": "Cards" },
            { "role": "accent", "hex": "#6750A4" },
            { "role": "background", "hex": "#0B0F1C" },
            { "role": "surface", "hex": "#161B2F" },
            { "role": "textPrimary", "hex": "#F8FAFC" },
            { "role": "textSecondary", "hex": "#CBD5F5" },
            { "role": "success", "hex": "#22C55E" },
            { "role": "warning", "hex": "#F59E0B" },
            { "role": "error", "hex": "#EF4444" }
        ],
        "keywords": ["calm", "editorial"]
     }
  ],
  "typography": [
     {
        "id": "...",
        "name": "Editorial Sans",
        "headingFont": "Playfair Display",
        "bodyFont": "Inter",
        "vibe": "Premium + approachable",
        "description": "Short description",
        "sampleText": "The quick brown fox jumps over the lazy dog.",
        "tags": ["serif", "tech"],
        "scale": {
            "h1": { "size": 36, "weight": "700", "lineHeight": 44 },
            "h2": { "size": 30, "weight": "600", "lineHeight": 38 },
            "h3": { "size": 24, "weight": "600", "lineHeight": 32 },
            "body": { "size": 16, "weight": "400", "lineHeight": 24 },
            "caption": { "size": 14, "weight": "400", "lineHeight": 20 }
        }
     }
  ],
  "styles": [
     {
        "id": "...",
        "name": "Neo Wellness",
        "description": "Short descriptive sentence",
        "uiStyle": "modern",
        "keywords": ["soft gradients", "rounded cards", "glassy surfaces"],
        "personality": ["soothing", "premium"]
     }
  ]
}
Include at least 3 palettes, 3 typography options, and 3 styles. Hex codes must use #RRGGBB format.
`;

        const response = await anthropic.messages.create({
            model: MODEL_ID,
            max_tokens: 8000,
            temperature: 0.2,
            system: 'You are an expert product designer. Respond with strictly valid JSON.',
            messages: [
                {
                    role: 'user',
                    content: [
                        ...validImages,
                        { type: 'text', text: prompt },
                    ],
                },
            ],
        });

        const textPart = response.content.find((part) => part.type === 'text');
        if (!textPart || !('text' in textPart)) {
            throw new Error('Claude did not return textual content');
        }
        const text = textPart.text || '';
        const jsonPayload = stripJson(text);
        let parsed;
        try {
            parsed = JSON.parse(jsonPayload);
        } catch (parseError) {
            const sanitized = jsonPayload.replace(/,\s*(?=[}\]])/g, '');
            parsed = JSON.parse(sanitized);
        }

        return json({
            success: true,
            palettes: parsed.palettes || [],
            typography: parsed.typography || [],
            styles: parsed.styles || [],
        });
    } catch (error: any) {
        console.error('[style-guide] extraction error', error);
        return json({ success: false, error: error.message || 'Failed to analyze mood board' }, { status: 500 });
    }
}
