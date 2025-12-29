import type { Message } from 'ai';
import { useCallback, useState } from 'react';
import { EnhancedStreamingMessageParser } from '~/lib/runtime/enhanced-message-parser';
import { workbenchStore } from '~/lib/stores/workbench';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('useMessageParser');

const messageParser = new EnhancedStreamingMessageParser({
  callbacks: {
    onArtifactOpen: (data) => {
      logger.trace('onArtifactOpen', data);

      workbenchStore.showWorkbench.set(true);
      workbenchStore.addArtifact(data);
    },
    onArtifactClose: (data) => {
      logger.trace('onArtifactClose');

      workbenchStore.updateArtifact(data, { closed: true });
    },
    onActionOpen: (data) => {
      logger.trace('onActionOpen', data.action);

      /*
       * File actions are streamed, so we add them immediately to show progress
       * Shell actions are complete when created by enhanced parser, so we wait for close
       */
      if (data.action.type === 'file') {
        workbenchStore.addAction(data);
      }
    },
    onActionClose: (data) => {
      logger.trace('onActionClose', data.action);

      /*
       * Add non-file actions (shell, build, start, etc.) when they close
       * Enhanced parser creates complete shell actions, so they're ready to execute
       */
      if (data.action.type !== 'file') {
        workbenchStore.addAction(data);
      }

      workbenchStore.runAction(data);
    },
    onActionStream: (data) => {
      logger.trace('onActionStream', data.action);
      workbenchStore.runAction(data, true);
    },
  },
});
const extractTextContent = (message: Message) => {
  let extracted = '';

  // AI SDK 6.0: Handle both old format (content string) and new format (parts array)
  if (typeof message.content === 'string') {
    extracted = message.content;
  } else if (Array.isArray(message.content)) {
    extracted = (message.content.find((item) => item.type === 'text')?.text as string) || '';
  } else if ((message as any).parts) {
    // AI SDK 6.0 new format
    const textParts = (message as any).parts.filter((p: any) => p.type === 'text');
    extracted = textParts.map((p: any) => p.text).join('');
  } else {
    extracted = '';
  }

  // Debug logging
  if (extracted.includes('boltArtifact') || extracted.includes('design-sync')) {
    logger.debug('[useMessageParser] Extracted content contains artifact tags!');
    logger.debug('[useMessageParser] Content length:', extracted.length);
    logger.debug('[useMessageParser] Content preview:', extracted.substring(0, 300));
  } else if (extracted.includes('ExamScan') || extracted.includes('appName')) {
    logger.debug('[useMessageParser] Extracted content contains design data but NO artifact tags!');
    logger.debug('[useMessageParser] Content preview:', extracted.substring(0, 300));
    logger.debug('[useMessageParser] Message structure:', JSON.stringify(message, null, 2).substring(0, 500));
  }

  return extracted;
};

export function useMessageParser() {
  const [parsedMessages, setParsedMessages] = useState<{ [key: number]: string }>({});

  const parseMessages = useCallback((messages: Message[], isLoading: boolean) => {
    let reset = false;

    if (import.meta.env.DEV && !isLoading) {
      reset = true;
      messageParser.reset();
    }

    for (const [index, message] of messages.entries()) {
      if (message.role === 'assistant' || message.role === 'user') {
        const newParsedContent = messageParser.parse(message.id, extractTextContent(message));
        setParsedMessages((prevParsed) => ({
          ...prevParsed,
          [index]: !reset ? (prevParsed[index] || '') + newParsedContent : newParsedContent,
        }));
      }
    }
  }, []);

  return { parsedMessages, parseMessages };
}
