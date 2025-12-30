import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@nanostores/react';
import { toast } from 'sonner';
import type { Step3Data } from '~/lib/stores/designWizard';
import { designWizardStore, updateStep3Data, setIsProcessing } from '~/lib/stores/designWizard';
import { extractStyleGuideFromMoodboard } from '~/lib/styleGuideExtraction';

type TabKey = 'colors' | 'typography' | 'style' | 'logo';
type Provider = 'gemini' | 'openai';
type GoogleModel = 'nano-banana' | 'nano-banana-pro';

const defaultScale = {
  h1: { size: 32, weight: '700', lineHeight: 40 },
  h2: { size: 28, weight: '600', lineHeight: 36 },
  h3: { size: 24, weight: '600', lineHeight: 32 },
  body: { size: 16, weight: '400', lineHeight: 24 },
  caption: { size: 14, weight: '400', lineHeight: 20 },
};

type PaletteOption = Step3Data['paletteOptions'][number];
type TypeOption = Step3Data['typographyOptions'][number];

const getSafeLogoUrl = (url: string) => {
  if (!url) {
    return url;
  }

  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/api/image-proxy')) {
    return url;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.includes('supabase.co')) {
      return url;
    }

    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }

  return url;
};

// Extract original URL from proxy URL
const getOriginalUrl = (url: string) => {
  if (!url) {
    return url;
  }

  // If it's a proxy URL, extract the original URL from the query parameter
  if (url.startsWith('/api/image-proxy?url=')) {
    const urlParam = new URL(url, window.location.origin).searchParams.get('url');
    return urlParam || url;
  }

  return url;
};
const toColorPalette = (palette: PaletteOption) => {
  const getColor = (role: string, fallback: string) =>
    palette.colors.find((c) => c.role.toLowerCase().includes(role))?.hex || fallback;

  return {
    primary: getColor('primary', '#6C5CE7'),
    secondary: getColor('secondary', '#A29BFE'),
    accent: getColor('accent', '#00D4FF'),
    background: getColor('background', '#0B0F1C'),
    surface: getColor('surface', '#161B2F'),
    text: {
      primary: getColor('text', '#F8FAFC'),
      secondary: getColor('muted', '#CBD5F5'),
      disabled: getColor('disabled', '#94A3B8'),
    },
    error: getColor('error', '#EF4444'),
    success: getColor('success', '#22C55E'),
    warning: getColor('warning', '#F59E0B'),
  };
};

const toTypography = (option: TypeOption) => ({
  fontFamily: `${option.headingFont}, ${option.bodyFont}, 'Inter', sans-serif`,
  scale: option.scale || defaultScale,
});

export function BrandStyleFrame() {
  const wizardData = useStore(designWizardStore);
  const { step1, step2, step3 } = wizardData;
  const manualEntryActive = step3.entryMode === 'manual';
  const [activeTab, setActiveTab] = useState<TabKey>('colors');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Logo generation state
  const [logoPrompt, setLogoPrompt] = useState('');
  const [promptDirty, setPromptDirty] = useState(false);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [logoUrls, setLogoUrls] = useState<string[]>([]);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>('openai');
  const [googleModel, setGoogleModel] = useState<GoogleModel>('nano-banana');
  const [quantity, setQuantity] = useState<number>(2);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [logoToEdit, setLogoToEdit] = useState<string | null>(null);
  const [isFullSizeModalOpen, setIsFullSizeModalOpen] = useState(false);

  // Normalize any persisted logo URLs to go through the proxy
  useEffect(() => {
    let needsUpdate = false;
    const normalizedVariations = step3.logoVariations.map((variation) => {
      const safeUrl = getSafeLogoUrl(variation.url);

      if (safeUrl !== variation.url) {
        needsUpdate = true;
        return { ...variation, url: safeUrl };
      }

      return variation;
    });
    let normalizedLogo = step3.logo;

    if (step3.logo) {
      const safeLogoUrl = getSafeLogoUrl(step3.logo.url);

      if (safeLogoUrl !== step3.logo.url) {
        needsUpdate = true;
        normalizedLogo = { ...step3.logo, url: safeLogoUrl };
      }
    }

    if (needsUpdate) {
      updateStep3Data({
        logoVariations: normalizedVariations,
        logo: normalizedLogo,
      });
    }
  }, [step3.logoVariations, step3.logo]);

  useEffect(() => {
    if (step3.logoVariations.length > 0 && logoUrls.length === 0) {
      const safeVariations = step3.logoVariations.map((variation) => getSafeLogoUrl(variation.url));
      setLogoUrls(safeVariations);

      const initialLogo = getSafeLogoUrl(step3.logo?.url || step3.logoVariations[0].url);

      if (initialLogo) {
        setSelectedLogo(initialLogo);
      }
    }
  }, [step3.logoVariations, step3.logo, logoUrls.length]);

  const runExtraction = useCallback(async () => {
    if (!step2.referenceImages.length) {
      setLocalError('Add at least one reference image to analyze.');
      return;
    }

    try {
      setLocalError(null);
      setIsLoading(true);
      setIsProcessing(true);
      await extractStyleGuideFromMoodboard(
        step2.referenceImages.map((img) => img.url),
        step2.referenceImages.map((img) => img.id),
      );
    } catch (error: any) {
      setLocalError(error.message || 'Failed to analyze mood board');
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  }, [step2.referenceImages]);

  const handlePaletteSelect = (paletteId: string) => {
    const palette = step3.paletteOptions.find((p) => p.id === paletteId);

    if (!palette) {
      return;
    }

    updateStep3Data({
      selectedPaletteId: paletteId,
      colorPalette: toColorPalette(palette),
    });
    toast.success(`Selected palette "${palette.name}"`);
  };

  const handleTypographySelect = (optionId: string) => {
    const option = step3.typographyOptions.find((opt) => opt.id === optionId);

    if (!option) {
      return;
    }

    updateStep3Data({
      selectedTypographyId: optionId,
      typography: toTypography(option),
    });
    toast.success(`Selected typography "${option.name}"`);
  };

  const handleStyleSelect = (styleId: string) => {
    const style = step3.styleDirections.find((s) => s.id === styleId);

    if (!style) {
      return;
    }

    updateStep3Data({ selectedStyleId: styleId });
    toast.success(`Locked in style "${style.name}"`);
  };

  const generateLogoPrompt = useCallback(() => {
    const appName = step1.appName?.trim() || 'your app';
    const category = step1.category?.trim() || 'digital';

    const selectedPalette = step3.paletteOptions.find((p) => p.id === step3.selectedPaletteId);
    const colorPalette = step3.colorPalette;

    // Extract 3 main colors with their hex values
    const colors: string[] = [];
    if (selectedPalette && selectedPalette.colors.length > 0) {
      colors.push(...selectedPalette.colors.slice(0, 3).map((c) => c.hex));
    } else if (colorPalette) {
      colors.push(colorPalette.primary, colorPalette.secondary, colorPalette.accent);
    }

    const selectedStyle = step3.styleDirections.find((s) => s.id === step3.selectedStyleId);
    const styleKeywords = selectedStyle ? selectedStyle.keywords.slice(0, 2).join(', ') : 'modern';

    const textDirective =
      step3.logoTextMode === 'with-text'
        ? `with "${appName}" text integrated`
        : 'pure icon, no text';

    // CRITICAL: Be extremely explicit this is NOT a UI mockup
    return `A single ${category.toLowerCase()} logo icon, ${textDirective}. Simple symbolic graphic only - NOT a phone screen, NOT an app interface, NOT a mockup. Just one clean icon symbol on gradient background. Color scheme: ${colors.join(', ')}. ${styleKeywords} style. Minimal flat design like Apple iOS home screen icons.`;
  }, [
    step1.appName,
    step1.category,
    step3.colorPalette,
    step3.logoTextMode,
    step3.paletteOptions,
    step3.selectedPaletteId,
    step3.selectedStyleId,
    step3.styleDirections,
  ]);

  useEffect(() => {
    if (!promptDirty) {
      setLogoPrompt(generateLogoPrompt());
    }
  }, [generateLogoPrompt, promptDirty]);

  const handleGenerateLogo = useCallback(async () => {
    if (!logoPrompt.trim()) {
      setLocalError('Please enter a logo prompt');
      return;
    }

    setIsGeneratingLogo(true);
    setIsProcessing(true);
    setLocalError(null);
    updateStep3Data({ logoProcessStatus: 'generating' });

    try {
      const promises = Array.from({ length: quantity }, async () => {
        const response = await fetch('/api/test/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: logoPrompt,
            provider,
            googleModel: provider === 'gemini' ? googleModel : undefined,
            outputFormat: 'png',
            aspectRatio: '1:1',
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to generate logo');
        }

        const data = await response.json();

        return data.success && data.imageUrl ? data.imageUrl : null;
      });

      const results = await Promise.all(promises);
      const validUrls = results.filter((url): url is string => url !== null);
      const safeUrls = validUrls.map(getSafeLogoUrl);

      if (safeUrls.length > 0) {
        setLogoUrls((prev) => [...prev, ...safeUrls]);

        const timestamp = Date.now();
        const newVariations = safeUrls.map((url, idx) => ({
          id: `logo-${timestamp}-${idx}`,
          url,
          prompt: logoPrompt,
        }));
        const existingVariations = designWizardStore.get().step3.logoVariations || [];
        updateStep3Data({
          logoVariations: [...existingVariations, ...newVariations],
          logoProcessStatus: 'complete',
        });

        const defaultUrl = safeUrls[0];

        if (defaultUrl) {
          setSelectedLogo(defaultUrl);

          const variationIndex = existingVariations.length;
          updateStep3Data({
            logo: {
              url: defaultUrl,
              prompt: logoPrompt,
              format: 'png',
              selectedVariation: variationIndex,
            },
          });
        }

        toast.success(`Generated ${validUrls.length} logo${validUrls.length > 1 ? 's' : ''}`);
      } else {
        setLocalError('Failed to generate any logos');
        updateStep3Data({ logoProcessStatus: 'error' });
      }
    } catch (error: any) {
      setLocalError(error.message || 'Failed to generate logo');
      updateStep3Data({ logoProcessStatus: 'error' });
    } finally {
      setIsGeneratingLogo(false);
      setIsProcessing(false);
    }
  }, [logoPrompt, provider, googleModel, quantity]);

  const handleSelectLogo = useCallback(
    (url: string) => {
      const normalizedUrl = getSafeLogoUrl(url);
      setSelectedLogo(normalizedUrl);

      const current = designWizardStore.get();
      const variationIndex = current.step3.logoVariations.findIndex((variation) => variation.url === normalizedUrl);
      const prompt = variationIndex >= 0 ? current.step3.logoVariations[variationIndex].prompt : logoPrompt;

      if (variationIndex >= 0) {
        updateStep3Data({
          logo: {
            url: normalizedUrl,
            prompt,
            format: 'png',
            selectedVariation: variationIndex,
          },
        });
      }
    },
    [logoPrompt],
  );

  const hasResults = step3.paletteOptions.length || step3.typographyOptions.length || step3.styleDirections.length;

  return (
    <>
      <div className="w-[990px] max-h-[85vh] overflow-y-auto custom-scrollbar pointer-events-auto bg-[#11121D] border-2 border-[#1F243B] rounded-2xl p-10 pb-60 shadow-2xl text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-1">Step 3: Smart Style Guide</h2>
            <p className="text-sm text-slate-100 font-medium">
              We analyze your mood board to build color palettes, typography pairings, and style cues.
            </p>
          </div>
          <button
            onClick={runExtraction}
            disabled={isLoading || !step2.referenceImages.length}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-sm font-medium transition-colors"
          >
            {isLoading ? 'Analyzing…' : step3.paletteOptions.length ? 'Re-run analysis' : 'Analyze mood board'}
          </button>
        </div>

        {!manualEntryActive && !step2.referenceImages.length && (
          <div className="border border-dashed border-slate-500 rounded-xl p-6 text-center text-slate-200 font-medium">
            Add inspiration images in Step 2 to unlock AI analysis.
          </div>
        )}

        {localError && (
          <div className="mt-4 p-4 border border-red-500/50 bg-red-500/10 rounded-xl text-sm text-red-200">
            {localError}
          </div>
        )}

        {manualEntryActive && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-500/60 bg-slate-800/70 px-4 py-3 text-sm text-white">
            <p>Manual style guide loaded. Review your color, typography, and style tabs before generating logos.</p>
            <button
              onClick={() => setActiveTab('logo')}
              disabled={activeTab === 'logo'}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                activeTab === 'logo'
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-white hover:text-black transition-colors'
              }`}
            >
              Open Logo Generator
            </button>
          </div>
        )}

        {(step2.referenceImages.length > 0 || manualEntryActive) && (
          <>
            <div className="mt-6 flex gap-3 bg-[#1A1F32] p-1 rounded-full w-fit">
              {(['colors', 'typography', 'style', 'logo'] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);

                    if (tab === 'logo' && !logoPrompt) {
                      setPromptDirty(false);
                      setLogoPrompt(generateLogoPrompt());
                    }
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-blue-600 shadow-lg text-white'
                      : 'bg-slate-200 text-black hover:bg-slate-300'
                  }`}
                >
                  {tab === 'colors'
                    ? 'Colours'
                    : tab === 'typography'
                      ? 'Typography'
                      : tab === 'style'
                        ? 'Style'
                        : 'Logo'}
                </button>
              ))}
            </div>

            {!hasResults && !isLoading && (
              <div className="mt-10 p-8 border border-dashed border-slate-500 rounded-2xl text-center text-slate-200 font-medium">
                {manualEntryActive
                  ? 'Select colors, typography, and style via manual entry to populate suggestions.'
                  : 'Run the analysis to populate suggestions.'}
              </div>
            )}

            {activeTab === 'colors' && step3.paletteOptions.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-6">
                {step3.paletteOptions.map((palette) => (
                  <div
                    key={palette.id}
                    className={`rounded-2xl border p-6 bg-gradient-to-b from-[#171C2D] to-[#11121D] ${
                      step3.selectedPaletteId === palette.id
                        ? 'border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.25)]'
                        : 'border-[#1F243B]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm uppercase tracking-[0.15em] text-slate-400">Palette</p>
                        <h3 className="text-xl font-semibold mt-1">{palette.name}</h3>
                        <p className="text-slate-400 text-sm mt-1">{palette.summary}</p>
                      </div>
                      <button
                        onClick={() => handlePaletteSelect(palette.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          step3.selectedPaletteId === palette.id
                            ? 'bg-blue-500/20 text-blue-200'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {step3.selectedPaletteId === palette.id ? 'Selected' : 'Use palette'}
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-3 mt-5">
                      {palette.colors.map((color) => (
                        <div
                          key={color.role + color.hex}
                          className="rounded-lg border border-[#1F2339] p-2 text-center text-xs"
                        >
                          <div
                            className="h-14 rounded mb-2 border border-white/10"
                            style={{ backgroundColor: color.hex }}
                          />
                          <p className="font-mono text-[11px]">{color.hex}</p>
                          <p className="text-[10px] uppercase tracking-wide text-slate-400 mt-1">{color.role}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'typography' && step3.typographyOptions.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-6">
                {step3.typographyOptions.map((type) => (
                  <div
                    key={type.id}
                    className={`rounded-2xl border p-6 bg-gradient-to-b from-[#171C2D] to-[#11121D] ${
                      step3.selectedTypographyId === type.id
                        ? 'border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.25)]'
                        : 'border-[#1F243B]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.15em] text-slate-400">Pairing</p>
                        <h3 className="text-xl font-semibold mt-1">{type.name}</h3>
                        <p className="text-slate-400 text-sm">{type.description}</p>
                      </div>
                      <button
                        onClick={() => handleTypographySelect(type.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          step3.selectedTypographyId === type.id
                            ? 'bg-blue-500/20 text-blue-200'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {step3.selectedTypographyId === type.id ? 'Selected' : 'Use pairing'}
                      </button>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-sm space-y-3">
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">{type.headingFont}</p>
                        <p style={{ fontFamily: `${type.headingFont}, 'Inter'` }} className="text-xl font-bold">
                          {type.sampleText}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">{type.bodyFont}</p>
                        <p style={{ fontFamily: `${type.bodyFont}, 'Inter'` }} className="text-base">
                          {type.sampleText}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'style' && step3.styleDirections.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-6">
                {step3.styleDirections.map((style) => (
                  <div
                    key={style.id}
                    className={`rounded-2xl border p-6 bg-gradient-to-b from-[#171C2D] to-[#11121D] ${
                      step3.selectedStyleId === style.id
                        ? 'border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.25)]'
                        : 'border-[#1F243B]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm uppercase tracking-[0.15em] text-slate-400">Direction</p>
                        <h3 className="text-xl font-semibold mt-1">{style.name}</h3>
                        <p className="text-slate-400 text-sm">{style.description}</p>
                      </div>
                      <button
                        onClick={() => handleStyleSelect(style.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          step3.selectedStyleId === style.id
                            ? 'bg-blue-500/20 text-blue-200'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {step3.selectedStyleId === style.id ? 'Selected' : 'Use style'}
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {style.keywords.map((keyword) => (
                        <span key={keyword} className="px-2.5 py-1 text-xs rounded-full bg-slate-800 text-slate-200">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'logo' && (
              <div className="mt-8 space-y-6">
                {/* Prompt Input */}
                <div>
                  <label className="block text-sm font-bold text-slate-100 mb-2 uppercase tracking-wide">
                    Logo Prompt
                  </label>
                  <textarea
                    value={logoPrompt}
                    onChange={(e) => {
                      setPromptDirty(true);
                      setLogoPrompt(e.target.value);
                    }}
                    placeholder="Describe your app logo..."
                    rows={3}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#444] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-100 mb-2 uppercase tracking-wide">Logo Text Treatment</p>
                  <div className="inline-flex rounded-full bg-[#1A1F32] p-1 border border-[#2c314b]">
                    {[
                      { label: 'Symbol only', value: 'symbol-only' as const },
                      { label: 'Icon + text', value: 'with-text' as const },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateStep3Data({ logoTextMode: option.value })}
                        className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                          step3.logoTextMode === option.value
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-900 hover:text-white hover:bg-slate-700/50'
                        }`}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Configuration Row */}
                <div className="flex gap-3 items-center flex-wrap">
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as Provider)}
                    className="px-3 py-2 bg-[#1A1F32] border border-[#444] rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="gemini">🌟 Gemini</option>
                    <option value="openai">🤖 OpenAI</option>
                  </select>

                  {provider === 'gemini' && (
                    <select
                      value={googleModel}
                      onChange={(e) => setGoogleModel(e.target.value as GoogleModel)}
                      className="px-3 py-2 bg-[#1A1F32] border border-[#444] rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="nano-banana">Nano Banana Standard</option>
                      <option value="nano-banana-pro">Nano Banana Pro</option>
                    </select>
                  )}

                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="px-3 py-2 bg-[#1A1F32] border border-[#444] rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value={1}>1 image</option>
                    <option value={2}>2 images</option>
                    <option value={3}>3 images</option>
                    <option value={4}>4 images</option>
                  </select>

                  <button
                    onClick={handleGenerateLogo}
                    disabled={isGeneratingLogo || !logoPrompt.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <div className="i-ph:sparkle text-lg" />
                    {isGeneratingLogo ? 'Generating...' : 'Generate'}
                  </button>

                  {logoUrls.length > 0 && (
                    <button
                      onClick={() => {
                        setPromptDirty(false);
                        setLogoPrompt(generateLogoPrompt());
                      }}
                      className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
                    >
                      Reset Prompt
                    </button>
                  )}
                </div>

                {/* Generated Logos Grid */}
                {logoUrls.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-300">Generated Logos ({logoUrls.length})</h4>
                    <div className="grid grid-cols-4 gap-4">
                      {logoUrls.map((url, index) => (
                        <div
                          key={index}
                          onClick={() => handleSelectLogo(url)}
                          className={`relative rounded-xl border-2 overflow-hidden bg-slate-900 p-4 cursor-pointer transition-all group ${
                            selectedLogo === url
                              ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                              : 'border-[#1F243B] hover:border-[#2F344B]'
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Logo ${index + 1}`}
                            className="w-full h-auto aspect-square object-contain"
                            crossOrigin="anonymous"
                          />
                          {selectedLogo === url && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                              ✓ Selected
                            </div>
                          )}
                          {/* Edit Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLogoToEdit(url);
                              setEditPrompt('');
                              setIsEditModalOpen(true);
                            }}
                            className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 p-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-600 transition-all opacity-60 group-hover:opacity-100 focus:opacity-100 hover:opacity-100"
                            title="Edit this logo"
                          >
                            ✏️
                          </button>
                        </div>
                      ))}
                    </div>

                    {selectedLogo && (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setIsFullSizeModalOpen(true)}
                          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
                        >
                          👁️ View Full Size
                        </button>
                        <button
                          onClick={() => {
                            setLogoUrls([]);
                            setSelectedLogo(null);
                            updateStep3Data({
                              logo: null,
                              logoVariations: [],
                              logoProcessStatus: 'idle',
                            });
                          }}
                          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
                        >
                          🔄 Start Over
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 text-slate-400 text-xs flex justify-between">
              <div>
                Mood board images analyzed: <strong>{step2.referenceImages.length}</strong>
              </div>
              {step3.lastExtractedAt && <div>Last analyzed {new Date(step3.lastExtractedAt).toLocaleTimeString()}</div>}
            </div>
          </>
        )}
      </div>

      {/* Edit Logo Modal - Rendered via Portal for proper centering */}
      {isEditModalOpen &&
        logoToEdit &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#0B0F1C] border border-[#1F243B] rounded-xl p-6 shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Edit Logo</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <img
                  src={logoToEdit}
                  alt="Logo to edit"
                  className="w-full max-w-sm mx-auto rounded-lg border border-[#1F243B]"
                  crossOrigin="anonymous"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Describe the changes you want</label>
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="E.g., Make the icon larger, change color to blue, add a gradient..."
                    className="w-full px-4 py-3 rounded-lg bg-[#161B2F] border border-[#1F243B] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#2a2a2a] border border-[#333] text-white hover:bg-[#333] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!editPrompt.trim()) {
                        toast.error('Please describe the changes you want');
                        return;
                      }

                      setIsGeneratingLogo(true);
                      toast.info('Editing logo...');

                      try {
                        // Extract original URL if it's a proxy URL
                        const originalUrl = getOriginalUrl(logoToEdit);
                        console.log('[Edit Logo] Original URL:', originalUrl);
                        console.log('[Edit Logo] Logo to edit:', logoToEdit);

                        const response = await fetch('/api/test/image', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            prompt: editPrompt,
                            provider: 'gemini',
                            googleModel: 'nano-banana-edit',
                            outputFormat: 'png',
                            aspectRatio: '1:1',
                            referenceImages: [originalUrl],
                          }),
                        });

                        if (!response.ok) {
                          const errorData = await response.json();
                          throw new Error(errorData.error || `Server error: ${response.status}`);
                        }

                        const data = await response.json();

                        if (data.success && data.imageUrl) {
                          const safeUrl = getSafeLogoUrl(data.imageUrl);

                          // Add to local state
                          setLogoUrls((prev) => [...prev, safeUrl]);
                          setSelectedLogo(safeUrl);

                          // Add to store logoVariations
                          const timestamp = Date.now();
                          const newVariation = {
                            id: `logo-edited-${timestamp}`,
                            url: safeUrl,
                            prompt: editPrompt,
                          };
                          const existingVariations = designWizardStore.get().step3.logoVariations || [];
                          updateStep3Data({
                            logoVariations: [...existingVariations, newVariation],
                            logo: {
                              url: safeUrl,
                              prompt: editPrompt,
                              format: 'png',
                              selectedVariation: existingVariations.length,
                            },
                          });

                          setIsEditModalOpen(false);
                          setEditPrompt('');
                          toast.success('Logo edited successfully!');
                        } else {
                          throw new Error(data.error || 'Failed to edit logo');
                        }
                      } catch (error: any) {
                        console.error('[Edit Logo] Error:', error);
                        toast.error(error.message || 'An error occurred while editing logo');
                      } finally {
                        setIsGeneratingLogo(false);
                      }
                    }}
                    disabled={isGeneratingLogo || !editPrompt.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isGeneratingLogo && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {isGeneratingLogo ? 'Editing...' : 'Generate Edit'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Full Size Logo Modal - Rendered via Portal */}
      {isFullSizeModalOpen &&
        selectedLogo &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setIsFullSizeModalOpen(false)}
          >
            <div className="relative max-w-[90vw] max-h-[90vh] p-4">
              <button
                onClick={() => setIsFullSizeModalOpen(false)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl font-bold transition-colors"
                title="Close"
              >
                ✕
              </button>
              <img
                src={selectedLogo}
                alt="Logo Full Size"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
                crossOrigin="anonymous"
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
