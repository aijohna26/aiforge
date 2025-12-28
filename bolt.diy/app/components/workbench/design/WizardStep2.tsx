import { useStore } from '@nanostores/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  designWizardStore,
  updateStep2Data,
  addReferenceImage,
  removeReferenceImage,
  canAddMoreImages,
  getRemainingImageSlots,
  isImageFormatSupported,
  MAX_REFERENCE_IMAGES,
  SUPPORTED_IMAGE_FORMATS,
} from '~/lib/stores/designWizard';

export function WizardStep2() {
  const wizardData = useStore(designWizardStore);
  const { step2 } = wizardData;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showPasteHint, setShowPasteHint] = useState(false);

  // Handle file upload
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setUploadError(null);

    const remainingSlots = getRemainingImageSlots();
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      // Validate file type
      if (!isImageFormatSupported(file.type)) {
        setUploadError(`Unsupported format: ${file.name}. Please use JPG, PNG, GIF, or WebP.`);
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`File too large: ${file.name}. Maximum size is 10MB.`);
        continue;
      }

      // Create object URL for preview
      const url = URL.createObjectURL(file);
      const id = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      try {
        addReferenceImage({
          id,
          url,
          file,
          source: 'upload',
        });
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Failed to add image');
      }
    }
  }, []);

  // Handle paste from clipboard - updated to work with global paste
  const handlePaste = useCallback((e: ClipboardEvent) => {
    // Don't interfere with paste in text inputs
    const target = e.target as HTMLElement;

    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    if (!canAddMoreImages()) {
      setUploadError(`Maximum ${MAX_REFERENCE_IMAGES} images allowed`);
      setShowPasteHint(true);
      setTimeout(() => setShowPasteHint(false), 3000);

      return;
    }

    const items = e.clipboardData?.items;

    if (!items) {
      return;
    }

    setUploadError(null);

    let pastedImage = false;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault(); // Prevent default paste behavior

        const file = item.getAsFile();

        if (file) {
          const url = URL.createObjectURL(file);
          const id = `paste-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          try {
            addReferenceImage({
              id,
              url,
              file,
              source: 'paste',
            });
            pastedImage = true;
            setShowPasteHint(true);
            setTimeout(() => setShowPasteHint(false), 2000);
          } catch (error) {
            setUploadError(error instanceof Error ? error.message : 'Failed to add image');
          }
        }
      }
    }

    if (!pastedImage && items.length > 0) {
      // User tried to paste something that's not an image
      const hasText = Array.from(items).some((item) => item.type.startsWith('text/'));

      if (!hasText) {
        setUploadError('No image found in clipboard. Copy an image first.');
        setShowPasteHint(true);
        setTimeout(() => {
          setShowPasteHint(false);
          setUploadError(null);
        }, 3000);
      }
    }
  }, []);

  // Add global paste event listener
  useEffect(() => {
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (!canAddMoreImages()) {
        setUploadError(`Maximum ${MAX_REFERENCE_IMAGES} images allowed`);
        return;
      }

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files);
      }
    },
    [handleFileUpload],
  );

  // Handle remove image
  const handleRemoveImage = useCallback(
    (imageId: string) => {
      const image = step2.referenceImages.find((img) => img.id === imageId);

      if (image?.url.startsWith('blob:')) {
        URL.revokeObjectURL(image.url);
      }

      removeReferenceImage(imageId);
      setUploadError(null);
    },
    [step2.referenceImages],
  );

  const remainingSlots = getRemainingImageSlots();
  const hasImages = step2.referenceImages.length > 0;

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-bolt-elements-textPrimary mb-2">Step 2: Style & Personality</h2>
        <p className="text-bolt-elements-textSecondary">
          Upload reference images to define your app's visual style, or manually select style preferences
        </p>
      </div>

      {/* Main Content - Split Layout */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left: Mood Board Canvas */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-bolt-elements-textPrimary">
                Reference Images ({step2.referenceImages.length}/{MAX_REFERENCE_IMAGES})
              </h3>
              <p className="text-xs text-bolt-elements-textTertiary mt-1">
                JPG, PNG, GIF, WebP • Max {MAX_REFERENCE_IMAGES} images • 10MB each
              </p>
            </div>
            {hasImages && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!canAddMoreImages()}
                className="px-3 py-1.5 text-sm bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add More
              </button>
            )}
          </div>

          {/* Paste notification */}
          {showPasteHint && (
            <div
              className="fixed top-4 right-4 z-50 px-4 py-3 bg-green-500 text-white rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300 ease-in-out"
              style={{ animation: 'slideInRight 0.3s ease-out' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Image pasted successfully!</span>
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

          {/* Upload Area */}
          <div
            className={`flex-1 border-2 border-dashed rounded-lg transition-colors relative ${
              dragActive
                ? 'border-bolt-elements-button-primary-background bg-bolt-elements-button-primary-background/5'
                : 'border-bolt-elements-borderColor'
            } ${!canAddMoreImages() ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_IMAGE_FORMATS.join(',')}
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              disabled={!canAddMoreImages()}
            />

            {!hasImages ? (
              // Empty state
              <div className="h-full flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 mx-auto mb-4 text-bolt-elements-textSecondary">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">Upload reference images</h4>
                  <p className="text-sm text-bolt-elements-textSecondary mb-4">
                    Drag and drop, paste, or click to upload images that inspire your app's design
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text rounded-lg transition-colors"
                  >
                    Choose Files
                  </button>
                  <p className="text-xs text-bolt-elements-textTertiary mt-4">
                    Supports JPG, PNG, GIF, WebP • Max {MAX_REFERENCE_IMAGES} images • Max 10MB each
                  </p>
                  <div className="mt-4 p-3 bg-bolt-elements-background-depth-2 rounded-lg text-left space-y-2">
                    <p className="text-xs text-bolt-elements-textSecondary">
                      <strong className="text-bolt-elements-textPrimary">📋 Paste:</strong> Copy an image anywhere
                      (right-click on an image → Copy image) then press{' '}
                      <kbd className="px-1.5 py-0.5 bg-bolt-elements-background-depth-3 rounded text-[10px] font-mono">
                        Ctrl+V
                      </kbd>{' '}
                      or{' '}
                      <kbd className="px-1.5 py-0.5 bg-bolt-elements-background-depth-3 rounded text-[10px] font-mono">
                        ⌘+V
                      </kbd>
                    </p>
                    <p className="text-xs text-bolt-elements-textSecondary">
                      <strong className="text-bolt-elements-textPrimary">🖱️ Drag:</strong> Drag images from your desktop
                      or browser directly into this area
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Image grid
              <div className="h-full overflow-auto p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {step2.referenceImages.map((image) => (
                    <div
                      key={image.id}
                      className="relative group aspect-square rounded-lg overflow-hidden bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor"
                    >
                      <img src={image.url} alt="Reference" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => handleRemoveImage(image.id)}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                          title="Remove image"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                        {image.source === 'paste' ? '📋' : '📁'}
                      </div>
                    </div>
                  ))}
                  {canAddMoreImages() && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-bolt-elements-borderColor hover:border-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-background/5 transition-colors flex flex-col items-center justify-center gap-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
                    >
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs">Add More</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error message */}
          {uploadError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {uploadError}
            </div>
          )}

          {/* Remaining slots indicator */}
          {hasImages && remainingSlots > 0 && (
            <p className="text-xs text-bolt-elements-textTertiary">
              {remainingSlots} more image{remainingSlots !== 1 ? 's' : ''} can be added
            </p>
          )}
        </div>

        {/* Right: Style Preferences Form */}
        <div className="w-80 flex flex-col gap-4 bg-bolt-elements-background-depth-1 rounded-lg p-6 border border-bolt-elements-borderColor overflow-auto">
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary">Style Preferences</h3>

          {/* Typography Style */}
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">Typography Style</label>
            <select
              value={step2.typography}
              onChange={(e) => updateStep2Data({ typography: e.target.value as any })}
              className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-button-primary-background"
            >
              <option value="">Select typography...</option>
              <option value="sans-serif">Sans-serif (Modern, clean)</option>
              <option value="serif">Serif (Traditional, elegant)</option>
              <option value="monospace">Monospace (Tech, coding)</option>
              <option value="handwritten">Handwritten (Casual, friendly)</option>
            </select>
          </div>

          {/* UI Aesthetic */}
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">UI Aesthetic</label>
            <select
              value={step2.uiStyle}
              onChange={(e) => updateStep2Data({ uiStyle: e.target.value as any })}
              className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-button-primary-background"
            >
              <option value="">Select UI style...</option>
              <option value="minimal">Minimal (Simple, clean)</option>
              <option value="modern">Modern (Trendy, sleek)</option>
              <option value="playful">Playful (Fun, vibrant)</option>
              <option value="elegant">Elegant (Refined, sophisticated)</option>
              <option value="bold">Bold (Strong, impactful)</option>
            </select>
          </div>

          {/* Personality */}
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">Personality</label>
            <select
              value={step2.personality}
              onChange={(e) => updateStep2Data({ personality: e.target.value as any })}
              className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-button-primary-background"
            >
              <option value="">Select personality...</option>
              <option value="professional">Professional (Business, formal)</option>
              <option value="friendly">Friendly (Approachable, warm)</option>
              <option value="energetic">Energetic (Dynamic, exciting)</option>
              <option value="calm">Calm (Peaceful, relaxed)</option>
              <option value="luxurious">Luxurious (Premium, exclusive)</option>
            </select>
          </div>

          {/* Component Style */}
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">Component Style</label>
            <select
              value={step2.components}
              onChange={(e) => updateStep2Data({ components: e.target.value as any })}
              className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-button-primary-background"
            >
              <option value="">Select component style...</option>
              <option value="rounded">Rounded (Soft corners)</option>
              <option value="sharp">Sharp (Hard edges)</option>
              <option value="mixed">Mixed (Varied corners)</option>
            </select>
          </div>

          {/* Color Preferences */}
          <div className="pt-4 border-t border-bolt-elements-borderColor">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-bolt-elements-textPrimary">Color Palette</label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={step2.colorPreferences.useAutoGenerate}
                  onChange={(e) =>
                    updateStep2Data({
                      colorPreferences: {
                        ...step2.colorPreferences,
                        useAutoGenerate: e.target.checked,
                      },
                    })
                  }
                  className="rounded"
                />
                <span className="text-bolt-elements-textSecondary">Auto-generate</span>
              </label>
            </div>
            {!step2.colorPreferences.useAutoGenerate && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-bolt-elements-textSecondary mb-1">Primary</label>
                  <input
                    type="color"
                    value={step2.colorPreferences.primary}
                    onChange={(e) =>
                      updateStep2Data({
                        colorPreferences: {
                          ...step2.colorPreferences,
                          primary: e.target.value,
                        },
                      })
                    }
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-bolt-elements-textSecondary mb-1">Secondary</label>
                  <input
                    type="color"
                    value={step2.colorPreferences.secondary}
                    onChange={(e) =>
                      updateStep2Data({
                        colorPreferences: {
                          ...step2.colorPreferences,
                          secondary: e.target.value,
                        },
                      })
                    }
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={step2.additionalNotes}
              onChange={(e) => updateStep2Data({ additionalNotes: e.target.value })}
              placeholder="Any specific design preferences or requirements..."
              rows={3}
              className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary resize-none focus:outline-none focus:ring-2 focus:ring-bolt-elements-button-primary-background"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
