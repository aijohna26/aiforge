import { useState, useEffect } from 'react';
import { Button } from '~/components/ui/Button';

interface AppInfo {
  name: string;
  description: string;
  category: string;
  targetAudience: string;
  colorScheme: string;
}

interface StylePreferences {
  keywords?: string[];
  notes?: string;
  references?: string[];
  typography?: string;
  uiStyle?: string;
  personality?: string[];
  components?: {
    corners: 'rounded' | 'sharp';
    gradient: boolean;
  };
}

interface LogoGeneratorProps {
  appInfo: AppInfo;
  onSave?: (logoUrl: string, prompt: string) => void;
  stylePreferences?: StylePreferences;
}

type GoogleModel = 'nano-banana' | 'nano-banana-pro' | 'nano-banana-edit';
type OpenAIModel = 'gpt-image-1' | 'dall-e-2' | 'dall-e-3';
type OutputFormat = 'png' | 'jpg' | 'webp';
type AspectRatio = '1:1' | '9:16' | '16:9' | '4:3' | '3:4';
type Provider = 'gemini' | 'openai';

const TYPOGRAPHY_DESCRIPTIONS: Record<string, string> = {
  'modern-sans': 'Modern sans-serif typography, crisp and minimal',
  'serif-elegant': 'Elegant serif typography with high contrast strokes',
  'playful-rounded': 'Friendly rounded typography with soft edges',
  'mono-tech': 'Monospaced futuristic typography inspired by developer tools',
};

const UI_STYLE_DESCRIPTIONS: Record<string, string> = {
  clean: 'Clean minimal UI style with soft shadows and generous white space',
  pro: 'Professional dashboard UI style with sharp cards and structured layout',
  playful: 'Playful UI with curvy elements and bold pops of color',
  edtech: 'EdTech-friendly style with approachable layouts and subtle illustrations',
};

export function LogoGenerator({ appInfo, onSave, stylePreferences }: LogoGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoUrls, setLogoUrls] = useState<string[]>([]);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<Provider>('openai');
  const [googleModel, setGoogleModel] = useState<GoogleModel>('nano-banana');
  const [openaiModel, setOpenaiModel] = useState<OpenAIModel>('gpt-image-1');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [quantity, setQuantity] = useState<number>(1);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');

  // Generate smart prompt based on app info
  const generatePrompt = () => {
    // Use the provided color scheme directly as it now contains detailed hex codes from the wizard
    const colors = appInfo.colorScheme ? `Color palette: ${appInfo.colorScheme}` : 'professional color palette';

    const styleContextParts: string[] = [];

    if (stylePreferences?.typography) {
      styleContextParts.push(TYPOGRAPHY_DESCRIPTIONS[stylePreferences.typography] || stylePreferences.typography);
    }

    if (stylePreferences?.uiStyle) {
      styleContextParts.push(
        UI_STYLE_DESCRIPTIONS[stylePreferences.uiStyle] || `${stylePreferences.uiStyle} interface style`,
      );
    }

    if (stylePreferences?.personality && stylePreferences.personality.length > 0) {
      styleContextParts.push(`Brand personality: ${stylePreferences.personality.join(', ')}`);
    }

    if (stylePreferences?.keywords && stylePreferences.keywords.length > 0) {
      styleContextParts.push(`Mood board keywords: ${stylePreferences.keywords.join(', ')}`);
    }

    if (stylePreferences?.components) {
      styleContextParts.push(
        `Components should use ${stylePreferences.components.corners === 'rounded' ? 'rounded' : 'sharp'} corners` +
          (stylePreferences.components.gradient ? ' with gradient fills.' : ' with solid fills.'),
      );
    }

    if (stylePreferences?.notes?.trim()) {
      styleContextParts.push(`Creative direction: ${stylePreferences.notes.trim()}`);
    }

    const styleContext = styleContextParts.join(' ');

    // Build a comprehensive, professional prompt with strong exclusions
    return `App icon for '${appInfo.name}', a ${appInfo.category.toLowerCase()} app. ${appInfo.description}. Target audience: ${appInfo.targetAudience}. Create a clean, professional app icon using either: (1) a simple bold symbol/glyph representing ${appInfo.category.toLowerCase()}, OR (2) stylized typography with app name or initials. ${styleContext} Flat vector style, crisp edges, uniform stroke weight. ${colors}. Square icon with rounded corners, centered composition, Apple iOS 18 app icon aesthetic. High clarity, high contrast, balanced negative space. CRITICAL: TRANSPARENT BACKGROUND - no white background, no colored background, pure transparency (PNG with alpha channel). IMPORTANT: Icon design ONLY - absolutely NO buttons, NO UI elements, NO input fields, NO screens, NO mockups, NO interface components, NO shadows, NO watermarks. Just the icon itself with optional text/wordmark if appropriate on transparent background. Pure app icon design.`;
  };

  // Set initial prompt when component mounts or appInfo changes
  useEffect(() => {
    setPrompt(generatePrompt());
  }, [appInfo, stylePreferences]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setLogoUrls([]);
    setSelectedLogo(null);

    try {
      // Generate multiple images in parallel
      const promises = Array.from({ length: quantity }, async () => {
        const response = await fetch('/api/test/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            provider,
            googleModel: provider === 'gemini' ? googleModel : undefined,
            openaiModel: provider === 'openai' ? openaiModel : undefined,
            outputFormat,
            aspectRatio,
          }),
        });

        if (response.status === 402) {
          throw new Error('Insufficient credits. Please top up your wallet.');
        }

        const data: any = await response.json();

        return data.success && data.imageUrl ? data.imageUrl : null;
      });

      const results = await Promise.all(promises);
      const validUrls = results.filter((url: any): url is string => url !== null);

      if (validUrls.length > 0) {
        setLogoUrls(validUrls);

        // Auto-select first image
        setSelectedLogo(validUrls[0]);

        // Auto-save the first selected logo
        if (onSave) {
          onSave(validUrls[0], prompt);
        }
      } else {
        setError('Failed to generate any logos');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating logos');

      // console.error(err); // Suppress console error for cleaner UX
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = async () => {
    if (!editPrompt.trim() || !selectedLogo) {
      return;
    }

    setIsGenerating(true);
    setError(null);

    // Keep modal open to show progress

    try {
      const response = await fetch('/api/test/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editPrompt,
          provider: 'gemini', // Use Kie (legacy) for editing
          googleModel: 'nano-banana-edit', // Specific edit model
          outputFormat,
          aspectRatio,
          referenceImages: [selectedLogo], // Pass selected logo as reference
        }),
      });

      if (response.status === 402) {
        throw new Error('Insufficient credits. Please top up your wallet.');
      }

      const data: any = await response.json();

      if (data.success && data.imageUrl) {
        setLogoUrls((prev) => [...prev, data.imageUrl]);
        setSelectedLogo(data.imageUrl); // Select the new edited version

        // Auto-save the edited logo
        if (onSave) {
          onSave(data.imageUrl, editPrompt);
        }

        setIsEditModalOpen(false); // Close modal on success
        setEditPrompt(''); // Clear edit prompt on success
      } else {
        throw new Error('Failed to generate edit');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while editing logo');
    } finally {
      setIsGenerating(false);
    }
  };

  const examplePrompts = ['modern fitness app logo', 'minimalist productivity icon', 'colorful social media app'];

  return (
    <div className="space-y-4">
      {/* Prompt Input */}
      <div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your logo..."
          rows={3}
          className="w-full px-4 py-3 border-2 border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Compact Configuration Row */}
      <div className="flex gap-2 items-center flex-wrap">
        {/* Provider Dropdown */}
        <div className="relative">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            className="px-3 py-2 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          >
            <option value="gemini">🌟 Gemini 3</option>
            <option value="openai">🤖 OpenAI</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
        </div>

        {/* Model Dropdown - Gemini */}
        {provider === 'gemini' && (
          <div className="relative">
            <select
              value={googleModel}
              onChange={(e) => setGoogleModel(e.target.value as GoogleModel)}
              className="px-3 py-2 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              <option value="nano-banana">Nano Banana</option>
              <option value="nano-banana-pro">Nano Banana Pro</option>
              <option value="nano-banana-edit">Nano Banana Edit</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
              ▼
            </div>
          </div>
        )}

        {/* Model Dropdown - OpenAI */}
        {provider === 'openai' && (
          <div className="relative">
            <select
              value={openaiModel}
              onChange={(e) => setOpenaiModel(e.target.value as OpenAIModel)}
              className="px-3 py-2 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              <option value="gpt-image-1">GPT-Image-1</option>
              <option value="dall-e-3">DALL-E 3</option>
              <option value="dall-e-2">DALL-E 2</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
              ▼
            </div>
          </div>
        )}

        {/* Format Dropdown */}
        <div className="relative">
          <select
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
            className="px-3 py-2 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          >
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
            <option value="webp">WebP</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
        </div>

        {/* Aspect Ratio Dropdown */}
        <div className="relative">
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="px-3 py-2 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          >
            <option value="1:1">1:1</option>
            <option value="9:16">9:16</option>
            <option value="16:9">16:9</option>
            <option value="4:3">4:3</option>
            <option value="3:4">3:4</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
        </div>

        {/* Quantity Dropdown */}
        <div className="relative">
          <select
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="px-3 py-2 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          >
            <option value={1}>1 image</option>
            <option value={2}>2 images</option>
            <option value={3}>3 images</option>
            <option value={4}>4 images</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
        </div>

        {/* Generate Button */}
        <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="ml-auto">
          {isGenerating ? '⚙️ Generating...' : '+ Run'}
        </Button>
      </div>

      {/* Example Prompts */}
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-xs text-slate-500">Examples:</span>
        {examplePrompts.map((example, i) => (
          <button
            key={i}
            onClick={() => setPrompt(example)}
            className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {example}
          </button>
        ))}
      </div>

      {/* Error/Status Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 border rounded-lg p-4 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{error.includes('credits') ? '💰' : '❌'}</span>
            <span>{error}</span>
          </div>
          {error.includes('credits') && (
            <Button
              variant="outline"
              size="sm"
              className="bg-white dark:bg-slate-800 ml-4"
              onClick={async () => {
                const userId = 'test-user';
                await fetch('/api/test/topup', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId, amount: 100 }),
                });
                setError(null); // Clear error
                alert('Added 100 credits! Try running again.');
              }}
            >
              Top Up Now
            </Button>
          )}
        </div>
      )}

      {/* Generated Logos */}
      {logoUrls.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold">Generated Logos ({logoUrls.length})</h3>

          {/* Logo Grid */}
          <div className={`grid gap-4 ${logoUrls.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-2'}`}>
            {logoUrls.map((url, index) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedLogo(url);

                  // Auto-save when logo is selected
                  if (onSave) {
                    onSave(url, prompt);
                  }
                }}
                className={`border-2 rounded-lg overflow-hidden bg-white dark:bg-slate-900 p-4 cursor-pointer transition-all ${
                  selectedLogo === url
                    ? 'border-blue-500 shadow-lg'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="relative group">
                  <img src={url} alt={`${appInfo.name} logo ${index + 1}`} className="w-full h-auto" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLogo(url);
                      setIsEditModalOpen(true);
                    }}
                    className="absolute top-2 right-2 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 p-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-600 transition-all group-hover:opacity-100 focus:opacity-100 opacity-60 hover:opacity-100"
                    title="Edit this logo"
                  >
                    ✏️
                  </button>
                </div>
                {selectedLogo === url && (
                  <div className="mt-2 text-center">
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">✓ Selected</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          {selectedLogo && (
            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                onClick={() => {
                  setLogoUrls([]);
                  setSelectedLogo(null);
                }}
                variant="outline"
                size="sm"
              >
                🔄 Start Over
              </Button>
              <Button
                onClick={async () => {
                  // Generate more variations and add to existing
                  setIsGenerating(true);

                  try {
                    const promises = Array.from({ length: quantity }, async () => {
                      const response = await fetch('/api/test/image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          prompt,
                          provider: 'gemini',
                          googleModel,
                          outputFormat,
                          aspectRatio,
                        }),
                      });

                      if (response.status === 402) {
                        throw new Error('Insufficient credits. Please top up your wallet.');
                      }

                      const data: any = await response.json();

                      return data.success && data.imageUrl ? data.imageUrl : null;
                    });

                    const results = await Promise.all(promises);
                    const validUrls = results.filter((url: any): url is string => url !== null);

                    if (validUrls.length > 0) {
                      setLogoUrls((prev) => [...prev, ...validUrls]);
                    }
                  } catch (err: any) {
                    setError(err.message || 'An error occurred while generating more logos');

                    // console.error(err);
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                variant="outline"
                size="sm"
                disabled={isGenerating}
              >
                ➕ Generate More
              </Button>
              <Button onClick={() => setIsEditModalOpen(true)} variant="outline" size="sm" disabled={isGenerating}>
                ✏️ Edit
              </Button>
              <Button onClick={() => window.open(selectedLogo, '_blank')} size="sm">
                👁️ View Full Size
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(selectedLogo);
                  alert('Logo URL copied!');
                }}
                variant="outline"
                size="sm"
              >
                📋 Copy URL
              </Button>
              <Button
                onClick={() => {
                  if (onSave) {
                    onSave(selectedLogo, prompt);
                  }
                }}
                size="sm"
                className="bg-green-500 hover:bg-green-600"
              >
                💾 Save Selected
              </Button>
            </div>
          )}
        </div>
      )}
      {/* Edit Modal */}
      {isEditModalOpen && selectedLogo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col border border-slate-200 dark:border-slate-700">
            {/* Compact Header */}
            <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
              <h3 className="font-semibold text-sm">Edit Logo</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Compact Content - NO SCROLLING NEEDED */}
            <div className="p-4 space-y-3">
              {/* Mini Preview - Inline with label */}
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 flex-shrink-0">
                  <img src={selectedLogo} alt="Logo to edit" className="w-full h-full object-contain" />
                </div>
                <div className="text-xs text-slate-500">
                  Using <strong>Nano Banana Edit</strong>
                </div>
              </div>

              {/* Edit Prompt - MAIN FOCUS */}
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                  What changes do you want?
                </label>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="e.g., Make it blue, add a circle background..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                  autoFocus
                />
              </div>

              {/* Error Message in Modal */}
              {error && (
                <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800 flex items-center gap-2">
                  <span>❌</span>
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Compact Footer */}
            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 bg-slate-50 dark:bg-slate-900/50 flex-shrink-0">
              <Button variant="ghost" onClick={() => setIsEditModalOpen(false)} disabled={isGenerating} size="sm">
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={isGenerating || !editPrompt.trim()} size="sm">
                {isGenerating ? '⚙️ Generate' : '✨ Generate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
