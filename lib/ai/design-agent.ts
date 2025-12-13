// Design Agent - Core Service
// Supports two modes: Wizard (step-by-step) and Express (AI does everything)

import { getAIProvider } from './factory';
import { generate_image } from '@/lib/generate-image';

export type DesignMode = 'wizard' | 'express';

export interface DesignRequest {
    appIdea: string;
    userId: string;
    mode: DesignMode;
    researchReportId?: string;

    // Express mode preferences
    preferences?: {
        colorScheme?: 'light' | 'dark' | 'auto';
        style?: 'minimal' | 'modern' | 'playful';
        targetPlatform?: 'ios' | 'android' | 'both';
    };

    // Wizard mode - current step data
    wizardState?: WizardState;
}

export interface WizardState {
    currentStep: number; // 1-5
    selectedLogo?: Logo;
    selectedColors?: ColorPalette;
    approvedScreens?: string[]; // Screen IDs
}

export interface Logo {
    id: string;
    imageUrl: string;
    style: 'minimal' | 'modern' | 'playful';
    primaryColor: string;
}

export interface ColorPalette {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
}

export interface BrandingGuide {
    logo: Logo;
    colors: ColorPalette;
    typography: {
        heading: string;
        body: string;
        button: string;
    };
}

export interface Screen {
    id: string;
    name: string;
    category: 'branding' | 'launch' | 'core';
    imageUrl: string;
    components: string[];
    description: string;
}

export interface FeatureSpec {
    appName: string;
    tagline: string;
    description: string;
    coreFeatures: string[];
    userFlows: string[];
    techStack: string[];
}

export interface DesignPackage {
    id: string;
    mode: DesignMode;
    featureSpec: FeatureSpec;
    branding: BrandingGuide;
    screens: Screen[];
    createdAt: Date;
    status: 'draft' | 'approved' | 'in_development';
}

export interface DesignProgress {
    stage: 'branding' | 'launch' | 'core' | 'complete';
    message: string;
    progress: number; // 0-100
    currentScreen?: string;
}

export class DesignAgent {
    private aiProvider = getAIProvider();

    // Express Mode - Generate everything at once
    async generateExpressDesign(
        request: DesignRequest,
        onProgress?: (progress: DesignProgress) => void
    ): Promise<DesignPackage> {
        const packageId = crypto.randomUUID();

        try {
            // Step 1: Generate feature spec (0-20%)
            onProgress?.({
                stage: 'branding',
                message: 'Analyzing your app idea...',
                progress: 10,
            });

            const featureSpec = await this.generateFeatureSpec(request.appIdea);

            // Step 2: Generate branding (20-40%)
            onProgress?.({
                stage: 'branding',
                message: 'Creating logo and branding...',
                progress: 30,
            });

            const branding = await this.generateBranding(
                featureSpec.appName,
                request.preferences?.style || 'modern'
            );

            // Step 3: Generate launch screens (40-70%)
            onProgress?.({
                stage: 'launch',
                message: 'Designing splash and onboarding screens...',
                progress: 50,
            });

            const launchScreens = await this.generateLaunchScreens(featureSpec, branding);

            // Step 4: Generate core screens (70-100%)
            onProgress?.({
                stage: 'core',
                message: 'Creating core app screens...',
                progress: 80,
            });

            const coreScreens = await this.generateCoreScreens(featureSpec, branding);

            onProgress?.({
                stage: 'complete',
                message: 'Design package complete!',
                progress: 100,
            });

            return {
                id: packageId,
                mode: 'express',
                featureSpec,
                branding,
                screens: [...launchScreens, ...coreScreens],
                createdAt: new Date(),
                status: 'draft',
            };
        } catch (error) {
            console.error('[DesignAgent] Express mode error:', error);
            throw error;
        }
    }

    // Wizard Mode - Step 1: Generate logo options
    async generateLogoOptions(
        appName: string,
        style: 'minimal' | 'modern' | 'playful'
    ): Promise<Logo[]> {
        const logos: Logo[] = [];

        for (let i = 0; i < 3; i++) {
            const prompt = `Create a ${style} app logo for "${appName}". 
      
      Style: ${style}
      Format: Simple, clean, modern app icon
      Size: 1024x1024px
      Background: Transparent or solid color
      
      Variation ${i + 1} of 3 - make it unique.`;

            const imageUrl = await generate_image(prompt, `logo_${appName}_${i}`);

            logos.push({
                id: `logo_${i}`,
                imageUrl,
                style,
                primaryColor: this.extractPrimaryColor(style),
            });
        }

        return logos;
    }

    // Wizard Mode - Step 2: Generate color palette based on logo
    async generateColorPalette(logo: Logo): Promise<ColorPalette[]> {
        // Generate 3 color palette variations
        const palettes: ColorPalette[] = [
            {
                primary: logo.primaryColor,
                secondary: this.generateComplementaryColor(logo.primaryColor),
                accent: this.generateAccentColor(logo.primaryColor),
                background: '#FFFFFF',
                text: '#1F2937',
            },
            // Dark mode variant
            {
                primary: logo.primaryColor,
                secondary: this.generateComplementaryColor(logo.primaryColor),
                accent: this.generateAccentColor(logo.primaryColor),
                background: '#0F172A',
                text: '#F8FAFC',
            },
            // Vibrant variant
            {
                primary: this.saturateColor(logo.primaryColor),
                secondary: this.generateComplementaryColor(logo.primaryColor, 1.2),
                accent: this.generateAccentColor(logo.primaryColor, 1.3),
                background: '#FFFFFF',
                text: '#1F2937',
            },
        ];

        return palettes;
    }

    // Wizard Mode - Step 3: Generate splash and onboarding
    async generateSplashScreen(branding: BrandingGuide): Promise<Screen> {
        const prompt = `Create a mobile app splash screen.
    
    Logo: ${branding.logo.imageUrl}
    Primary color: ${branding.colors.primary}
    App name: Display prominently
    
    Style: Clean, modern, centered logo with app name below.
    Size: 375x812px (iPhone)`;

        const imageUrl = await generate_image(prompt, 'splash_screen');

        return {
            id: 'splash',
            name: 'Splash Screen',
            category: 'launch',
            imageUrl,
            components: ['Logo', 'App Name'],
            description: 'Initial loading screen',
        };
    }

    async generateOnboardingScreens(
        featureSpec: FeatureSpec,
        branding: BrandingGuide
    ): Promise<Screen[]> {
        const screens: Screen[] = [];
        const features = featureSpec.coreFeatures.slice(0, 3);

        for (let i = 0; i < features.length; i++) {
            const prompt = `Create onboarding screen ${i + 1} for a mobile app.
      
      Feature to highlight: ${features[i]}
      Colors: ${branding.colors.primary}, ${branding.colors.secondary}
      
      Include:
      - Illustration or icon
      - Headline
      - Brief description
      - Progress indicator (${i + 1}/3)
      - Next button
      
      Style: ${branding.logo.style}
      Size: 375x812px`;

            const imageUrl = await generate_image(prompt, `onboarding_${i + 1}`);

            screens.push({
                id: `onboarding_${i + 1}`,
                name: `Onboarding ${i + 1}`,
                category: 'launch',
                imageUrl,
                components: ['Illustration', 'Headline', 'Description', 'Button'],
                description: features[i],
            });
        }

        return screens;
    }

    // Private helper methods
    private async generateFeatureSpec(appIdea: string): Promise<FeatureSpec> {
        const prompt = `Analyze this app idea and create a feature specification: "${appIdea}"
    
    Return JSON with:
    - appName (kebab-case)
    - tagline (one sentence)
    - description (2-3 sentences)
    - coreFeatures (array of 5-7 features)
    - userFlows (array of 3-5 user flows)
    - techStack (recommended technologies)`;

        const response = await this.aiProvider.generateText({
            prompt,
            systemPrompt: 'You are a product manager creating feature specifications.',
            maxTokens: 2000,
        });

        try {
            return JSON.parse(response);
        } catch (error) {
            console.error('[DesignAgent] Failed to parse feature spec:', error);
            throw new Error('Failed to generate feature specification');
        }
    }

    private async generateBranding(
        appName: string,
        style: 'minimal' | 'modern' | 'playful'
    ): Promise<BrandingGuide> {
        const logos = await this.generateLogoOptions(appName, style);
        const selectedLogo = logos[0]; // Auto-select first in express mode

        const colors: ColorPalette = {
            primary: selectedLogo.primaryColor,
            secondary: this.generateComplementaryColor(selectedLogo.primaryColor),
            accent: this.generateAccentColor(selectedLogo.primaryColor),
            background: '#FFFFFF',
            text: '#1F2937',
        };

        return {
            logo: selectedLogo,
            colors,
            typography: {
                heading: 'Inter',
                body: 'Inter',
                button: 'Inter',
            },
        };
    }

    private async generateLaunchScreens(
        featureSpec: FeatureSpec,
        branding: BrandingGuide
    ): Promise<Screen[]> {
        const splash = await this.generateSplashScreen(branding);
        const onboarding = await this.generateOnboardingScreens(featureSpec, branding);

        return [splash, ...onboarding];
    }

    private async generateCoreScreens(
        featureSpec: FeatureSpec,
        branding: BrandingGuide
    ): Promise<Screen[]> {
        // TODO: Implement core screen generation
        // For now, return placeholder
        return [];
    }

    private extractPrimaryColor(style: string): string {
        const colorMap = {
            minimal: '#2563EB', // Blue
            modern: '#8B5CF6', // Purple
            playful: '#F59E0B', // Orange
        };
        return colorMap[style as keyof typeof colorMap] || '#2563EB';
    }

    private generateComplementaryColor(baseColor: string, saturation = 1.0): string {
        // Simple complementary color generation
        // In production, use a proper color library
        return '#10B981'; // Green
    }

    private generateAccentColor(baseColor: string, saturation = 1.0): string {
        return '#F59E0B'; // Orange
    }

    private saturateColor(color: string): string {
        return color; // Placeholder
    }
}

// Singleton instance
export const designAgent = new DesignAgent();
