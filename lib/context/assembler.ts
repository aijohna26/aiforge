/**
 * Context Assembler - Assembles complete context for AI
 * Combines system prompt, relevant files, and conversation history
 */

import { generateSystemPrompt, SystemPromptOptions } from '../prompts/system';
import { getFileTracker } from './fileTracker';
import { collapseMessages, Message } from './messageCollapse';
import type { GeneratedFile } from '../types';

export interface ContextOptions {
  projectId: string;
  userMessage: string;
  conversationHistory: Message[];
  files: GeneratedFile[];
  provider?: 'openai' | 'anthropic' | 'google';
  features?: SystemPromptOptions['features'];
}

export interface AssembledContext {
  messages: Message[];
  stats: {
    systemPromptTokens: number;
    filesTokens: number;
    historyTokens: number;
    totalTokens: number;
    filesIncluded: number;
  };
}

const MAX_CONTEXT_TOKENS = 100000; // Conservative limit
const MAX_FILE_SIZE = 10000; // Max tokens per file

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Assemble complete context for AI
 */
export async function assembleContext(
  opts: ContextOptions
): Promise<AssembledContext> {
  const {
    projectId,
    userMessage,
    conversationHistory,
    files,
    provider = 'openai',
    features,
  } = opts;

  // 1. Generate system prompt
  const systemPrompt = generateSystemPrompt({ provider, features });
  const systemTokens = estimateTokens(systemPrompt);

  // 2. Get relevant files based on access patterns
  const fileTracker = getFileTracker(projectId);
  const allFilePaths = files.map(f => f.path);
  const relevantPaths = fileTracker.getRelevantFiles(allFilePaths);

  // 3. Format files for context
  const relevantFiles = files.filter(f => relevantPaths.includes(f.path));
  const filesContext = formatFilesForContext(relevantFiles);
  const filesTokens = estimateTokens(filesContext);

  // 4. Collapse conversation history if needed
  const availableForHistory = MAX_CONTEXT_TOKENS - systemTokens - filesTokens;
  const collapsedHistory = collapseMessages(conversationHistory, {
    maxTokens: availableForHistory,
    recentCount: 10,
  });
  const historyTokens = collapsedHistory.reduce(
    (sum, msg) => sum + estimateTokens(msg.content),
    0
  );

  // 5. Assemble final context
  const messages: Message[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'system',
      content: filesContext,
    },
    ...collapsedHistory,
    {
      role: 'user',
      content: userMessage,
    },
  ];

  const totalTokens = systemTokens + filesTokens + historyTokens + estimateTokens(userMessage);

  return {
    messages,
    stats: {
      systemPromptTokens: systemTokens,
      filesTokens,
      historyTokens,
      totalTokens,
      filesIncluded: relevantFiles.length,
    },
  };
}

/**
 * Format files for context with clear delineation
 */
function formatFilesForContext(files: GeneratedFile[]): string {
  if (files.length === 0) {
    return 'No project files available yet. You will create the initial structure.';
  }

  const sections: string[] = [
    '# Project Files',
    '',
    `The following ${files.length} file(s) are most relevant to this conversation:`,
    '',
  ];

  for (const file of files) {
    // Truncate large files
    let content = file.content;
    const tokens = estimateTokens(content);

    if (tokens > MAX_FILE_SIZE) {
      const targetLength = MAX_FILE_SIZE * 4; // Approximate characters
      content = content.slice(0, targetLength) + '\n\n... (file truncated)';
    }

    sections.push(
      '---',
      '',
      `## File: ${file.path}`,
      '',
      '```',
      content,
      '```',
      ''
    );
  }

  sections.push(
    '---',
    '',
    'When modifying files:',
    '- Read the file first to see its current state',
    '- Make targeted edits when possible',
    '- Rewrite entire file only when necessary',
    '- Always maintain consistency with existing code style',
    ''
  );

  return sections.join('\n');
}

/**
 * Create a compact context for token-constrained scenarios
 */
export async function assembleCompactContext(
  opts: ContextOptions
): Promise<AssembledContext> {
  const {
    projectId,
    userMessage,
    conversationHistory,
    files,
    provider = 'openai',
  } = opts;

  // Use compact system prompt
  const systemPrompt = generateSystemPrompt({ provider }).slice(0, 10000);
  const systemTokens = estimateTokens(systemPrompt);

  // Only include most critical files (max 8)
  const fileTracker = getFileTracker(projectId);
  const allFilePaths = files.map(f => f.path);
  const relevantPaths = fileTracker.getRelevantFiles(allFilePaths).slice(0, 8);
  const relevantFiles = files.filter(f => relevantPaths.includes(f.path));
  const filesContext = formatFilesForContext(relevantFiles);
  const filesTokens = estimateTokens(filesContext);

  // Minimal history (last 5 messages)
  const recentHistory = conversationHistory.slice(-5);
  const historyTokens = recentHistory.reduce(
    (sum, msg) => sum + estimateTokens(msg.content),
    0
  );

  const messages: Message[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'system',
      content: filesContext,
    },
    ...recentHistory,
    {
      role: 'user',
      content: userMessage,
    },
  ];

  const totalTokens = systemTokens + filesTokens + historyTokens + estimateTokens(userMessage);

  return {
    messages,
    stats: {
      systemPromptTokens: systemTokens,
      filesTokens,
      historyTokens,
      totalTokens,
      filesIncluded: relevantFiles.length,
    },
  };
}

/**
 * Validate assembled context
 */
export function validateContext(context: AssembledContext): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check token limits
  if (context.stats.totalTokens > MAX_CONTEXT_TOKENS) {
    errors.push(`Context exceeds maximum tokens: ${context.stats.totalTokens} > ${MAX_CONTEXT_TOKENS}`);
  }

  if (context.stats.totalTokens > MAX_CONTEXT_TOKENS * 0.9) {
    warnings.push(`Context is near token limit: ${context.stats.totalTokens} (${Math.round(context.stats.totalTokens / MAX_CONTEXT_TOKENS * 100)}%)`);
  }

  // Check message structure
  if (context.messages.length === 0) {
    errors.push('Context has no messages');
  }

  if (context.messages[0]?.role !== 'system') {
    errors.push('First message must be system prompt');
  }

  if (context.messages[context.messages.length - 1]?.role !== 'user') {
    warnings.push('Last message should be user message');
  }

  // Check files
  if (context.stats.filesIncluded === 0) {
    warnings.push('No files included in context');
  }

  if (context.stats.filesIncluded > 20) {
    warnings.push(`Large number of files included: ${context.stats.filesIncluded}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
