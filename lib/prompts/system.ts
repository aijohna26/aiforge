/**
 * Main system prompt assembler
 * Combines all prompt modules into a cohesive system prompt
 */

import { expoGuidelines } from './expoGuidelines';
import { platformConstraints } from './platformConstraints';
import { outputInstructions } from './outputInstructions';
import { fileStructure } from './fileStructure';
import { deploymentRules } from './deploymentRules';
import { secretsInstructions } from './secretsInstructions';
import { openAiGuidelines } from './providerPrompts/openai';
import { anthropicGuidelines } from './providerPrompts/anthropic';
import { googleGuidelines } from './providerPrompts/google';

export interface SystemPromptOptions {
  provider?: 'openai' | 'anthropic' | 'google';
  features?: {
    enableDeployment?: boolean;
    enableTesting?: boolean;
    verboseMode?: boolean;
  };
}

const ROLE_DEFINITION = `You are AppForge AI, an expert AI assistant and exceptional senior mobile developer helping users build and deploy React Native applications using Expo.

Your expertise includes:
- React Native & Expo SDK
- Cross-platform mobile development (iOS & Android)
- Mobile UI/UX best practices
- Performance optimization
- Platform-specific features
- Modern TypeScript and React patterns

Your mission is to help users create production-ready mobile applications that work flawlessly on both iOS and Android.`;

/**
 * Generate complete system prompt
 * IMPORTANT: This function must start with ROLE_DEFINITION for prompt caching
 */
export function generateSystemPrompt(opts: SystemPromptOptions = {}): string {
  const {
    provider = 'openai',
    features = {
      enableDeployment: true,
      enableTesting: true,
      verboseMode: false,
    }
  } = opts;

  const components = [
    ROLE_DEFINITION,
    expoGuidelines(),
    platformConstraints(),
    outputInstructions(features),
    fileStructure(),
    features.enableDeployment ? deploymentRules() : null,
    secretsInstructions(),
    // Provider-specific guidelines
    provider === 'openai' ? openAiGuidelines() : null,
    provider === 'anthropic' ? anthropicGuidelines() : null,
    provider === 'google' ? googleGuidelines() : null,
    // Repeat critical sections for reinforcement
    features.enableDeployment ? deploymentRules() : null,
    platformConstraints(),
  ];

  return components
    .filter(Boolean)
    .join('\n\n---\n\n');
}

/**
 * Generate a shorter system prompt for contexts with tight token budgets
 */
export function generateCompactSystemPrompt(opts: SystemPromptOptions = {}): string {
  const { provider = 'openai' } = opts;

  return [
    ROLE_DEFINITION,
    'Core Guidelines:\n' + expoGuidelines().slice(0, 5000),
    platformConstraints().slice(0, 2000),
    outputInstructions({ verboseMode: false }).slice(0, 2000),
    provider === 'openai' ? openAiGuidelines().slice(0, 1000) : null,
  ]
    .filter(Boolean)
    .join('\n\n---\n\n');
}
