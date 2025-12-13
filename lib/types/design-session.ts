// Design Session Types for Database Integration
// These types map to the Supabase design_sessions schema

export type SessionStatus = 'draft' | 'completed' | 'generating';
export type WizardStage = 1 | 2 | 3 | 4 | 5 | 6;
export type PackageType = 'basic' | 'complete' | 'premium';

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface StylePreferences {
  typography?: string;           // 'modern-sans', 'serif-elegant', etc.
  uiStyle?: string;              // 'clean', 'pro', 'playful', 'edtech'
  personality?: string[];        // ['professional', 'friendly']
  components?: {
    corners: 'rounded' | 'sharp';
    gradient: boolean;
  };
  keywords?: string[];
  notes?: string;
}

export interface PackageDetails {
  name: string;
  price: number;
  features: string[];
  includesBackend: boolean;
  includesAuth: boolean;
  includesTests: boolean;
  includesDeployment: boolean;
}

export interface AIIntelligenceConfig {
  enabled: boolean;
  provider: 'anthropic' | 'openai' | 'google' | 'custom' | 'none';
  model: string;              // e.g., "claude-3-5-sonnet-20241022", "gpt-4o", "gemini-2.0-flash-exp"
  apiEndpoint?: string;       // Custom API endpoint if needed
  features: {
    chatbot: boolean;         // In-app AI chatbot
    contentGeneration: boolean; // AI-generated content
    recommendations: boolean; // AI-powered recommendations
    search: boolean;          // AI-enhanced search
    analysis: boolean;        // Data analysis with AI
    translation: boolean;     // AI translation
    imageGeneration: boolean; // AI image generation
    voiceAssistant: boolean;  // Voice-based AI assistant
  };
  context?: string;           // Custom system prompt/instructions for the AI
  streaming: boolean;         // Enable streaming responses
}

// Main Design Session interface (matches design_sessions table)
export interface DesignSession {
  id: string;
  user_id: string;

  // Session metadata
  session_name: string;
  status: SessionStatus;
  current_stage: WizardStage;

  // App Info (Stage 1)
  app_name?: string;
  app_description?: string;
  app_category?: string;
  target_audience?: string;
  brand_colors?: BrandColors;

  // Style & References (Stage 2)
  style_preferences?: StylePreferences;
  reference_images?: string[];

  // Package Selection
  selected_package?: PackageType;
  package_cost?: number;

  // AI Intelligence Configuration (Optional for Premium)
  ai_config?: AIIntelligenceConfig;

  // Logo (Stage 3)
  logo_url?: string;
  logo_prompt?: string;

  // Tracking
  credits_used: number;
  total_screens_generated: number;

  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at?: string;

  // Full PRD (when code generation is triggered)
  prd_data?: AppDesignPRD;
  generation_settings?: CodeGenerationSettings;

  // Generated code
  generated_code_url?: string;
  generated_at?: string;
}

// Design Session Screen interface (matches design_session_screens table)
export interface DesignSessionScreen {
  id: string;
  session_id: string;

  // Screen details
  screen_type: string;           // 'splash', 'signin', 'signup', 'home', 'custom'
  screen_name: string;
  screen_url: string;            // Supabase Storage URL

  // Generation details
  prompt_used?: string;
  provider?: string;             // 'gemini', 'openai'
  model?: string;                // 'nano-banana', 'dall-e-3', etc.
  credits_cost?: number;

  // Stage context
  wizard_stage: WizardStage;
  is_selected: boolean;

  // Timestamp
  created_at: string;

  // Reference images
  reference_images?: string[];
}

// Design Session History interface (matches design_session_history table)
export interface DesignSessionHistory {
  id: string;
  session_id: string;
  action: string;               // 'stage_completed', 'screen_generated', 'screen_edited', 'prd_generated'
  stage?: number;
  details?: Record<string, any>;
  created_at: string;
}

// Full PRD structure for code generation
export interface AppDesignPRD {
  version: string;
  generatedAt: string;

  metadata: AppMetadata;
  brandSystem: BrandSystem;
  stylePreferences: StylePreferences;
  screens: ScreenCollection;
  navigation: NavigationStructure;
  components: ComponentLibrary;
  features: FeatureRequirements;

  designRationale?: string;
  technicalNotes?: string[];
  dependencies?: string[];
}

export interface AppMetadata {
  projectName: string;
  description: string;
  category: string;
  targetAudience: string;
  platform: 'ios' | 'android' | 'both';
  expoSdkVersion: string;

  selectedPackage: PackageType;
  packageDetails: PackageDetails;
}

export interface BrandSystem {
  logo: {
    url: string;
    format: 'png' | 'svg';
    dimensions: { width: number; height: number };
  };

  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    error: string;
    success: string;
    warning: string;
  };

  typography: {
    fontFamily: string;
    scale: {
      h1: { size: number; weight: string; lineHeight: number };
      h2: { size: number; weight: string; lineHeight: number };
      h3: { size: number; weight: string; lineHeight: number };
      body: { size: number; weight: string; lineHeight: number };
      caption: { size: number; weight: string; lineHeight: number };
    };
  };

  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };

  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export interface ScreenAsset {
  id: string;
  name: string;
  type: string;
  url: string;

  analysis?: {
    layout: 'list' | 'grid' | 'tabs' | 'stack' | 'carousel';
    components: string[];
    interactions: string[];
    dataRequirements: string[];
  };

  isInitialRoute: boolean;
  canNavigateTo: string[];
}

export interface ScreenCollection {
  screens: ScreenAsset[];
  totalCount: number;
  essentialScreens: ScreenAsset[];
  customScreens: ScreenAsset[];
}

export interface NavigationStructure {
  type: 'stack' | 'tab' | 'drawer' | 'hybrid';
  stacks: {
    name: string;
    screens: string[];
    initialRoute: string;
  }[];
  tabs?: {
    screens: string[];
    icons: Record<string, string>;
  };
  drawer?: {
    screens: string[];
    position: 'left' | 'right';
  };
}

export interface ComponentLibrary {
  buttons: {
    primary: ButtonSpec;
    secondary: ButtonSpec;
    text: ButtonSpec;
  };
  inputs: {
    text: InputSpec;
    password: InputSpec;
    search: InputSpec;
  };
  cards: CardSpec[];
  navigation: {
    header: HeaderSpec;
    bottomTab: TabBarSpec;
  };
}

export interface ButtonSpec {
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  paddingVertical: number;
  paddingHorizontal: number;
  fontSize: number;
  fontWeight: string;
}

export interface InputSpec {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  placeholderColor: string;
  borderRadius: number;
  paddingVertical: number;
  paddingHorizontal: number;
  fontSize: number;
}

export interface CardSpec {
  name: string;
  backgroundColor: string;
  borderRadius: number;
  padding: number;
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface HeaderSpec {
  backgroundColor: string;
  height: number;
  titleColor: string;
  titleSize: number;
  titleWeight: string;
}

export interface TabBarSpec {
  backgroundColor: string;
  activeColor: string;
  inactiveColor: string;
  height: number;
}

export interface FeatureRequirements {
  authentication: {
    enabled: boolean;
    methods: ('email' | 'social' | 'phone')[];
    providers?: ('google' | 'apple' | 'facebook')[];
  };

  dataManagement: {
    stateManagement: 'context' | 'redux' | 'zustand' | 'none';
    backend: 'firebase' | 'supabase' | 'convex' | 'none';
    localStorage: boolean;
  };

  // AI/LLM Intelligence Configuration
  aiIntelligence?: {
    enabled: boolean;
    provider: 'anthropic' | 'openai' | 'google' | 'custom' | 'none';
    model: string;              // e.g., "claude-3-5-sonnet-20241022", "gpt-4o", "gemini-2.0-flash-exp"
    apiEndpoint?: string;       // Custom API endpoint if needed
    features: {
      chatbot: boolean;         // In-app AI chatbot
      contentGeneration: boolean; // AI-generated content
      recommendations: boolean; // AI-powered recommendations
      search: boolean;          // AI-enhanced search
      analysis: boolean;        // Data analysis with AI
      translation: boolean;     // AI translation
      imageGeneration: boolean; // AI image generation
      voiceAssistant: boolean;  // Voice-based AI assistant
    };
    context?: string;           // Custom system prompt/instructions for the AI
    streaming: boolean;         // Enable streaming responses
  };

  features: {
    pushNotifications: boolean;
    analytics: boolean;
    crashReporting: boolean;
    inAppPurchases: boolean;
    darkMode: boolean;
    offline: boolean;
  };
}

export interface CodeGenerationSettings {
  framework: 'expo' | 'bare-react-native';
  expoRouter: boolean;
  typescript: boolean;
  stylingMethod: 'stylesheet' | 'styled-components' | 'tailwind' | 'nativewind';
  includeBackend: boolean;
  backendProvider?: 'firebase' | 'supabase' | 'convex';
  includeTests: boolean;
  testFramework?: 'jest' | 'vitest';
  includeEslint: boolean;
  includePrettier: boolean;
  includeHusky: boolean;
}

// Session List View (for dashboard)
export interface DesignSessionListItem {
  id: string;
  session_name: string;
  status: SessionStatus;
  current_stage: WizardStage;
  app_name?: string;
  logo_url?: string;
  total_screens_generated: number;
  credits_used: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// Session with Screens (full view)
export interface DesignSessionWithScreens {
  session: DesignSession;
  screens: DesignSessionScreen[];
}

// Create/Update Session DTOs
export interface CreateDesignSessionInput {
  session_name: string;
  app_name?: string;
  app_description?: string;
  app_category?: string;
  target_audience?: string;
  brand_colors?: BrandColors;
  selected_package?: PackageType;
}

export interface UpdateDesignSessionInput {
  session_name?: string;
  status?: SessionStatus;
  current_stage?: WizardStage;
  app_name?: string;
  app_description?: string;
  app_category?: string;
  target_audience?: string;
  brand_colors?: BrandColors;
  style_preferences?: StylePreferences;
  reference_images?: string[];
  selected_package?: PackageType;
  package_cost?: number;
  logo_url?: string;
  logo_prompt?: string;
  prd_data?: AppDesignPRD;
  generation_settings?: CodeGenerationSettings;
  generated_code_url?: string;
}

export interface CreateScreenInput {
  session_id: string;
  screen_type: string;
  screen_name: string;
  screen_url: string;
  prompt_used?: string;
  provider?: string;
  model?: string;
  credits_cost?: number;
  wizard_stage: WizardStage;
  is_selected: boolean;
  reference_images?: string[];
}

export interface CreateHistoryEntryInput {
  session_id: string;
  action: string;
  stage?: number;
  details?: Record<string, any>;
}
