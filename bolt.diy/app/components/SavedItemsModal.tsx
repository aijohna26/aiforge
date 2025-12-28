import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '~/components/ui/Button';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';
import { ImageEditor } from './workbench/design/ImageEditor';

interface SelectedScreen {
  id?: string;
  type: string;
  name: string;
  url: string;
}

type SavedItem = {
  id?: string;
  type: 'logo' | 'screen';
  name: string;
  url: string;
};

interface SavedItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedLogo: string | null;
  savedScreens: SelectedScreen[];
  onRemoveItem?: (item: SavedItem) => void;
  onUpdateItem?: (type: 'logo' | 'screen', id: string, newUrl: string) => void;
}

const EDIT_MODELS = [
  { value: 'nano-banana-edit', label: 'Gemini Nano Banana Edit', provider: 'google', icon: 'i-ph:google-logo' },
  { value: 'gpt-image-1-edit', label: 'GPT Image 1 Edit', provider: 'openai', icon: 'i-ph:openai-logo' },
  { value: 'qwen-image-edit', label: 'Qwen Image Edit', provider: 'aliyun', icon: 'i-ph:brain' },
];

export function SavedItemsModal({
  isOpen,
  onClose,
  savedLogo,
  savedScreens,
  onRemoveItem,
  onUpdateItem,
}: SavedItemsModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Edit State
  const [isEditingAI, setIsEditingAI] = useState(false);
  const [isManualEditing, setIsManualEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [editModel, setEditModel] = useState('nano-banana-edit');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Combine logo and screens into one array
  const allItems: SavedItem[] = useMemo(
    () => [
      ...(savedLogo ? [{ id: 'logo', type: 'logo' as const, name: 'App Logo', url: savedLogo }] : []),
      ...savedScreens.map((screen) => ({
        id: screen.id,
        type: 'screen' as const,
        name: screen.name,
        url: screen.url,
      })),
    ],
    [savedLogo, savedScreens],
  );

  const hasItems = allItems.length > 0;
  const currentItem = allItems[currentIndex];

  const handlePrevious = () => {
    if (isGenerating) {
      return;
    }

    setCurrentIndex((prev) => (prev === 0 ? allItems.length - 1 : prev - 1));
    resetEditState();
  };

  const handleNext = () => {
    if (isGenerating) {
      return;
    }

    setCurrentIndex((prev) => (prev === allItems.length - 1 ? 0 : prev + 1));
    resetEditState();
  };

  const resetEditState = () => {
    setIsEditingAI(false);
    setIsManualEditing(false);
    setEditPrompt('');
    setGenError(null);
  };

  useEffect(() => {
    if (currentIndex >= allItems.length && allItems.length > 0) {
      setCurrentIndex(allItems.length - 1);
    }
  }, [allItems.length, currentIndex]);

  const handleCopyImage = async (url: string) => {
    const clipboardSupported =
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      'write' in navigator.clipboard &&
      typeof window !== 'undefined' &&
      (window as any).ClipboardItem;

    if (!clipboardSupported) {
      toast.error('Clipboard image copy not supported in this browser');
      return;
    }

    try {
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error('Failed to download image');
      }

      const blob = await response.blob();
      const ClipboardItemConstructor = (window as any).ClipboardItem;
      const clipboardItem = new ClipboardItemConstructor({ [blob.type]: blob });
      await navigator.clipboard.write([clipboardItem]);
      toast.success('Image copied to clipboard');
    } catch (error) {
      console.error('Failed to copy image', error);
      toast.error('Unable to copy image');
    }
  };

  const handleAIDesignEdit = async () => {
    if (!currentItem || !editPrompt.trim()) {
      return;
    }

    setIsGenerating(true);
    setGenError(null);

    const toastId = toast.info('✨ AI is redesigning your asset...', { autoClose: false });

    try {
      const response = await fetch('/api/test/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editPrompt,
          provider: EDIT_MODELS.find((m) => m.value === editModel)?.provider || 'google',
          googleModel: editModel,
          outputFormat: 'png',
          aspectRatio: currentItem.type === 'logo' ? '1:1' : '9:16',
          referenceImages: [currentItem.url],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.imageUrl) {
        toast.dismiss(toastId);
        toast.success('Design updated successfully!');

        if (onUpdateItem && currentItem.id) {
          onUpdateItem(currentItem.type, currentItem.id, data.imageUrl);
        }

        setIsEditingAI(false);
        setEditPrompt('');
      } else {
        throw new Error(data.error || 'Failed to generate design');
      }
    } catch (error: any) {
      console.error('[AI Edit Error]', error);
      setGenError(error.message);
      toast.dismiss(toastId);
      toast.error(error.message || 'Failed to edit asset');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveManualEdit = (newUrl: string) => {
    if (onUpdateItem && currentItem && currentItem.id) {
      onUpdateItem(currentItem.type, currentItem.id, newUrl);
    }

    setIsManualEditing(false);
    toast.success('Edit saved successfully');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-[#0b0c14] border border-[#1F243B] rounded-[28px] shadow-[0_24px_80px_rgba(0,0,0,0.8)] max-w-5xl w-full flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#1F243B] flex justify-between items-center bg-[#0d0e1a]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/20">
              <div className="i-ph:briefcase-bold text-indigo-400 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Design Assets</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">VAULT & EDITOR</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="size-10 flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all border border-white/5"
            >
              <div className="i-ph:x-bold text-lg" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Viewer Area */}
          <div
            className={`flex-1 relative flex flex-col p-8 transition-all duration-500 ${isEditingAI ? 'bg-black/40' : ''}`}
          >
            {!hasItems ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-2">
                  <div className="i-ph:ghost-bold text-4xl text-white/10" />
                </div>
                <h3 className="text-white/60 font-black text-lg uppercase tracking-tight">No assets found</h3>
                <p className="text-white/30 text-xs font-medium max-w-xs leading-relaxed">
                  Generate designs in the wizard steps to see them in your repository.
                </p>
              </div>
            ) : (
              <>
                {/* Item Metadata */}
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                        currentItem.type === 'logo'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}
                    >
                      {currentItem.type === 'logo' ? 'Logo' : 'App Screen'}
                    </span>
                    <h3 className="text-white font-black uppercase tracking-tight text-sm opacity-60 truncate max-w-[200px]">
                      {currentItem.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyImage(currentItem.url)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.05] text-[10px] font-black text-white/60 uppercase tracking-widest transition-all"
                    >
                      <div className="i-ph:copy-bold text-sm" />
                      Copy URL
                    </button>

                    {onRemoveItem && (
                      <button
                        onClick={() => onRemoveItem(currentItem)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[10px] font-black text-red-400 uppercase tracking-widest transition-all"
                      >
                        <div className="i-ph:trash-bold text-sm" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Primary Display */}
                <div className="flex-1 flex items-center justify-center relative">
                  <div className="relative group max-w-full h-full flex items-center justify-center">
                    <div
                      className={`absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full transition-opacity duration-700 ${isGenerating ? 'opacity-100 animate-pulse' : 'opacity-20'}`}
                    />

                    <img
                      src={
                        currentItem.url
                          ? currentItem.url.startsWith('http')
                            ? `/api/image-proxy?url=${encodeURIComponent(currentItem.url)}`
                            : currentItem.url
                          : ''
                      }
                      alt={currentItem.name}
                      className={`relative max-w-full max-h-[450px] object-contain rounded-2xl shadow-2xl transition-all duration-500 ${isGenerating ? 'scale-95 opacity-50 grayscale' : 'scale-100 grayscale-0'}`}
                    />

                    {isGenerating && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="size-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_40px_rgba(99,102,241,0.4)]" />
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] animate-pulse">
                            Processing...
                          </span>
                        </div>
                      </div>
                    )}

                    {!isEditingAI && !isGenerating && (
                      <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        <div className="flex items-center gap-2 p-1.5 bg-[#17171A]/90 backdrop-blur-xl border border-white/[0.1] rounded-full shadow-2xl">
                          <button
                            onClick={() => setIsEditingAI(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest transition-all"
                          >
                            <div className="i-ph:sparkle-fill text-sm" />
                            AI Edit
                          </button>
                          <button
                            onClick={() => setIsManualEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.1] hover:bg-white/[0.2] text-white text-[11px] font-black uppercase tracking-widest transition-all"
                          >
                            <div className="i-ph:paint-brush-bold text-sm" />
                            Manual
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  {allItems.length > 1 && !isGenerating && (
                    <>
                      <button
                        onClick={handlePrevious}
                        className="absolute -left-4 top-1/2 -translate-y-1/2 size-12 flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all border border-white/5 shadow-xl"
                      >
                        <div className="i-ph:caret-left-bold text-xl" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="absolute -right-4 top-1/2 -translate-y-1/2 size-12 flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white transition-all border border-white/5 shadow-xl"
                      >
                        <div className="i-ph:caret-right-bold text-xl" />
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* AI Sidebar */}
          {isEditingAI && currentItem && (
            <div className="w-[380px] border-l border-[#1F243B] bg-[#0d0e1a]/80 backdrop-blur-3xl flex flex-col p-8 animate-in slide-in-from-right duration-500">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <div className="i-ph:sparkle-bold text-indigo-400 text-lg" />
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-[0.1em]">AI Design Lab</h4>
                </div>
                <button
                  onClick={() => setIsEditingAI(false)}
                  className="text-white/20 hover:text-white transition-colors"
                >
                  <div className="i-ph:x-bold text-lg" />
                </button>
              </div>

              <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em]">
                    Instructions
                  </label>
                  <div className="relative">
                    <textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="E.g. Make it more minimalist, add a glassmorphism effect, use a different color palette..."
                      rows={5}
                      className="w-full bg-black/40 border border-white/[0.08] rounded-2xl px-5 py-4 text-[13px] text-white/90 placeholder-white/20 focus:outline-none focus:border-indigo-500/40 focus:bg-black/60 resize-none transition-all leading-relaxed font-medium"
                      disabled={isGenerating}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em]">
                    Intelligence Engine
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {EDIT_MODELS.map((model) => (
                      <button
                        key={model.value}
                        onClick={() => setEditModel(model.value)}
                        disabled={isGenerating}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          editModel === model.value
                            ? 'bg-indigo-600/10 border-indigo-500/40 text-white'
                            : 'bg-white/[0.02] border-white/[0.05] text-white/40 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`${model.icon} text-lg ${editModel === model.value ? 'text-indigo-400' : 'opacity-40'}`}
                          />
                          <span className="text-[11px] font-black tracking-wider uppercase">{model.label}</span>
                        </div>
                        {editModel === model.value && <div className="i-ph:check-circle-fill text-indigo-500" />}
                      </button>
                    ))}
                  </div>
                </div>

                {genError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="i-ph:warning-circle-bold text-red-500 text-lg flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[11px] font-black text-red-400 uppercase tracking-wide">Design Error</p>
                      <p className="text-[11px] text-red-400/70 font-medium leading-relaxed">{genError}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-8 border-t border-white/[0.05] mt-6">
                <button
                  onClick={handleAIDesignEdit}
                  disabled={isGenerating || !editPrompt.trim()}
                  className="group relative w-full py-4 bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:from-white/5 disabled:to-white/5 text-white disabled:text-white/30 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-[0_8px_32px_rgba(79,70,229,0.4)] disabled:shadow-none active:scale-[0.98] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center justify-center gap-2">
                    <div className={`text-sm ${isGenerating ? 'i-ph:spinner animate-spin' : 'i-ph:magic-wand-fill'}`} />
                    <span>{isGenerating ? 'Updating Design...' : 'Synthesize Design'}</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Assets Carousel Footer */}
        {allItems.length > 0 && (
          <div className="p-6 bg-black/40 border-t border-[#1F243B]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                Repository Explorer
              </span>
              <span className="text-[10px] font-black text-white/30 font-mono tracking-widest">
                {currentIndex + 1} / {allItems.length}
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
              {allItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!isGenerating) {
                      setCurrentIndex(index);
                      resetEditState();
                    }
                  }}
                  className={`relative flex-shrink-0 size-20 rounded-xl overflow-hidden border-2 transition-all group ${
                    index === currentIndex
                      ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)] scale-105 z-10'
                      : 'border-white/10 hover:border-white/30 opacity-40 hover:opacity-100'
                  }`}
                >
                  <img
                    src={
                      item.url
                        ? item.url.startsWith('http')
                          ? `/api/image-proxy?url=${encodeURIComponent(item.url)}`
                          : item.url
                        : ''
                    }
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {index === currentIndex && (
                    <div className="absolute inset-0 border-2 border-white/20 rounded-lg pointer-events-none" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Manual Image Editor Implementation */}
      {isManualEditing &&
        currentItem &&
        typeof document !== 'undefined' &&
        createPortal(
          <ImageEditor
            imageUrl={currentItem.url}
            onSave={handleSaveManualEdit}
            onCancel={() => setIsManualEditing(false)}
          />,
          document.body,
        )}
    </div>
  );
}
