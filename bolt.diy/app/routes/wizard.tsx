import { useState, useEffect, useRef } from 'react';
import { Button } from '~/components/ui/Button';
import { LogoGenerator } from '~/components/logo-generator';
import { ScreenGenerator } from '~/components/screen-generator';
import { SavedItemsModal } from '~/components/SavedItemsModal';
import { CustomScreenGenerator } from '~/components/screens/CustomScreenGenerator';
import { AlertDialog } from '~/components/AlertDialog';
import { toast } from 'react-toastify';
import { useSearchParams, useNavigate } from '@remix-run/react';
import { isFeatureEnabled, FEATURES } from '~/utils/featureFlags';
import { DesignPanel } from '~/components/workbench/DesignPanel';

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

interface PackageOption {
  id: string;
  name: string;
  credits: number;
  features: string[];
  description?: string;
  badge?: string;
  supportsAI?: boolean;
}

interface AppInfo {
  name: string;
  description: string;
  category: string;
  targetAudience: string;
  colorScheme: string;
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  selectedPackage?: string;
  aiConfig?: {
    enabled: boolean;
    provider: 'anthropic' | 'openai' | 'google' | 'none';
    model: string;
    features: {
      chatbot: boolean;
      contentGeneration: boolean;
      recommendations: boolean;
      search: boolean;
      analysis: boolean;
      translation: boolean;
      imageGeneration: boolean;
      voiceAssistant: boolean;
    };
    context?: string;
    streaming: boolean;
  };
}

interface SavedScreen {
  id: string;
  type: string;
  name: string;
  url: string;
  stage: number;
}

interface StyleBoardState {
  keywords: string[];
  notes: string;
  references: string[];
  typography: string;
  uiStyle: string;
  personality: string[];
  components: {
    corners: 'rounded' | 'sharp';
    gradient: boolean;
  };
}

interface WizardState {
  currentStep: WizardStep;
  appInfo: AppInfo;
  savedLogo: string | null;
  savedScreens: SavedScreen[];
  styleBoard: StyleBoardState;
  packages: PackageOption[];
  screenGeneratorState: {
    generatedScreens: Record<string, string[]>;
    selectedVariations: Record<string, string | null>;
  };
}

const STORAGE_KEY = 'appforge_wizard_state';

const createDefaultStyleBoard = (): StyleBoardState => ({
  keywords: [],
  notes: '',
  references: [],
  typography: 'modern-sans',
  uiStyle: 'clean',
  personality: [],
  components: {
    corners: 'rounded',
    gradient: false,
  },
});

const DEFAULT_PACKAGES: PackageOption[] = [];

const getInitialState = (): WizardState => {
  const defaultStyleBoard = createDefaultStyleBoard();

  if (typeof window === 'undefined') {
    return {
      currentStep: 1,
      appInfo: {
        name: '',
        description: '',
        category: '',
        targetAudience: '',
        colorScheme: '',
        brandColors: {
          primary: '',
          secondary: '',
          accent: '',
        },
        selectedPackage: undefined,
        aiConfig: undefined,
      },
      savedLogo: null,
      savedScreens: [],
      styleBoard: defaultStyleBoard,
      packages: DEFAULT_PACKAGES,
      screenGeneratorState: {
        generatedScreens: { splash: [], signin: [], signup: [] },
        selectedVariations: { splash: null, signin: null, signup: null },
      },
    };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('[Wizard] Restored state from localStorage:', parsed);

      // Migration: Add brandColors if it doesn't exist
      if (parsed.appInfo && !parsed.appInfo.brandColors) {
        parsed.appInfo.brandColors = {
          primary: '',
          secondary: '',
          accent: '',
        };

        // Try to extract colors from colorScheme if it exists
        if (parsed.appInfo.colorScheme) {
          const colorMatch = parsed.appInfo.colorScheme.match(
            /Primary:\s*(#[0-9A-Fa-f]{6})[,)].*Secondary:\s*(#[0-9A-Fa-f]{6})[,)].*Accent:\s*(#[0-9A-Fa-f]{6})/,
          );

          if (colorMatch) {
            parsed.appInfo.brandColors = {
              primary: colorMatch[1],
              secondary: colorMatch[2],
              accent: colorMatch[3],
            };
          }
        }
      }

      if (!parsed.styleBoard) {
        parsed.styleBoard = defaultStyleBoard;
      } else {
        parsed.styleBoard = {
          ...defaultStyleBoard,
          ...parsed.styleBoard,
          components: {
            ...defaultStyleBoard.components,
            ...(parsed.styleBoard.components || {}),
          },
          personality: parsed.styleBoard.personality || defaultStyleBoard.personality,
          references: parsed.styleBoard.references || [],
          keywords: parsed.styleBoard.keywords || [],
        };
      }

      return {
        ...parsed,
        packages: parsed.packages && parsed.packages.length > 0 ? parsed.packages : DEFAULT_PACKAGES,
      } as WizardState;
    }
  } catch (error) {
    console.error('[Wizard] Failed to restore state:', error);
  }

  return {
    currentStep: 1,
    appInfo: {
      name: '',
      description: '',
      category: '',
      targetAudience: '',
      colorScheme: '',
      brandColors: {
        primary: '',
        secondary: '',
        accent: '',
      },
      selectedPackage: undefined,
      aiConfig: undefined,
    },
    savedLogo: null,
    savedScreens: [],
    styleBoard: createDefaultStyleBoard(),
    packages: DEFAULT_PACKAGES,
    screenGeneratorState: {
      generatedScreens: { splash: [], signin: [], signup: [] },
      selectedVariations: { splash: null, signin: null, signup: null },
    },
  };
};

export default function WizardPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const isDubsEnabled = isFeatureEnabled(FEATURES.DUBS_WIZARD_MERGE);

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [appInfo, setAppInfo] = useState<AppInfo>({
    name: '',
    description: '',
    category: '',
    targetAudience: '',
    colorScheme: '',
    brandColors: {
      primary: '',
      secondary: '',
      accent: '',
    },
    selectedPackage: undefined,
    aiConfig: undefined,
  });
  const [savedLogo, setSavedLogo] = useState<string | null>(null);
  const [savedScreens, setSavedScreens] = useState<SavedScreen[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>(DEFAULT_PACKAGES);
  const [styleBoard, setStyleBoard] = useState<StyleBoardState>(createDefaultStyleBoard());
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    credits: '',
    features: '',
    badge: '',
    supportsAI: false,
  });
  const selectedPackageOption = packages.find((pkg) => pkg.id === appInfo.selectedPackage);
  const [screenGeneratorState, setScreenGeneratorState] = useState<{
    generatedScreens: Record<string, string[]>;
    selectedVariations: Record<string, string | null>;
  }>({
    generatedScreens: { splash: [], signin: [], signup: [] },
    selectedVariations: { splash: null, signin: null, signup: null },
  });

  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showResetAlert, setShowResetAlert] = useState(false);

  // Load state from localStorage on mount (client-side only)
  useEffect(() => {
    const initialState = getInitialState();
    setCurrentStep(initialState.currentStep);
    setAppInfo(initialState.appInfo);
    setSavedLogo(initialState.savedLogo);
    setSavedScreens(initialState.savedScreens);
    setStyleBoard(initialState.styleBoard);
    setPackages(initialState.packages);
    setScreenGeneratorState(initialState.screenGeneratorState);
    setIsLoaded(true);

    // Check for seed prompt from dashboard/landing page
    if (typeof window !== 'undefined') {
      const seedPrompt = localStorage.getItem('bolt_seed_prompt');

      if (seedPrompt && !initialState.appInfo.description) {
        console.log('[Wizard] Consuming seed prompt:', seedPrompt);
        setAppInfo((prev) => ({
          ...prev,
          description: seedPrompt,
        }));

        // Clear it so it doesn't persist across fresh starts
        localStorage.removeItem('bolt_seed_prompt');
      }
    }
  }, []);

  // Save to localStorage immediately when state changes
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const state: WizardState = {
      currentStep,
      appInfo,
      savedLogo,
      savedScreens,
      styleBoard,
      packages,
      screenGeneratorState,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      console.log('[Wizard] Auto-saved to localStorage');
      setSaveStatus('saved');
    } catch (error) {
      console.error('[Wizard] Failed to save state:', error);
      setSaveStatus('unsaved');
    }

    setLastActivity(Date.now());
  }, [isLoaded, currentStep, appInfo, savedLogo, savedScreens, styleBoard, packages, screenGeneratorState]);

  const steps = isDubsEnabled
    ? [
        { number: 1, title: 'Concept & Blueprints', icon: '📝' },
        { number: 2, title: 'Inspiration', icon: '🖼️' },
        { number: 3, title: 'Brand Aesthetics', icon: '🎨' },
        { number: 4, title: 'Architecture', icon: '📐' },
        { number: 5, title: 'Interactive Prototype', icon: '💻' },
        { number: 6, title: 'Features & Export', icon: '🚀' },
      ]
    : [
        { number: 1, title: 'App Info & Branding', icon: '📝' },
        { number: 2, title: 'Style & References', icon: '🖼️' },
        { number: 3, title: 'Logo Generation', icon: '🎨' },
        { number: 4, title: 'Key Screens', icon: '📱' },
        { number: 5, title: 'Additional Screens', icon: '📲' },
        { number: 6, title: 'Review & Generate', icon: '✨' },
      ];

  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showSavedItemsModal, setShowSavedItemsModal] = useState(false);
  const [styleKeywordInput, setStyleKeywordInput] = useState('');
  const [styleReferenceInput, setStyleReferenceInput] = useState('');
  const [isStyleUploading, setIsStyleUploading] = useState(false);
  const styleUploadInputRef = useRef<HTMLInputElement>(null);

  const handleRemoveSavedItem = (item: { type: 'logo' | 'screen'; id?: string }) => {
    if (item.type === 'logo') {
      setSavedLogo(null);
    } else if (item.id) {
      setSavedScreens((prev) => prev.filter((s) => s.id !== item.id));
      toast.success('Screen removed');
    }
  };

  const handleUpdateSavedItem = (type: 'logo' | 'screen', id: string, newUrl: string) => {
    if (type === 'logo') {
      setSavedLogo(newUrl);
    } else {
      setSavedScreens((prev) => prev.map((screen) => (screen.id === id ? { ...screen, url: newUrl } : screen)));
    }
  };

  const handleResetSession = () => {
    // Clear localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('[Wizard] Cleared session');
    } catch (error) {
      console.error('[Wizard] Failed to clear session:', error);
    }

    // Reset state
    setCurrentStep(1);
    setAppInfo({
      name: '',
      description: '',
      category: '',
      targetAudience: '',
      colorScheme: '',
      brandColors: {
        primary: '',
        secondary: '',
        accent: '',
      },
      selectedPackage: undefined,
      aiConfig: undefined,
    });
    setSavedLogo(null);
    setSavedScreens([]);
    setStyleBoard(createDefaultStyleBoard());
    setPackages(DEFAULT_PACKAGES);
    setScreenGeneratorState({
      generatedScreens: { splash: [], signin: [], signup: [] },
      selectedVariations: { splash: null, signin: null, signup: null },
    });
    setShowResetAlert(false); // Close the dialog
    toast.success('Session cleared! Starting fresh.');
  };

  const addKeyword = (keyword: string) => {
    if (!keyword.trim()) {
      return;
    }

    setStyleBoard((prev) => {
      if (prev.keywords.includes(keyword.trim())) {
        return prev;
      }

      return { ...prev, keywords: [...prev.keywords, keyword.trim()] };
    });
    setStyleKeywordInput('');
  };

  const removeKeyword = (keyword: string) => {
    setStyleBoard((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }));
  };

  const addReference = (url: string) => {
    if (!url.trim()) {
      return;
    }

    setStyleBoard((prev) => {
      if (prev.references.includes(url.trim())) {
        return prev;
      }

      return { ...prev, references: [...prev.references, url.trim()] };
    });
    setStyleReferenceInput('');
  };

  const removeReference = (url: string) => {
    setStyleBoard((prev) => ({
      ...prev,
      references: prev.references.filter((ref) => ref !== url),
    }));
  };

  const setTypography = (id: string) => {
    setStyleBoard((prev) => ({ ...prev, typography: id }));
  };

  const setUiStyle = (id: string) => {
    setStyleBoard((prev) => ({ ...prev, uiStyle: id }));
  };

  const togglePersonality = (tag: string) => {
    setStyleBoard((prev) => {
      const exists = prev.personality.includes(tag);
      return {
        ...prev,
        personality: exists ? prev.personality.filter((t) => t !== tag) : [...prev.personality, tag],
      };
    });
  };

  const setCornerStyle = (value: 'rounded' | 'sharp') => {
    setStyleBoard((prev) => ({
      ...prev,
      components: {
        ...prev.components,
        corners: value,
      },
    }));
  };

  const toggleGradient = () => {
    setStyleBoard((prev) => ({
      ...prev,
      components: {
        ...prev.components,
        gradient: !prev.components.gradient,
      },
    }));
  };

  const handleAddPackage = () => {
    if (!packageForm.name.trim() || !packageForm.description.trim() || !packageForm.credits.trim()) {
      toast.error('Please complete all package fields');
      return;
    }

    const newPackage: PackageOption = {
      id: `pkg-${Date.now()}`,
      name: packageForm.name.trim(),
      credits: Math.max(0, Number(packageForm.credits)),
      description: packageForm.description.trim(),
      features: packageForm.features
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      badge: packageForm.badge.trim() || undefined,
      supportsAI: packageForm.supportsAI,
    };
    setPackages((prev) => [...prev, newPackage]);
    setPackageForm({
      name: '',
      description: '',
      credits: '',
      features: '',
      badge: '',
      supportsAI: false,
    });
    toast.success('Package created!');
  };

  const handleStyleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    setIsStyleUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.url) {
        addReference(data.url);
        toast.success('Reference added');
      } else {
        toast.error('Failed to upload reference image');
      }
    } catch (error) {
      console.error('Reference upload failed', error);
      toast.error('Failed to upload reference image');
    } finally {
      setIsStyleUploading(false);
    }
  };

  const STYLE_KEYWORD_PRESETS = ['Modern Minimal', 'Playful', 'Premium', 'Editorial', 'Futuristic', 'Organic', 'Bold'];

  const generatePRDFromWizard = (): string => {
    const selectedPkg = packages.find((pkg) => pkg.id === appInfo.selectedPackage);

    return `# ${appInfo.name}

## Product Requirements Document

### Overview
**Category**: ${appInfo.category}
**Description**: ${appInfo.description}
**Target Audience**: ${appInfo.targetAudience}

### Design Requirements

#### Brand Colors
${appInfo.brandColors ? `Primary: ${appInfo.brandColors.primary}, Secondary: ${appInfo.brandColors.secondary}, Accent: ${appInfo.brandColors.accent}` : 'Not specified'}

#### Typography
${styleBoard.typography || 'Not specified'}

#### UI Style
${styleBoard.uiStyle || 'Not specified'}

#### Personality
${styleBoard.personality.join(', ') || 'Not specified'}

#### Component Style
- Corners: ${styleBoard.components.corners || 'rounded'}
- Gradients: ${styleBoard.components.gradient ? 'Yes' : 'No'}

#### Keywords
${styleBoard.keywords.join(', ') || 'Not specified'}

#### Additional Notes
${styleBoard.notes || 'None'}

### Assets Generated

${savedLogo ? `#### Logo\n![Logo](${savedLogo})\n` : ''}

#### Screens
${savedScreens.length > 0 ? `${savedScreens.length} screen(s) generated:\n${savedScreens.map((s) => `- ${s.name}`).join('\n')}` : 'No screens generated yet'}

### Package Selection
**Package**: ${selectedPkg?.name || 'Not selected'}
**Cost**: ${selectedPkg?.credits || 0} credits
${selectedPkg?.features ? `\n**Features**:\n${selectedPkg.features.map((f) => `- ${f}`).join('\n')}` : ''}

### AI Configuration
${
  appInfo.aiConfig?.enabled
    ? `
**Provider**: ${appInfo.aiConfig.provider}
**Model**: ${appInfo.aiConfig.model}
**Features**: ${Object.entries(appInfo.aiConfig.features)
        .filter(([_, enabled]) => enabled)
        .map(([feature]) => feature)
        .join(', ')}
${appInfo.aiConfig.context ? `**Custom Behavior**: ${appInfo.aiConfig.context}` : ''}
`
    : 'AI assistance not enabled'
}

### Technical Requirements

**Platform**: Expo React Native
**Mobile Only**: Yes (iOS and Android)
**Framework**: Expo with managed workflow

### Initial Prompt for Code Generation

Build a mobile app called "${appInfo.name}" using Expo React Native.

${appInfo.description}

**Design Requirements:**
- Use brand colors: ${appInfo.brandColors ? `Primary: ${appInfo.brandColors.primary}, Secondary: ${appInfo.brandColors.secondary}, Accent: ${appInfo.brandColors.accent}` : 'a professional color palette'}
- Typography should be ${styleBoard.typography || 'modern'}
- UI style should be ${styleBoard.uiStyle || 'clean and minimal'}
- Components should have ${styleBoard.components.corners || 'rounded'} corners
${styleBoard.components.gradient ? '- Use gradient accents where appropriate' : ''}
- The app should feel ${styleBoard.personality.join(', ') || 'professional and polished'}

**Key Screens to Implement:**
1. Splash screen with logo
2. Sign-in screen
3. Sign-up screen
4. Main dashboard/home screen
${styleBoard.notes ? `\n**Additional Design Direction:**\n${styleBoard.notes}` : ''}

Please generate a complete, working Expo React Native application that matches these requirements.
`;
  };

  const downloadPRD = (prd: string) => {
    const blob = new Blob([prd], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appInfo.name.replace(/\s+/g, '-').toLowerCase()}-prd.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('PRD downloaded successfully!');
  };

  const handleNext = async () => {
    if (currentStep === 6) {
      setIsFinalizing(true);

      try {
        console.log('[Wizard] Finalizing design with data:', {
          logoUrl: savedLogo,
          screensCount: savedScreens?.length || 0,
        });

        const response = await fetch('/api/finalize-design', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appInfo,
            styleBoard,
            selectedPackage: packages.find((pkg) => pkg.id === appInfo.selectedPackage),
            logoUrl: savedLogo,
            screens: savedScreens,
          }),
        });

        console.log('[Wizard] Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Wizard] Server error response:', errorText);
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const data: any = await response.json();
        console.log('[Wizard] Response data:', data);

        if (data.success) {
          setSavedLogo(data.logoUrl);
          setSavedScreens(data.screens);

          // Clear localStorage after successful save
          try {
            localStorage.removeItem(STORAGE_KEY);
            console.log('[Wizard] Cleared localStorage after successful save');
          } catch (error) {
            console.error('[Wizard] Failed to clear localStorage:', error);
          }

          toast.success('Design finalized and saved!');
        } else {
          console.error('[Wizard] Finalize failed:', data.error);
          toast.error(data.error || 'Failed to finalize design');
        }
      } catch (e) {
        console.error('[Wizard] Finalize error:', e);
        toast.error(e instanceof Error ? e.message : 'Failed to finalize design. Please try again.');
      } finally {
        setIsFinalizing(false);
      }
    } else if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  };

  const categories = [
    'Productivity',
    'Social Media',
    'E-commerce',
    'Education',
    'Health & Fitness',
    'Entertainment',
    'Finance',
    'Travel',
    'Food & Drink',
    'Utilities',
  ];

  const colorSchemes = [
    {
      name: 'Modern Blue SaaS',
      value: 'Modern Blue SaaS (Primary: #0A84FF, Secondary: #4DA3FF, Accent: #29F1C3)',
      colors: ['#0A84FF', '#4DA3FF', '#29F1C3'],
    },
    {
      name: 'Green Wellness',
      value: 'Green Wellness (Primary: #2ECC71, Secondary: #57D68D, Accent: #FFC857)',
      colors: ['#2ECC71', '#57D68D', '#FFC857'],
    },
    {
      name: 'Minimal Tech',
      value: 'Minimal Black & White Tech (Primary: #000000, Secondary: #2E2E2E, Accent: #00E5FF)',
      colors: ['#000000', '#2E2E2E', '#00E5FF'],
    },
    {
      name: 'Soft Pastel',
      value: 'Soft Pastel UI (Primary: #A8DADC, Secondary: #F7BFB4, Accent: #E63946)',
      colors: ['#A8DADC', '#F7BFB4', '#E63946'],
    },
    {
      name: 'Luxury Gold',
      value: 'Luxury Gold & Black Premium (Primary: #0D0D0D, Secondary: #3A3A3A, Accent: #D4AF37)',
      colors: ['#0D0D0D', '#3A3A3A', '#D4AF37'],
    },
    {
      name: 'Purple Digital',
      value: 'Purple Digital AI (Primary: #6C5CE7, Secondary: #A29BFE, Accent: #00E6C3)',
      colors: ['#6C5CE7', '#A29BFE', '#00E6C3'],
    },
    {
      name: 'Neon Cyberpunk',
      value: 'Neon Cyberpunk (Primary: #0D0221, Secondary: #3C096C, Accent: #FF00E0)',
      colors: ['#0D0221', '#3C096C', '#FF00E0'],
    },
    {
      name: 'Earthy Natural',
      value: 'Earthy Natural (Primary: #8D8741, Secondary: #ACD8AA, Accent: #FFCB77)',
      colors: ['#8D8741', '#ACD8AA', '#FFCB77'],
    },
  ];

  const TYPOGRAPHY_OPTIONS = [
    {
      id: 'modern-sans',
      title: 'Modern Sans',
      subtitle: 'Clean & minimal',
      sample: 'The quick brown fox jumps over the lazy dog',
    },
    {
      id: 'serif-elegant',
      title: 'Serif Elegant',
      subtitle: 'Premium editorial',
      sample: 'The quick brown fox jumps over the lazy dog',
    },
    {
      id: 'playful-rounded',
      title: 'Playful Rounded',
      subtitle: 'Friendly & casual',
      sample: 'The quick brown fox jumps over the lazy dog',
    },
    {
      id: 'mono-tech',
      title: 'Mono Tech',
      subtitle: 'Futuristic & structured',
      sample: 'The quick brown fox jumps over the lazy dog',
    },
  ];

  const UI_STYLE_OPTIONS = [
    { id: 'clean', name: 'Clean Minimal', description: 'Soft shadows, airy spacing' },
    { id: 'pro', name: 'Professional', description: 'Sharp cards, business ready' },
    { id: 'playful', name: 'Playful', description: 'Curvy elements, bold colors' },
    { id: 'edtech', name: 'EdTech', description: 'Illustrations, learning friendly' },
  ];

  const PERSONALITY_OPTIONS = ['Minimal', 'Playful', 'Bold', 'Formal', 'Organic', 'Futuristic'];

  // Show loading state while initializing from localStorage
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading wizard...</p>
        </div>
      </div>
    );
  }

  if (isDubsEnabled) {
    return (
      <div className="w-full h-screen bg-[#06080F] overflow-hidden text-white">
        <DesignPanel />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">App Design Wizard</h1>
              {/* Save Status Indicator */}
              <span className="text-xs flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700">
                {saveStatus === 'saved' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-slate-600 dark:text-slate-400">Saved</span>
                  </>
                )}
                {saveStatus === 'saving' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-slate-600 dark:text-slate-400">Saving...</span>
                  </>
                )}
                {saveStatus === 'unsaved' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <span className="text-slate-600 dark:text-slate-400">Unsaved</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Create your complete app design in 6 simple steps
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Show Saved Items button after logo generation (step 2+) */}
            {currentStep >= 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSavedItemsModal(true)}
                className="flex items-center gap-2"
              >
                <span>💾</span>
                <span>Saved Items</span>
                {(savedLogo || savedScreens.length > 0) && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                    {(savedLogo ? 1 : 0) + savedScreens.length}
                  </span>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetAlert(true)}
              className="text-slate-600 hover:text-red-600"
            >
              🔄 Clear Session
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                // Get current user ID (mock for now if not auth)
                const userId = 'test-user'; // Replace with actual user ID fetching
                await fetch('/api/test/topup', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId, amount: 100 }),
                });
                alert('Added 100 credits! 💰');
              }}
            >
              💰 Top Up Credits
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                      currentStep >= step.number
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <p
                    className={`text-xs mt-2 text-center ${
                      currentStep >= step.number ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded transition-all ${
                      currentStep > step.number ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          {/* Step 1: App Info & Branding */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Tell us about your app</h2>
                <p className="text-slate-600 dark:text-slate-400">
                  This information will help us generate a cohesive design for your application
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">App Name *</label>
                <input
                  type="text"
                  value={appInfo.name}
                  onChange={(e) => setAppInfo({ ...appInfo, name: e.target.value })}
                  placeholder="e.g., TaskMaster, FitTrack, ShopEasy"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">App Description *</label>
                <textarea
                  value={appInfo.description}
                  onChange={(e) => setAppInfo({ ...appInfo, description: e.target.value })}
                  placeholder="Describe what your app does and its main features..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  value={appInfo.category}
                  onChange={(e) => setAppInfo({ ...appInfo, category: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target Audience *</label>
                <input
                  type="text"
                  value={appInfo.targetAudience}
                  onChange={(e) => setAppInfo({ ...appInfo, targetAudience: e.target.value })}
                  placeholder="e.g., Young professionals, Students, Fitness enthusiasts"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Package Creator */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Create Package *</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Define your custom package details</p>
                </div>

                <div className="space-y-4 p-6 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <label className="block text-sm font-medium mb-2">Package Name *</label>
                    <input
                      type="text"
                      value={packageForm.name}
                      onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                      placeholder="e.g., Basic, Premium, Custom"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Package Description *</label>
                    <textarea
                      value={packageForm.description}
                      onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                      placeholder="Describe what this package includes..."
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Credits Cost *</label>
                    <input
                      type="number"
                      value={packageForm.credits}
                      onChange={(e) => setPackageForm({ ...packageForm, credits: e.target.value })}
                      placeholder="e.g., 100"
                      min="0"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Features (one per line)</label>
                    <textarea
                      value={packageForm.features}
                      onChange={(e) => setPackageForm({ ...packageForm, features: e.target.value })}
                      placeholder="Screen mockups&#10;Logo assets&#10;Color palette"
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="supports-ai"
                      checked={packageForm.supportsAI}
                      onChange={(e) => setPackageForm({ ...packageForm, supportsAI: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600"
                    />
                    <label htmlFor="supports-ai" className="text-sm font-medium cursor-pointer">
                      Supports AI Intelligence add-ons
                    </label>
                  </div>

                  <Button type="button" className="w-full" onClick={handleAddPackage}>
                    Add Package
                  </Button>
                </div>

                {packages.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center text-slate-500">
                    No packages yet. Use the form above to add your first package.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    {packages.map((pkg) => {
                      const isSelected = appInfo.selectedPackage === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() =>
                            setAppInfo({
                              ...appInfo,
                              selectedPackage: pkg.id,
                              aiConfig: pkg.supportsAI ? appInfo.aiConfig : undefined,
                            })
                          }
                          className={`relative p-6 border-2 rounded-xl text-left transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {pkg.badge && (
                            <span className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                              {pkg.badge}
                            </span>
                          )}
                          {pkg.id.startsWith('pkg-') && (
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                setPackages((prev) => prev.filter((p) => p.id !== pkg.id));

                                if (appInfo.selectedPackage === pkg.id) {
                                  setAppInfo({ ...appInfo, selectedPackage: undefined });
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setPackages((prev) => prev.filter((p) => p.id !== pkg.id));

                                  if (appInfo.selectedPackage === pkg.id) {
                                    setAppInfo({ ...appInfo, selectedPackage: undefined });
                                  }
                                }
                              }}
                              className="absolute top-2 left-2 text-slate-400 hover:text-red-500 cursor-pointer"
                            >
                              ×
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-3 mt-2">
                            <h4 className="font-bold text-lg">📦 {pkg.name}</h4>
                            <span className="text-sm font-semibold">
                              {pkg.credits === 0 ? (
                                <span className="text-green-600">FREE</span>
                              ) : (
                                `${pkg.credits} credits`
                              )}
                            </span>
                          </div>
                          {pkg.description && <p className="text-xs text-slate-500 mb-3">{pkg.description}</p>}
                          <ul className="text-sm space-y-2 mb-4">
                            {pkg.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-green-500">✓</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="text-xs text-slate-500">
                            {pkg.supportsAI
                              ? 'Supports optional AI intelligence add-ons'
                              : 'Design & code deliverables'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* AI Intelligence Configuration (only for Premium) */}
                {selectedPackageOption?.supportsAI && (
                  <div className="mt-6 p-6 border-2 border-purple-200 dark:border-purple-800 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 space-y-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="ai-enabled"
                        checked={appInfo.aiConfig?.enabled || false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAppInfo({
                              ...appInfo,
                              aiConfig: {
                                enabled: true,
                                provider: 'anthropic',
                                model: 'claude-opus-4.5',
                                features: {
                                  chatbot: true,
                                  contentGeneration: false,
                                  recommendations: false,
                                  search: false,
                                  analysis: false,
                                  translation: false,
                                  imageGeneration: false,
                                  voiceAssistant: false,
                                },
                                streaming: true,
                              },
                            });
                          } else {
                            setAppInfo({ ...appInfo, aiConfig: undefined });
                          }
                        }}
                        className="mt-1 w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <label htmlFor="ai-enabled" className="font-semibold text-lg cursor-pointer">
                          🤖 Add AI Intelligence
                        </label>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Enable smart AI features like chatbot, content generation, and more (+50 credits)
                        </p>
                      </div>
                    </div>

                    {appInfo.aiConfig?.enabled && (
                      <div className="pl-8 space-y-4 pt-4 border-t border-purple-200 dark:border-purple-700">
                        {/* AI Provider Selection */}
                        <div>
                          <label className="block text-sm font-medium mb-2">AI Provider *</label>
                          <select
                            value={appInfo.aiConfig.provider}
                            onChange={(e) =>
                              setAppInfo({
                                ...appInfo,
                                aiConfig: {
                                  ...appInfo.aiConfig!,
                                  provider: e.target.value as any,
                                  model:
                                    e.target.value === 'anthropic'
                                      ? 'claude-opus-4.5'
                                      : e.target.value === 'openai'
                                        ? 'gpt-5.1'
                                        : 'gemini-pro-3',
                                },
                              })
                            }
                            className="w-full px-4 py-3 border border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="anthropic">Anthropic (Claude) - Best for complex reasoning</option>
                            <option value="openai">OpenAI (GPT) - Great all-around performance</option>
                            <option value="google">Google (Gemini) - Fast & multimodal</option>
                          </select>
                        </div>

                        {/* Model Selection */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Model *</label>
                          <select
                            value={appInfo.aiConfig.model}
                            onChange={(e) =>
                              setAppInfo({
                                ...appInfo,
                                aiConfig: { ...appInfo.aiConfig!, model: e.target.value },
                              })
                            }
                            className="w-full px-4 py-3 border border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500"
                          >
                            {appInfo.aiConfig.provider === 'anthropic' && (
                              <>
                                <option value="claude-sonnet-4.5">Claude Sonnet 4.5 (Recommended)</option>
                                <option value="claude-opus-4.5">Claude Opus 4.5</option>
                              </>
                            )}
                            {appInfo.aiConfig.provider === 'openai' && (
                              <>
                                <option value="gpt-5.1">GPT-5.1 (Recommended)</option>
                              </>
                            )}
                            {appInfo.aiConfig.provider === 'google' && (
                              <>
                                <option value="gemini-flash-2.5">Gemini Flash 2.5 (Recommended)</option>
                                <option value="gemini-pro-3">Gemini Pro 3</option>
                              </>
                            )}
                          </select>
                        </div>

                        {/* AI Features */}
                        <div>
                          <label className="block text-sm font-medium mb-3">AI Features</label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { key: 'chatbot', label: 'Chatbot', desc: 'In-app AI assistant' },
                              { key: 'contentGeneration', label: 'Content Generation', desc: 'AI-powered content' },
                              { key: 'recommendations', label: 'Recommendations', desc: 'Personalized suggestions' },
                              { key: 'search', label: 'Search', desc: 'AI-enhanced search' },
                              { key: 'analysis', label: 'Analysis', desc: 'Data analysis' },
                              { key: 'translation', label: 'Translation', desc: 'Multi-language' },
                              { key: 'imageGeneration', label: 'Image Generation', desc: 'AI images' },
                              { key: 'voiceAssistant', label: 'Voice Assistant', desc: 'Voice interactions' },
                            ].map((feature) => (
                              <label
                                key={feature.key}
                                className="flex items-start gap-2 p-3 border border-purple-200 dark:border-purple-700 rounded-lg cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20"
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    appInfo.aiConfig!.features[feature.key as keyof typeof appInfo.aiConfig.features]
                                  }
                                  onChange={(e) =>
                                    setAppInfo({
                                      ...appInfo,
                                      aiConfig: {
                                        ...appInfo.aiConfig!,
                                        features: {
                                          ...appInfo.aiConfig!.features,
                                          [feature.key]: e.target.checked,
                                        },
                                      },
                                    })
                                  }
                                  className="mt-0.5 w-4 h-4 rounded border-purple-300 text-purple-600"
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{feature.label}</div>
                                  <div className="text-xs text-slate-500">{feature.desc}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Custom Context */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Custom AI Behavior (Optional)</label>
                          <textarea
                            value={appInfo.aiConfig.context || ''}
                            onChange={(e) =>
                              setAppInfo({
                                ...appInfo,
                                aiConfig: { ...appInfo.aiConfig!, context: e.target.value },
                              })
                            }
                            placeholder="e.g., You are a helpful fitness coach assistant in the FitTrack app..."
                            rows={3}
                            className="w-full px-4 py-3 border border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 text-sm"
                          />
                        </div>

                        {/* Streaming Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={appInfo.aiConfig.streaming}
                            onChange={(e) =>
                              setAppInfo({
                                ...appInfo,
                                aiConfig: { ...appInfo.aiConfig!, streaming: e.target.checked },
                              })
                            }
                            className="w-4 h-4 rounded border-purple-300 text-purple-600"
                          />
                          <span className="text-sm">Enable streaming responses (show AI responses in real-time)</span>
                        </label>

                        {/* API Key Warning */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                              <p className="font-medium mb-1">API Key Required</p>
                              <p className="text-xs">
                                You'll need to sign up with{' '}
                                {appInfo.aiConfig.provider === 'anthropic'
                                  ? 'Anthropic'
                                  : appInfo.aiConfig.provider === 'openai'
                                    ? 'OpenAI'
                                    : 'Google'}{' '}
                                and add your API key to the generated app. The generated code will include setup
                                instructions. API costs are separate from AppForge credits.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Logo Generation */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Generate Your Logo</h2>
                <p className="text-slate-600 dark:text-slate-400">
                  We'll create a professional logo based on your app information
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="font-semibold mb-2">App Info Summary</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Name:</span> {appInfo.name}
                  </p>
                  <p>
                    <span className="font-medium">Category:</span> {appInfo.category}
                  </p>
                  <p>
                    <span className="font-medium">Target Audience:</span> {appInfo.targetAudience}
                  </p>
                  <p>
                    <span className="font-medium">Color Scheme:</span> {appInfo.colorScheme}
                  </p>
                </div>
              </div>

              {savedLogo && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                    ✓ Logo saved! You can proceed to the next step.
                  </p>
                </div>
              )}

              <LogoGenerator
                appInfo={appInfo}
                stylePreferences={styleBoard}
                onSave={async (logoUrl, prompt) => {
                  setSavedLogo(logoUrl);

                  try {
                    await fetch('/api/logos', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        image_url: logoUrl,
                        app_name: appInfo.name,
                        prompt,
                      }),
                    });
                    toast.success('Logo saved successfully!');
                  } catch (e) {
                    console.error('Failed to save logo', e);
                    toast.error('Failed to save logo');
                  }
                }}
              />
            </div>
          )}

          {/* Step 2: Style & References */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Style &amp; References</h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Build a quick mood board so the rest of your design decisions feel cohesive. Drop in imagery, describe
                  the tone, and capture keywords that we can reuse when generating your screens.
                </p>
              </div>

              <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Brand Color Palette *</h3>
                    <p className="text-sm text-slate-500">
                      Lock in colors here so your upcoming logo inherits the right palette.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {colorSchemes.map((scheme) => (
                    <button
                      key={scheme.name}
                      onClick={() =>
                        setAppInfo({
                          ...appInfo,
                          colorScheme: scheme.value,
                          brandColors: {
                            primary: scheme.colors[0],
                            secondary: scheme.colors[1],
                            accent: scheme.colors[2],
                          },
                        })
                      }
                      className={`p-4 border-2 rounded-lg transition-all ${
                        appInfo.colorScheme === scheme.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex gap-2 mb-2">
                        {scheme.colors.map((color, i) => (
                          <div key={i} className="w-8 h-8 rounded" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                      <p className="text-sm font-medium">{scheme.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-1">Typography</h3>
                      <p className="text-sm text-slate-500">Pick a font personality that matches your product tone.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {TYPOGRAPHY_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setTypography(option.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          styleBoard.typography === option.id
                            ? 'border-blue-500 shadow-lg bg-blue-50/50'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <p className="font-semibold">{option.title}</p>
                        <p className="text-xs text-slate-500 mb-2">{option.subtitle}</p>
                        <p
                          className="text-sm italic text-slate-600"
                          style={{
                            fontFamily:
                              option.id === 'serif-elegant'
                                ? 'Georgia, serif'
                                : option.id === 'playful-rounded'
                                  ? '"Nunito", "Comic Sans MS", sans-serif'
                                  : option.id === 'mono-tech'
                                    ? '"JetBrains Mono", "Courier New", monospace'
                                    : '"Inter", "Helvetica Neue", sans-serif',
                          }}
                        >
                          {option.sample}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-inner">
                  <h4 className="font-semibold mb-2">Preview</h4>
                  <div
                    className="rounded-xl p-4 text-white"
                    style={{
                      borderRadius: styleBoard.components.corners === 'rounded' ? '1rem' : '0.5rem',
                      background: styleBoard.components.gradient
                        ? `linear-gradient(135deg, ${colorSchemes.find((c) => c.value === appInfo.colorScheme)?.colors?.[0] || '#0A84FF'}, ${colorSchemes.find((c) => c.value === appInfo.colorScheme)?.colors?.[2] || '#29F1C3'})`
                        : colorSchemes.find((c) => c.value === appInfo.colorScheme)?.colors?.[0] || '#0A84FF',
                    }}
                  >
                    <p className="text-sm opacity-80 mb-1">Example</p>
                    <p
                      className="text-lg font-bold"
                      style={{
                        fontFamily:
                          styleBoard.typography === 'serif-elegant'
                            ? 'Georgia, serif'
                            : styleBoard.typography === 'playful-rounded'
                              ? '"Nunito", "Comic Sans MS", sans-serif'
                              : styleBoard.typography === 'mono-tech'
                                ? '"JetBrains Mono", "Courier New", monospace'
                                : '"Inter", "Helvetica Neue", sans-serif',
                      }}
                    >
                      {styleBoard.uiStyle === 'playful'
                        ? 'Playful & Friendly'
                        : styleBoard.uiStyle === 'pro'
                          ? 'Professional System'
                          : styleBoard.uiStyle === 'edtech'
                            ? 'Learning Hub'
                            : 'Modern Dashboard'}
                    </p>
                    <p className="text-xs opacity-80">
                      {styleBoard.personality.length > 0
                        ? styleBoard.personality.join(' · ')
                        : 'Choose personality tags'}
                    </p>
                  </div>
                  <div className="mt-4 space-y-2">
                    <h5 className="text-xs uppercase tracking-wide text-slate-500">UI Style</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {UI_STYLE_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setUiStyle(option.id)}
                          className={`p-3 rounded-lg border text-left text-sm ${
                            styleBoard.uiStyle === option.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          <p className="font-semibold">{option.name}</p>
                          <p className="text-xs text-slate-500">{option.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h3 className="font-semibold">Personality Tags</h3>
                <p className="text-sm text-slate-500">Select a few words that describe your app’s vibe.</p>
                <div className="flex flex-wrap gap-2">
                  {PERSONALITY_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => togglePersonality(tag)}
                      className={`px-3 py-1 text-xs rounded-full border transition-all ${
                        styleBoard.personality.includes(tag)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h3 className="font-semibold">Component Accents</h3>
                <p className="text-sm text-slate-500">Choose how cards and CTAs should feel.</p>
                <div className="flex flex-wrap gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Corners</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={styleBoard.components.corners === 'rounded' ? 'primary' : 'outline'}
                        onClick={() => setCornerStyle('rounded')}
                      >
                        Rounded
                      </Button>
                      <Button
                        type="button"
                        variant={styleBoard.components.corners === 'sharp' ? 'primary' : 'outline'}
                        onClick={() => setCornerStyle('sharp')}
                      >
                        Sharp
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Fill</p>
                    <Button
                      type="button"
                      variant={styleBoard.components.gradient ? 'primary' : 'outline'}
                      onClick={toggleGradient}
                    >
                      {styleBoard.components.gradient ? 'Gradient On' : 'Gradient Off'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                  <h3 className="font-semibold mb-2">What to collect</h3>
                  <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li>Example layouts or UI patterns that match your vibe</li>
                    <li>Typography, iconography, or illustration inspiration</li>
                    <li>Photography, colors, or textures that set the mood</li>
                  </ul>
                </div>
                <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                  <h3 className="font-semibold mb-2">How to use them</h3>
                  <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li>Paste screenshots (⌘/Ctrl + V) anywhere to auto-upload into clip trays</li>
                    <li>Upload assets here or keep them in Saved Items for reuse later</li>
                    <li>Reference these keywords/notes when writing prompts or briefs</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Keywords &amp; Tone</h3>
                    <p className="text-sm text-slate-500">Pick a few adjectives that describe the look &amp; feel.</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {styleBoard.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700"
                      >
                        {keyword}
                        <button onClick={() => removeKeyword(keyword)} className="text-blue-500 hover:text-blue-700">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STYLE_KEYWORD_PRESETS.map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => addKeyword(keyword)}
                      className="px-3 py-1 text-xs border rounded-full hover:bg-blue-50 border-slate-200 dark:border-slate-600"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="text"
                    value={styleKeywordInput}
                    onChange={(e) => setStyleKeywordInput(e.target.value)}
                    placeholder="Add custom keyword"
                    className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <Button variant="outline" onClick={() => addKeyword(styleKeywordInput)}>
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Reference Images</h3>
                    <p className="text-sm text-slate-500">
                      Drop quick inspiration shots. These get reused in clip trays during editing.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      ref={styleUploadInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        handleStyleFileUpload(e.target.files);
                        e.target.value = '';
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => styleUploadInputRef.current?.click()}
                      disabled={isStyleUploading}
                    >
                      {isStyleUploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowSavedItemsModal(true)}>
                      📁 Saved Items
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={styleReferenceInput}
                    onChange={(e) => setStyleReferenceInput(e.target.value)}
                    placeholder="Paste image URL"
                    className="flex-1 px-3 py-2 border rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <Button variant="outline" onClick={() => addReference(styleReferenceInput)}>
                    Add URL
                  </Button>
                </div>
                {styleBoard.references.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center text-sm text-slate-500">
                    No references yet. Upload or paste an image link to start your mood board.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {styleBoard.references.map((url) => (
                      <div key={url} className="relative group">
                        <img
                          src={url}
                          alt="Style Ref"
                          className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                        />
                        <button
                          onClick={() => removeReference(url)}
                          className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Notes for your AI designer (optional)</h3>
                    <p className="text-sm text-slate-500">
                      Describe the story, emotions, or prompts that explain your desired look.
                    </p>
                  </div>
                </div>
                <textarea
                  value={styleBoard.notes}
                  onChange={(e) =>
                    setStyleBoard((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="w-full min-h-[150px] px-3 py-2 border rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  placeholder="e.g., Clean fintech dashboard with airy white space, trust-building photography, and crisp mono-line icons..."
                />
              </div>
            </div>
          )}

          {/* Step 4: Key Screens */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Generate Key Screens</h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Create essential screens for your app using your brand colors and logo
                </p>
              </div>

              {savedScreens.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                    ✓ {savedScreens.length} screen(s) saved! You can proceed to the next step.
                  </p>
                </div>
              )}

              <ScreenGenerator
                appInfo={appInfo}
                savedLogo={savedLogo}
                stylePreferences={styleBoard}
                onSave={(screens) => {
                  setSavedScreens(
                    screens.map((s) => ({
                      ...s,
                      id: crypto.randomUUID(),
                      stage: currentStep,
                    })),
                  );
                }}
                initialState={screenGeneratorState}
                onStateChange={setScreenGeneratorState}
              />
            </div>
          )}

          {/* Step 5: Additional Screens */}
          {currentStep === 5 && (
            <CustomScreenGenerator
              appInfo={appInfo}
              savedLogo={savedLogo}
              stylePreferences={styleBoard}
              onAddToCart={(screens) => {
                setSavedScreens((prev) => [...prev, ...screens]);
              }}
              cartItems={savedScreens}
            />
          )}

          {/* Step 6: Review & Generate */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Review & Generate</h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Review your selections and finalize your design package.
                </p>
              </div>

              {/* App Information */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold">App Information</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 mb-1">App Name</p>
                    <p className="font-medium">{appInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Category</p>
                    <p className="font-medium">{appInfo.category}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-slate-500 mb-1">Description</p>
                    <p className="font-medium">{appInfo.description}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-slate-500 mb-1">Target Audience</p>
                    <p className="font-medium">{appInfo.targetAudience}</p>
                  </div>
                </div>
              </div>

              {/* Selected Package */}
              {selectedPackageOption && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Selected Package</h3>
                  <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold">📦 {selectedPackageOption.name}</h4>
                      <span className="text-sm font-semibold">
                        {selectedPackageOption.credits === 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          `${selectedPackageOption.credits} credits`
                        )}
                      </span>
                    </div>
                    {selectedPackageOption.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {selectedPackageOption.description}
                      </p>
                    )}
                    <ul className="text-sm space-y-1">
                      {selectedPackageOption.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-500">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* AI Configuration */}
              {appInfo.aiConfig?.enabled && (
                <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold">🤖 AI Intelligence Configuration</h3>
                  <div className="space-y-3 text-sm">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-500 mb-1">Provider</p>
                        <p className="font-medium capitalize">{appInfo.aiConfig.provider}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Model</p>
                        <p className="font-medium">{appInfo.aiConfig.model}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-2">Enabled Features</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(appInfo.aiConfig.features)
                          .filter(([_, enabled]) => enabled)
                          .map(([feature]) => (
                            <span
                              key={feature}
                              className="px-3 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                            >
                              {feature.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          ))}
                      </div>
                    </div>
                    {appInfo.aiConfig.context && (
                      <div>
                        <p className="text-slate-500 mb-1">Custom Behavior</p>
                        <p className="font-medium text-sm">{appInfo.aiConfig.context}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${appInfo.aiConfig.streaming ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}
                      >
                        {appInfo.aiConfig.streaming ? 'Streaming Enabled' : 'Streaming Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Style Preferences */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold">Style Preferences</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 mb-1">Color Scheme</p>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: appInfo.brandColors.primary }} />
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: appInfo.brandColors.secondary }} />
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: appInfo.brandColors.accent }} />
                      </div>
                      <span className="font-medium text-xs">{appInfo.colorScheme.split('(')[0].trim()}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Typography</p>
                    <p className="font-medium capitalize">{styleBoard.typography.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">UI Style</p>
                    <p className="font-medium capitalize">{styleBoard.uiStyle}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Component Style</p>
                    <p className="font-medium">
                      {styleBoard.components.corners === 'rounded' ? 'Rounded' : 'Sharp'} corners
                      {styleBoard.components.gradient ? ', Gradient fills' : ', Solid fills'}
                    </p>
                  </div>
                  {styleBoard.personality.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-slate-500 mb-2">Personality</p>
                      <div className="flex flex-wrap gap-2">
                        {styleBoard.personality.map((tag) => (
                          <span key={tag} className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {styleBoard.keywords.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-slate-500 mb-2">Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {styleBoard.keywords.map((keyword) => (
                          <span key={keyword} className="px-3 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Generated Assets */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold">Generated Assets</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {savedLogo && (
                    <div>
                      <p className="text-slate-500 mb-2 text-sm">Logo</p>
                      <img
                        src={savedLogo}
                        alt="App Logo"
                        className="w-32 h-32 object-contain border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-slate-500 mb-2 text-sm">Screens</p>
                    <p className="font-medium">
                      {savedScreens.length} screen{savedScreens.length !== 1 ? 's' : ''} generated
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {savedScreens.slice(0, 3).map((screen) => (
                        <img
                          key={screen.id}
                          src={screen.url}
                          alt={screen.name}
                          className="w-16 h-28 object-cover border border-slate-200 dark:border-slate-700 rounded"
                        />
                      ))}
                      {savedScreens.length > 3 && (
                        <div className="w-16 h-28 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-xs text-slate-600">
                          +{savedScreens.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Ready to finalize? You can save your design package, download the PRD, or start building your app with
                  AI.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button onClick={handleBack} disabled={currentStep === 1} variant="outline">
              ← Back
            </Button>
            {currentStep === 6 ? (
              <div className="flex gap-3">
                <Button onClick={handleNext} disabled={isFinalizing} variant="outline" className="gap-2">
                  {isFinalizing ? 'Saving...' : 'Finalize & Save Design ✨'}
                </Button>
                <Button
                  onClick={() => {
                    // TODO: Generate and download PRD
                    const prd = generatePRDFromWizard();
                    downloadPRD(prd);
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  📄 Download PRD
                </Button>
                <Button
                  onClick={() => {
                    // Save first, then redirect to /appbuild
                    if (!sessionId) {
                      // Create session first
                      handleNext().then(() => {
                        /*
                         * TODO: Get session ID from response
                         * router.push(`/appbuild?sessionId=${newSessionId}`);
                         */
                      });
                    } else {
                      navigate(`/appbuild?sessionId=${sessionId}`);
                    }
                  }}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  🚀 Start Building
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 &&
                    (!appInfo.name ||
                      !appInfo.description ||
                      !appInfo.category ||
                      !appInfo.targetAudience ||
                      !appInfo.selectedPackage)) ||
                  (currentStep === 2 && !appInfo.colorScheme) ||
                  (currentStep === 3 && !savedLogo) ||
                  (currentStep === 4 && savedScreens.length === 0)
                }
              >
                Next →
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Saved Items Modal */}
      <SavedItemsModal
        isOpen={showSavedItemsModal}
        onClose={() => setShowSavedItemsModal(false)}
        savedLogo={savedLogo}
        savedScreens={savedScreens}
        onRemoveItem={handleRemoveSavedItem}
        onUpdateItem={handleUpdateSavedItem}
      />

      {/* Reset Session Alert Dialog */}
      <AlertDialog
        isOpen={showResetAlert}
        onClose={() => setShowResetAlert(false)}
        onConfirm={handleResetSession}
        title="Start Over?"
        message="Are you sure you want to clear all your progress? This will reset the wizard and delete all your work including logos, screens, and configurations. This action cannot be undone."
        confirmText="Yes, Clear Everything"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
