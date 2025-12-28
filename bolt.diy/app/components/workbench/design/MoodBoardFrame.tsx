import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@nanostores/react';
import { designWizardStore, addReferenceImage, removeReferenceImage, updateStep3Data } from '~/lib/stores/designWizard';
import type { Step3Data } from '~/lib/stores/designWizard';

export interface MoodBoardImage {
  id: string;
  url: string;
  file?: File;
}

interface MoodBoardFrameProps {
  zoom?: number;
  panX?: number;
  panY?: number;
  onImagesChange?: (images: MoodBoardImage[]) => void;
}

const MAX_IMAGES = 8;
const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const getSafeImageUrl = (url: string) => {
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

type GoogleModel = 'nano-banana' | 'nano-banana-pro';
type Provider = 'gemini' | 'openai';

// Popular Color Schemes
const POPULAR_COLOR_SCHEMES = [
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    colors: [
      '#6C5CE7',
      '#A29BFE',
      '#00D4FF',
      '#0B0F1C',
      '#161B2F',
      '#F8FAFC',
      '#CBD5F5',
      '#EF4444',
      '#22C55E',
      '#F59E0B',
    ],
    keywords: ['modern', 'professional'],
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    colors: [
      '#0EA5E9',
      '#38BDF8',
      '#7DD3FC',
      '#0C4A6E',
      '#1E40AF',
      '#F0F9FF',
      '#BAE6FD',
      '#DC2626',
      '#10B981',
      '#F59E0B',
    ],
    keywords: ['calm', 'trustworthy'],
  },
  {
    id: 'sunset-warm',
    name: 'Sunset Warm',
    colors: [
      '#F97316',
      '#FB923C',
      '#FDBA74',
      '#7C2D12',
      '#EA580C',
      '#FFF7ED',
      '#FED7AA',
      '#DC2626',
      '#10B981',
      '#F59E0B',
    ],
    keywords: ['energetic', 'warm'],
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    colors: [
      '#10B981',
      '#34D399',
      '#6EE7B7',
      '#064E3B',
      '#047857',
      '#ECFDF5',
      '#A7F3D0',
      '#EF4444',
      '#22C55E',
      '#F59E0B',
    ],
    keywords: ['natural', 'calming'],
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    colors: [
      '#9333EA',
      '#A855F7',
      '#C084FC',
      '#4C1D95',
      '#7C3AED',
      '#FAF5FF',
      '#E9D5FF',
      '#DC2626',
      '#10B981',
      '#F59E0B',
    ],
    keywords: ['luxury', 'creative'],
  },
  {
    id: 'minimal-mono',
    name: 'Minimal Mono',
    colors: [
      '#18181B',
      '#27272A',
      '#52525B',
      '#FAFAFA',
      '#F4F4F5',
      '#09090B',
      '#A1A1AA',
      '#EF4444',
      '#22C55E',
      '#F59E0B',
    ],
    keywords: ['minimal', 'clean'],
  },
];

const TYPOGRAPHY_PRESETS = [
  { id: 'modern', headingFont: 'Inter', bodyFont: 'Inter', name: 'Modern Sans', vibe: 'Clean and professional' },
  {
    id: 'editorial',
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
    name: 'Editorial',
    vibe: 'Premium and readable',
  },
  { id: 'friendly', headingFont: 'Poppins', bodyFont: 'Open Sans', name: 'Friendly', vibe: 'Approachable and warm' },
  { id: 'tech', headingFont: 'Roboto', bodyFont: 'Roboto', name: 'Tech', vibe: 'Modern and reliable' },
  { id: 'bold', headingFont: 'Montserrat', bodyFont: 'Lato', name: 'Bold Impact', vibe: 'Strong and confident' },
];

const STYLE_PRESETS = [
  {
    id: 'modern',
    name: 'Modern Minimal',
    description: 'Clean lines, subtle shadows, spacious layouts',
    keywords: ['minimal', 'clean', 'modern'],
  },
  {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    description: 'Frosted glass effects, transparency, soft shadows',
    keywords: ['glass', 'transparent', 'modern'],
  },
  {
    id: 'neumorphism',
    name: 'Neumorphism',
    description: 'Soft shadows, subtle depth, tactile feel',
    keywords: ['soft', 'tactile', 'subtle'],
  },
  {
    id: 'gradient',
    name: 'Gradient Pop',
    description: 'Bold gradients, vibrant colors, eye-catching',
    keywords: ['vibrant', 'bold', 'colorful'],
  },
  {
    id: 'flat',
    name: 'Flat Design',
    description: 'No shadows, solid colors, simple shapes',
    keywords: ['flat', 'simple', 'clean'],
  },
];

const MANUAL_TYPOGRAPHY_SCALE = {
  h1: { size: 36, weight: '700', lineHeight: 44 },
  h2: { size: 30, weight: '600', lineHeight: 38 },
  h3: { size: 24, weight: '600', lineHeight: 32 },
  body: { size: 16, weight: '400', lineHeight: 24 },
  caption: { size: 14, weight: '400', lineHeight: 20 },
};

export function MoodBoardFrame({ zoom = 1, panX = 0, panY = 0, onImagesChange }: MoodBoardFrameProps) {
  const wizardData = useStore(designWizardStore);
  const images = wizardData.step2.referenceImages;
  const manualEntryActive = wizardData.step3.entryMode === 'manual';

  const [showPasteNotification, setShowPasteNotification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Generation Modal State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [provider, setProvider] = useState<Provider>('gemini');
  const [googleModel, setGoogleModel] = useState<GoogleModel>('nano-banana');
  const [quantity, setQuantity] = useState<number>(4);
  const [isBrowser, setIsBrowser] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Manual Entry Modal State
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manualTab, setManualTab] = useState<'presets' | 'custom'>('presets');
  const [selectedColorScheme, setSelectedColorScheme] = useState<string>('modern-dark');
  const [customColors, setCustomColors] = useState<string[]>([
    '#6C5CE7',
    '#A29BFE',
    '#00D4FF',
    '#0B0F1C',
    '#161B2F',
    '#F8FAFC',
    '#CBD5F5',
    '#EF4444',
    '#22C55E',
    '#F59E0B',
  ]);
  const [selectedTypography, setSelectedTypography] = useState<string>('modern');
  const [selectedStyle, setSelectedStyle] = useState<string>('modern');

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files) {
      return;
    }

    setError(null);

    const remainingSlots = MAX_IMAGES - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    let processedCount = 0;

    filesToProcess.forEach((file) => {
      // Validate file type
      if (!SUPPORTED_FORMATS.includes(file.type)) {
        setError(`Unsupported format: ${file.name}`);
        processedCount++;

        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`File too large: ${file.name}. Max 10MB`);
        processedCount++;

        return;
      }

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();

        reader.onload = (event) => {
          try {
            addReferenceImage({
              id: `${Date.now()}-${Math.random()}`,
              url: event.target?.result as string,
              file,
              source: 'upload',
            });
          } catch (err: any) {
            setError(err.message);
          }
          processedCount++;
        };
        reader.readAsDataURL(file);
      }
    });
  };

  // Handle paste from clipboard
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      // Don't interfere with paste in text inputs
      const target = e.target as HTMLElement;

      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (images.length >= MAX_IMAGES) {
        setError(`Maximum ${MAX_IMAGES} images allowed`);
        setTimeout(() => setError(null), 3000);

        return;
      }

      const items = e.clipboardData?.items;

      if (!items) {
        return;
      }

      setError(null);

      let pastedImage = false;

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();

          const file = item.getAsFile();

          if (file) {
            const reader = new FileReader();

            reader.onload = (event) => {
              try {
                addReferenceImage({
                  id: `paste-${Date.now()}-${Math.random()}`,
                  url: event.target?.result as string,
                  file,
                  source: 'paste',
                });
                pastedImage = true;
                setShowPasteNotification(true);
                setTimeout(() => setShowPasteNotification(false), 2000);
              } catch (err: any) {
                setError(err.message);
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }

      if (!pastedImage && items.length > 0) {
        const hasText = Array.from(items).some((item) => item.type.startsWith('text/'));

        if (!hasText) {
          setError('No image found in clipboard. Copy an image first.');
          setTimeout(() => setError(null), 3000);
        }
      }
    },
    [images],
  );

  // Add global paste event listener
  useEffect(() => {
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  // Debug: Log when modal state changes
  useEffect(() => {
    console.log('AI Modal Open State:', isAIModalOpen);
  }, [isAIModalOpen]);

  const handleRemoveImage = (id: string) => {
    removeReferenceImage(id);
  };

  const handleAddClick = () => {
    if (images.length >= MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      setTimeout(() => setError(null), 3000);

      return;
    }

    fileInputRef.current?.click();
  };

  const handleManualEntry = () => {
    const colorScheme =
      manualTab === 'presets'
        ? POPULAR_COLOR_SCHEMES.find((s) => s.id === selectedColorScheme)
        : { id: 'custom', name: 'Custom', colors: customColors, keywords: ['custom'] };

    const typography = TYPOGRAPHY_PRESETS.find((t) => t.id === selectedTypography);
    const style = STYLE_PRESETS.find((s) => s.id === selectedStyle);

    if (!colorScheme || !typography || !style) {
      setError('Please select all options');
      return;
    }

    // Create palette, typography and style options for Step 3
    const paletteOption: Step3Data['paletteOptions'][0] = {
      id: colorScheme.id,
      name: colorScheme.name,
      summary: colorScheme.keywords.join(', '),
      colors: [
        { role: 'primary', hex: colorScheme.colors[0], description: 'Primary color' },
        { role: 'secondary', hex: colorScheme.colors[1], description: 'Secondary color' },
        { role: 'accent', hex: colorScheme.colors[2], description: 'Accent color' },
        { role: 'background', hex: colorScheme.colors[3], description: 'Background' },
        { role: 'surface', hex: colorScheme.colors[4], description: 'Surface' },
        { role: 'textPrimary', hex: colorScheme.colors[5], description: 'Primary text' },
        { role: 'textSecondary', hex: colorScheme.colors[6], description: 'Secondary text' },
        { role: 'error', hex: colorScheme.colors[7], description: 'Error state' },
        { role: 'success', hex: colorScheme.colors[8], description: 'Success state' },
        { role: 'warning', hex: colorScheme.colors[9], description: 'Warning state' },
      ],
      keywords: colorScheme.keywords,
    };

    const typographyOption: Step3Data['typographyOptions'][0] = {
      id: typography.id,
      name: typography.name,
      headingFont: typography.headingFont,
      bodyFont: typography.bodyFont,
      vibe: typography.vibe,
      description: typography.vibe,
      sampleText: 'The quick brown fox jumps over the lazy dog',
      tags: ['manual'],
      scale: MANUAL_TYPOGRAPHY_SCALE,
    };

    const styleOption: Step3Data['styleDirections'][0] = {
      id: style.id,
      name: style.name,
      description: style.description,
      uiStyle: 'modern',
      keywords: style.keywords,
      personality: ['manual'],
    };

    // Update Step 3 with manual entries
    updateStep3Data({
      paletteOptions: [paletteOption],
      typographyOptions: [typographyOption],
      styleDirections: [styleOption],
      selectedPaletteId: paletteOption.id,
      selectedTypographyId: typographyOption.id,
      selectedStyleId: styleOption.id,
      lastExtractedAt: new Date().toISOString(),
      colorPalette: {
        primary: colorScheme.colors[0],
        secondary: colorScheme.colors[1],
        accent: colorScheme.colors[2],
        background: colorScheme.colors[3],
        surface: colorScheme.colors[4],
        text: {
          primary: colorScheme.colors[5],
          secondary: colorScheme.colors[6],
          disabled: '#94A3B8',
        },
        error: colorScheme.colors[7],
        success: colorScheme.colors[8],
        warning: colorScheme.colors[9],
      },
      typography: {
        fontFamily: `${typography.headingFont}, ${typography.bodyFont}, 'Inter', sans-serif`,
        scale: MANUAL_TYPOGRAPHY_SCALE,
      },
      extractionStatus: 'complete',
      extractionError: undefined,
      entryMode: 'manual',
    });

    setIsManualEntryOpen(false);
    setError(null);
  };

  const handleClearManualEntry = () => {
    updateStep3Data({
      entryMode: 'ai',
      paletteOptions: [],
      typographyOptions: [],
      styleDirections: [],
      selectedPaletteId: null,
      selectedTypographyId: null,
      selectedStyleId: null,
      lastExtractedAt: null,
      extractionStatus: 'idle',
      extractionError: undefined,
      colorPalette: null,
      typography: null,
    });
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (images.length + quantity > MAX_IMAGES) {
      setError(`Cannot generate ${quantity} images. Only ${MAX_IMAGES - images.length} slots remaining.`);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Generate multiple images in parallel
      const promises = Array.from({ length: quantity }, async () => {
        const response = await fetch('/api/test/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: aiPrompt,
            provider,
            googleModel: provider === 'gemini' ? googleModel : undefined,
            outputFormat: 'png',
            aspectRatio: '1:1',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate image');
        }

        const data: any = await response.json();

        return data;
      });

      const results = await Promise.all(promises);

      const successfulResults = results.filter((result) => result.success && result.imageUrl);

      if (successfulResults.length === 0) {
        throw new Error('No images were generated successfully');
      }

      // Add each generated image to the store
      successfulResults.forEach((result) => {
        try {
          addReferenceImage({
            id: `ai-${Date.now()}-${Math.random()}`,
            url: getSafeImageUrl(result.imageUrl),
            source: 'upload', // AI generated images are treated as uploads
          });
        } catch (err: any) {
          console.error('Failed to add AI image:', err);
        }
      });

      setIsAIModalOpen(false);
      setAiPrompt('');
    } catch (err: any) {
      console.error('Error generating images:', err);
      setError(err.message || 'Failed to generate images. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Paste notification */}
      {showPasteNotification && (
        <div
          className="fixed top-4 right-4 z-[9999] px-4 py-3 bg-green-500 text-white rounded-lg shadow-lg flex items-center gap-2"
          style={{ animation: 'slideInRight 0.3s ease-out' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Image pasted!</span>
        </div>
      )}
      <style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>

      <div className="w-[770px] max-h-[85vh] overflow-y-auto custom-scrollbar pointer-events-auto bg-[#1a1a1a] border-2 border-[#333] rounded-xl p-10 pb-60 shadow-2xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Step 2: Style Guide</h2>
          <p className="text-sm text-gray-400">Upload images to create your mood board</p>
          <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF, WebP • Max {MAX_IMAGES} images • 10MB each</p>
          <p className="text-xs text-blue-400 mt-1">
            💡 Tip: Press Ctrl+V (⌘+V on Mac) to paste images from your clipboard
          </p>
          {manualEntryActive && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-green-600/40 bg-green-600/10 px-4 py-2 text-xs text-green-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>Manual style selections active. You can proceed without running AI.</span>
              </div>
              <button
                onClick={handleClearManualEntry}
                className="text-green-100 underline decoration-dotted decoration-green-200 hover:text-white text-[11px]"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        {/* Mood Board Area */}
        <div className="relative border-2 border-dashed border-[#444] rounded-lg p-6 min-h-[400px] bg-[#0a0a0a]">
          {/* Images Grid */}
          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-4 mb-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group aspect-square cursor-zoom-in"
                  onClick={() => setPreviewImage(image.url)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setPreviewImage(image.url);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <img
                    src={image.url}
                    alt="Mood board"
                    className="w-full h-full object-cover rounded-lg border border-[#444]"
                  />
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(image.id);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Remove image"
                  >
                    <div className="i-ph:x text-white text-sm" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[350px] text-gray-500">
              <div className="i-ph:image text-6xl mb-4 opacity-30" />
              <p className="text-sm">No images yet. Click "Add More" to upload.</p>
            </div>
          )}

          {/* Add More Button */}
          <button
            onClick={handleAddClick}
            className="absolute bottom-6 right-6 px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] border border-[#444] rounded-lg text-sm text-white flex items-center gap-2 transition-colors"
          >
            <div className="i-ph:plus text-lg" />
            Add More
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setIsManualEntryOpen(true)}
            className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] border border-[#444] rounded-lg text-sm text-white flex items-center gap-2 transition-colors pointer-events-auto"
          >
            <div className="i-ph:sliders text-lg" />
            {manualEntryActive ? 'Edit Manual Entry' : 'Manual Entry'}
          </button>
          <button
            onClick={() => {
              console.log('Generate with AI clicked, opening modal');
              setIsAIModalOpen(true);
            }}
            disabled={images.length >= MAX_IMAGES}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
          >
            <div className="i-ph:sparkle text-lg" />
            Generate with AI
          </button>
        </div>

        {/* Helper Text */}
        <div className="mt-6 pt-6 border-t border-[#333]">
          <p className="text-xs text-gray-500 italic">
            Upload reference images or let AI generate a style guide based on your app description
          </p>
          {manualEntryActive && (
            <p className="text-xs text-green-400 mt-2">
              Manual entry is on — Next will use your selections without sending images to the AI model.
            </p>
          )}
        </div>
      </div>

      {isBrowser && previewImage
        ? createPortal(
            <div
              className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
              onClick={() => setPreviewImage(null)}
            >
              <div
                className="relative max-w-4xl w-full bg-[#0a0a0a] border border-[#333] rounded-2xl p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                  onClick={() => setPreviewImage(null)}
                  aria-label="Close preview"
                >
                  <div className="i-ph:x text-2xl" />
                </button>
                <div className="flex justify-center">
                  <img
                    src={getSafeImageUrl(previewImage)}
                    alt="Mood board preview"
                    className="max-h-[70vh] max-w-full rounded-xl border border-[#333] object-contain"
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {isBrowser && isAIModalOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsAIModalOpen(false);
                }
              }}
            >
              <div
                className="bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-[#333] flex justify-between items-center">
                  <h3 className="font-bold text-xl text-white">Generate Images with AI</h3>
                  <button
                    onClick={() => setIsAIModalOpen(false)}
                    disabled={isGenerating}
                    className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <div className="i-ph:x text-xl" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Describe the style you want
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="E.g., Modern minimal UI design with pastel colors, clean layouts, gradient backgrounds, soft shadows..."
                      rows={4}
                      className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#444] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-2">Provider</label>
                      <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value as Provider)}
                        className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#444] rounded-md text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        disabled={isGenerating}
                      >
                        <option value="gemini" className="bg-[#2a2a2a]">
                          Google
                        </option>
                        <option value="openai" className="bg-[#2a2a2a]">
                          OpenAI
                        </option>
                      </select>
                    </div>

                    {provider === 'gemini' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-2">Model</label>
                        <select
                          value={googleModel}
                          onChange={(e) => setGoogleModel(e.target.value as GoogleModel)}
                          className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#444] rounded-md text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          disabled={isGenerating}
                        >
                          <option value="nano-banana" className="bg-[#2a2a2a]">
                            Nano Banana Standard (Fast)
                          </option>
                          <option value="nano-banana-pro" className="bg-[#2a2a2a]">
                            Nano Banana Pro (Quality)
                          </option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-2">Number of Images</label>
                      <select
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#444] rounded-md text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        disabled={isGenerating}
                      >
                        <option value={1} className="bg-[#2a2a2a]">
                          1 image
                        </option>
                        <option value={2} className="bg-[#2a2a2a]">
                          2 images
                        </option>
                        <option value={4} className="bg-[#2a2a2a]">
                          4 images
                        </option>
                        <option value={6} className="bg-[#2a2a2a]">
                          6 images
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-xs text-blue-400">
                      💡 Tip: Be specific about colors, styles, and mood. The AI will generate {quantity} inspiration{' '}
                      {quantity === 1 ? 'image' : 'images'} based on your description.
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <p className="text-sm text-red-400">❌ {error}</p>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-[#333] bg-[#0a0a0a] flex justify-end gap-3">
                  <button
                    onClick={() => setIsAIModalOpen(false)}
                    disabled={isGenerating}
                    className="px-6 py-2.5 rounded-lg font-medium text-sm text-white bg-[#2a2a2a] hover:bg-[#333] border border-[#444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="px-6 py-2.5 rounded-lg font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <div className="i-ph:sparkle text-lg" />
                        Generate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* Manual Entry Modal */}
      {isBrowser && isManualEntryOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsManualEntryOpen(false);
                }
              }}
            >
              <div
                className="bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-[#333] flex justify-between items-center sticky top-0 bg-[#1a1a1a] z-10">
                  <div>
                    <h3 className="font-bold text-xl text-white">Manual Style Entry</h3>
                    <p className="text-sm text-gray-400 mt-1">Configure your design system manually</p>
                  </div>
                  <button
                    onClick={() => setIsManualEntryOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <div className="i-ph:x text-xl" />
                  </button>
                </div>

                <div className="p-6 space-y-8">
                  {/* Color Scheme Section */}
                  <div>
                    <h4 className="font-semibold text-lg text-white mb-4">Color Scheme</h4>

                    {/* Preset/Custom Toggle */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setManualTab('presets')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          manualTab === 'presets'
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333]'
                        }`}
                      >
                        Popular Schemes
                      </button>
                      <button
                        onClick={() => setManualTab('custom')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          manualTab === 'custom'
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333]'
                        }`}
                      >
                        Custom Colors
                      </button>
                    </div>

                    {manualTab === 'presets' ? (
                      <div className="grid grid-cols-2 gap-4">
                        {POPULAR_COLOR_SCHEMES.map((scheme) => (
                          <button
                            key={scheme.id}
                            onClick={() => setSelectedColorScheme(scheme.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              selectedColorScheme === scheme.id
                                ? 'border-blue-500 bg-[#1e3a5f] text-white'
                                : 'border-[#444] bg-[#e5e7eb] hover:bg-[#d1d5db] text-gray-900'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p
                                  className={`font-semibold ${selectedColorScheme === scheme.id ? 'text-white' : 'text-gray-900'}`}
                                >
                                  {scheme.name}
                                </p>
                                <p
                                  className={`text-xs mt-1 ${selectedColorScheme === scheme.id ? 'text-blue-200' : 'text-gray-600'}`}
                                >
                                  {scheme.keywords.join(' • ')}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              {scheme.colors.slice(0, 6).map((color, idx) => (
                                <div
                                  key={idx}
                                  className="w-8 h-8 rounded-lg border border-gray-300"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-[#2a2a2a] border border-[#444] rounded-xl p-4">
                        <p className="text-sm text-gray-400 mb-4">Click on a color to edit it</p>
                        <div className="grid grid-cols-5 gap-3">
                          {customColors.map((color, idx) => (
                            <div key={idx} className="flex flex-col gap-2">
                              <input
                                type="color"
                                value={color}
                                onChange={(e) => {
                                  const newColors = [...customColors];
                                  newColors[idx] = e.target.value.toUpperCase();
                                  setCustomColors(newColors);
                                }}
                                className="w-full h-16 rounded-lg border border-[#444] cursor-pointer"
                              />
                              <input
                                type="text"
                                value={color}
                                onChange={(e) => {
                                  const newColors = [...customColors];
                                  newColors[idx] = e.target.value.toUpperCase();
                                  setCustomColors(newColors);
                                }}
                                className="w-full px-2 py-1 bg-[#1a1a1a] border border-[#444] rounded text-xs text-white font-mono text-center"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Typography Section */}
                  <div>
                    <h4 className="font-semibold text-lg text-white mb-4">Typography</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {TYPOGRAPHY_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => setSelectedTypography(preset.id)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            selectedTypography === preset.id
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-[#444] bg-[#0a0a0a] hover:border-[#555]'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-white">{preset.name}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {preset.headingFont} + {preset.bodyFont}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">{preset.vibe}</p>
                            </div>
                            <div className="text-right">
                              <p
                                className="text-base text-white font-semibold"
                                style={{ fontFamily: preset.headingFont }}
                              >
                                Heading
                              </p>
                              <p className="text-sm text-gray-300 mt-1" style={{ fontFamily: preset.bodyFont }}>
                                Body text
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Style Section */}
                  <div>
                    <h4 className="font-semibold text-lg text-white mb-4">UI Style</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {STYLE_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => setSelectedStyle(preset.id)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            selectedStyle === preset.id
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-[#444] bg-[#0a0a0a] hover:border-[#555]'
                          }`}
                        >
                          <p className="font-semibold text-white">{preset.name}</p>
                          <p className="text-xs text-gray-300 mt-1">{preset.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {preset.keywords.map((keyword) => (
                              <span
                                key={keyword}
                                className="px-2 py-0.5 text-[10px] rounded-full bg-[#333] text-gray-300"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-[#333] bg-[#0a0a0a] flex justify-end gap-3 sticky bottom-0">
                  <button
                    onClick={() => setIsManualEntryOpen(false)}
                    className="px-6 py-2.5 rounded-lg font-medium text-sm text-white bg-[#2a2a2a] hover:bg-[#333] border border-[#444] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleManualEntry}
                    className="px-6 py-2.5 rounded-lg font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    Apply Style Guide
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
