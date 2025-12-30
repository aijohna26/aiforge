import type { UIMessage as Message } from 'ai';
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
  if (typeof (message as any).content === 'string') {
    extracted = (message as any).content;
  } else if (Array.isArray((message as any).content)) {
    extracted = ((message as any).content.find((item: any) => item.type === 'text')?.text as string) || '';
  } else if ((message as any).parts) {
    // AI SDK 6.0 new format
    const textParts = (message as any).parts.filter((p: any) => p.type === 'text');
    extracted = textParts.map((p: any) => p.text).join('');
  } else {
    extracted = '';
  }

  return extracted;
};

export function useMessageParser() {
  const [parsedMessages, setParsedMessages] = useState<Message[]>([]);

  const parseMessages = useCallback((messages: Message[], isLoading: boolean) => {
    let reset = false;

    if (import.meta.env.DEV && !isLoading) {
      reset = true;
      messageParser.reset();
    }

    // Create a new array with parsed content
    const updated = messages.map((message) => {
      if (message.role === 'assistant' || message.role === 'user') {
        const parsedContent = messageParser.parse(message.id, extractTextContent(message));

        // AI SDK 6.0: Handle both content string and parts array
        // We need to update the parts array, not just the content field
        if ((message as any).parts) {
          const newParts = (message as any).parts.map((part: any) => {
            if (part.type === 'text') {
              return {
                ...part,
                text: parsedContent,
              };
            }
            return part;
          });

          return {
            ...message,
            parts: newParts,
          } as Message;
        }

        // Fallback for old format
        return {
          ...message,
          content: parsedContent,
        } as Message;
      }
      return message;
    });

    setParsedMessages(updated);
  }, []);

  return { parsedMessages, parseMessages };
}
