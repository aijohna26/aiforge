/**
 * Message Collapsing - Collapse older messages to save tokens
 * Keeps recent messages at full fidelity, summarizes older ones
 */

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface CollapseOptions {
  maxTokens?: number;
  recentCount?: number;
  estimateTokens?: (text: string) => number;
}

/**
 * Simple token estimation (rough approximation)
 * 1 token ≈ 4 characters
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Collapse older messages while keeping recent ones at full fidelity
 */
export function collapseMessages(
  messages: Message[],
  options: CollapseOptions = {}
): Message[] {
  const {
    maxTokens = 40000,
    recentCount = 10,
    estimateTokens: customEstimate = estimateTokens,
  } = options;

  // If messages fit within limit, return as-is
  const totalTokens = messages.reduce(
    (sum, msg) => sum + customEstimate(msg.content),
    0
  );

  if (totalTokens <= maxTokens) {
    return messages;
  }

  // Keep recent messages at full fidelity
  const recent = messages.slice(-recentCount);
  const older = messages.slice(0, -recentCount);

  if (older.length === 0) {
    // All messages are "recent", return as-is
    return messages;
  }

  // Summarize older messages
  const summary = summarizeOlderMessages(older);

  return [
    {
      role: 'system',
      content: summary,
      timestamp: Date.now(),
    },
    ...recent,
  ];
}

/**
 * Summarize older messages extracting key events
 */
function summarizeOlderMessages(messages: Message[]): string {
  const events: string[] = [];

  for (const message of messages) {
    if (message.role === 'user') {
      // Extract user requests
      const request = extractUserRequest(message.content);
      if (request) {
        events.push(`User requested: ${request}`);
      }
    } else if (message.role === 'assistant') {
      // Extract what AI did
      const actions = extractAIActions(message.content);
      events.push(...actions);
    }
  }

  if (events.length === 0) {
    return 'Previous conversation covered general app setup and initial features.';
  }

  return [
    'Previous conversation summary:',
    '',
    ...events.map((event, i) => `${i + 1}. ${event}`),
    '',
    'Recent messages continue below with full context.',
  ].join('\n');
}

/**
 * Extract key user request from message
 */
function extractUserRequest(content: string): string | null {
  // Remove common filler words and extract main request
  const lines = content.split('\n');
  const firstNonEmpty = lines.find(line => line.trim().length > 10);

  if (!firstNonEmpty) return null;

  // Truncate if too long
  if (firstNonEmpty.length > 100) {
    return firstNonEmpty.slice(0, 97) + '...';
  }

  return firstNonEmpty;
}

/**
 * Extract key actions from AI message
 */
function extractAIActions(content: string): string[] {
  const actions: string[] = [];

  // Look for file operations
  if (content.includes('Created') || content.includes('created')) {
    const fileMatches = content.match(/(?:Created|created)\s+(?:file|component|screen)?\s*[:`]?\s*([^\n,.:]+)/i);
    if (fileMatches) {
      actions.push(`Created ${fileMatches[1].trim()}`);
    }
  }

  if (content.includes('Updated') || content.includes('updated')) {
    const fileMatches = content.match(/(?:Updated|updated)\s+(?:file|component)?\s*[:`]?\s*([^\n,.:]+)/i);
    if (fileMatches) {
      actions.push(`Updated ${fileMatches[1].trim()}`);
    }
  }

  if (content.includes('Fixed') || content.includes('fixed')) {
    const errorMatches = content.match(/(?:Fixed|fixed)\s+([^\n.]+)/i);
    if (errorMatches) {
      actions.push(`Fixed ${errorMatches[1].trim()}`);
    }
  }

  // Look for deployments
  if (content.includes('Deployed') || content.includes('deployed') || content.includes('✅')) {
    actions.push('Deployed changes');
  }

  // If no specific actions found, just note AI responded
  if (actions.length === 0) {
    actions.push('AI provided guidance and code');
  }

  return actions;
}

/**
 * Estimate if messages need collapsing
 */
export function needsCollapsing(
  messages: Message[],
  maxTokens: number = 40000
): boolean {
  const totalTokens = messages.reduce(
    (sum, msg) => sum + estimateTokens(msg.content),
    0
  );
  return totalTokens > maxTokens;
}

/**
 * Get token count for messages
 */
export function getMessageTokenCount(messages: Message[]): number {
  return messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
}
