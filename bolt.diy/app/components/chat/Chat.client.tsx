import { useStore } from '@nanostores/react';
import type { Message } from 'ai';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useAnimate } from 'framer-motion';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useMessageParser, usePromptEnhancer, useShortcuts } from '~/lib/hooks';
import { description, useChatHistory } from '~/lib/persistence';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, PROMPT_COOKIE_KEY, PROVIDER_LIST } from '~/utils/constants';

import { createScopedLogger, renderLogger } from '~/utils/logger';
import { BaseChat } from './BaseChat';
import Cookies from 'js-cookie';
import { debounce } from '~/utils/debounce';
import { useSettings } from '~/lib/hooks/useSettings';
import type { ProviderInfo } from '~/types/model';
import { useSearchParams, useParams } from '@remix-run/react';
import { createSampler } from '~/utils/sampler';
import { getTemplates, selectStarterTemplate } from '~/utils/selectStarterTemplate';
import { logStore } from '~/lib/stores/logs';
import { streamingState } from '~/lib/stores/streaming';
import { filesToArtifacts } from '~/utils/fileUtils';
import { supabaseConnection } from '~/lib/stores/supabase';
import { defaultDesignScheme, type DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';
import type { TextUIPart, FileUIPart, Attachment } from '@ai-sdk/ui-utils';
import { useMCPStore } from '~/lib/stores/mcp';
import type { LlmErrorAlertType } from '~/types/actions';
import { updateTicketStatus, getTicketById } from '~/lib/stores/plan';
import { yoloModeStore } from '~/lib/stores/settings';
import { loadWizardData } from '~/lib/stores/designWizard';

const logger = createScopedLogger('Chat');

export function Chat() {
  renderLogger.trace('Chat');

  const { ready, initialMessages, storeMessageHistory, importChat, exportChat } = useChatHistory();
  const title = useStore(description);
  useEffect(() => {
    workbenchStore.setReloadedMessages(initialMessages.map((m) => m.id));
  }, [initialMessages]);

  return (
    <>
      {ready && (
        <ChatImpl
          description={title}
          initialMessages={initialMessages}
          exportChat={exportChat}
          storeMessageHistory={storeMessageHistory}
          importChat={importChat}
        />
      )}
    </>
  );
}

const processSampledMessages = createSampler(
  (options: {
    messages: Message[];
    initialMessages: Message[];
    isLoading: boolean;
    parseMessages: (messages: Message[], isLoading: boolean) => void;
    storeMessageHistory: (messages: Message[]) => Promise<void>;
  }) => {
    const { messages, initialMessages, isLoading, parseMessages, storeMessageHistory } = options;
    parseMessages(messages, isLoading);

    if (messages.length > initialMessages.length) {
      storeMessageHistory(messages).catch((error) => toast.error(error.message));
    }
  },
  50,
);

interface ChatProps {
  initialMessages: Message[];
  storeMessageHistory: (messages: Message[]) => Promise<void>;
  importChat: (description: string, messages: Message[]) => Promise<void>;
  exportChat: () => void;
  description?: string;
}

export const ChatImpl = memo(
  ({ description, initialMessages, storeMessageHistory, importChat, exportChat }: ChatProps) => {
    useShortcuts();

    const { id: projectId } = useParams();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [chatStarted, setChatStarted] = useState(initialMessages.length > 0);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [imageDataList, setImageDataList] = useState<string[]>([]);
    const seedPromptProcessed = useRef(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [fakeLoading, setFakeLoading] = useState(false);
    const files = useStore(workbenchStore.files);
    const [designScheme, setDesignScheme] = useState<DesignScheme>(defaultDesignScheme);
    const actionAlert = useStore(workbenchStore.alert);
    const deployAlert = useStore(workbenchStore.deployAlert);
    const supabaseConn = useStore(supabaseConnection);
    const selectedProject = supabaseConn.stats?.projects?.find(
      (project) => project.id === supabaseConn.selectedProjectId,
    );
    const supabaseAlert = useStore(workbenchStore.supabaseAlert);
    const { activeProviders, promptId, autoSelectTemplate, contextOptimizationEnabled } = useSettings();
    const [seedPrompt] = useState(() => {
      if (typeof window !== 'undefined') {
        const seed = localStorage.getItem('bolt_seed_prompt');
        return seed || null;
      }

      return null;
    });

    const [llmErrorAlert, setLlmErrorAlert] = useState<LlmErrorAlertType | undefined>(undefined);
    const [model, setModel] = useState(() => {
      const savedModel = Cookies.get('selectedModel');
      return savedModel || DEFAULT_MODEL;
    });
    const [provider, setProvider] = useState(() => {
      const savedProvider = Cookies.get('selectedProvider');
      return (PROVIDER_LIST.find((p) => p.name === savedProvider) || DEFAULT_PROVIDER) as ProviderInfo;
    });
    const { showChat } = useStore(chatStore);
    const [animationScope] = useAnimate();
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
    const [chatMode, setChatMode] = useState<'discuss' | 'build' | 'design'>(() => {
      if (typeof window !== 'undefined' && localStorage.getItem('bolt_seed_prompt')) {
        return 'design';
      }

      return 'build';
    });
    const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
    const mcpSettings = useMCPStore((state) => state.settings);

    const currentView = useStore(workbenchStore.currentView);

    // Project Hydration Logic
    useEffect(() => {
      // Only fetch project if projectId is a valid UUID (not a chat timestamp)
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId || '');

      if (projectId && isValidUUID && typeof window !== 'undefined') {
        const hydrateProject = async () => {
          try {
            const response = await fetch(`/api/get-project/${projectId}`);

            if (!response.ok) {
              throw new Error('Failed to fetch project');
            }

            const data = await response.json();

            if (data.success && data.project?.data) {
              console.log('[Chat] Hydrating design wizard state from project:', projectId);
              loadWizardData(data.project.data);

              // Update the supabase connection store with the active project ID
              const { updateSupabaseConnection } = await import('~/lib/stores/supabase');
              updateSupabaseConnection({ selectedProjectId: projectId });

              // Initialize Plan Store to fetch tickets
              const { setPlanProject } = await import('~/lib/stores/plan');

              // Derive a simple key from name or default to PROJ
              const projectKey = data.project.name
                ? data.project.name
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, '')
                  .substring(0, 4)
                : 'PROJ';

              setPlanProject(projectId, projectKey);

              // If the project is finalized, switch to Plan view to show next steps
              if (data.project.status === 'finalized' && workbenchStore.currentView.get() !== 'plan') {
                // workbenchStore.currentView.set('plan');
              }
            }
          } catch (error) {
            console.error('[Chat] Project hydration failed:', error);
            toast.error('Could not sync project data');
          }
        };

        hydrateProject();
      }
    }, [projectId]);

    useEffect(() => {
      if (currentView === 'design') {
        setChatMode('design');
      } else {
        // If we leave design view, we should definitely NOT be in "handed over" state anymore
        chatStore.setKey('handedOver', false);
        chatStore.setKey('showChat', true);

        if (chatMode === 'design') {
          setChatMode('build');
        }
      }
    }, [currentView]);

    // AI SDK 6.0: Input state is managed manually
    const [input, setInput] = useState(Cookies.get(PROMPT_COOKIE_KEY) || '');
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInput(e.target.value);
    }, []);

    const {
      messages = [],
      status,
      stop,
      sendMessage,
      setMessages,
      regenerate,
      error,
      addToolResult,
    } = useChat({
      transport: new DefaultChatTransport({
        api: '/api/chat-simple',
        body: {
          apiKeys,
          files,
          promptId,
          contextOptimization: contextOptimizationEnabled,
          chatMode,
          designScheme,
          supabase: {
            isConnected: supabaseConn.isConnected,
            hasSelectedProject: !!selectedProject,
            credentials: {
              supabaseUrl: supabaseConn?.credentials?.supabaseUrl,
              anonKey: supabaseConn?.credentials?.anonKey,
            },
          },
          maxLLMSteps: mcpSettings.maxLLMSteps,
        },
      }),
      onError: (error) => {
        setFakeLoading(false);
        handleError(error, 'chat');
      },
      onFinish: async ({ message }) => {
        const usage = (message as any).usage;
        setData(undefined);

        // Wait for all queued actions to complete before showing completion message
        // This prevents premature "finished working" notifications while files are still being written
        try {
          await workbenchStore.waitForExecutionQueue();
          console.log('[Chat] All queued actions completed');

          // CRITICAL: Also wait for E2B operations to complete
          // The execution queue resolves when callbacks finish, but E2B HTTP requests may still be in flight
          const { E2BRunner } = await import('~/lib/runtime/e2b-runner');
          await E2BRunner.waitForAllOperations();
          console.log('[Chat] All E2B operations completed, signaling completion');
        } catch (err) {
          console.error('[Chat] Error waiting for operations:', err);
        }

        // Handle automated ticket transitions
        const activeTicketId = chatStore.get().activeTicketId;

        if (activeTicketId) {
          const ticket = getTicketById(activeTicketId);

          if (ticket && ticket.status === 'in-progress') {
            if (yoloModeStore.get()) {
              // YOLO: Auto-move to QA
              console.log(`YOLO Mode: Auto-moving ticket ${ticket.key} to QA`);
              updateTicketStatus(activeTicketId, 'testing');
            } else {
              // Non-YOLO: Alert user
              toast.info(
                `Agent finished working on ${ticket.key}. You can ask for more changes, move it to 'Done' to complete, or to 'QA' for automated testing.`,
                {
                  autoClose: 15000,
                  position: 'bottom-right',
                },
              );

              // Play subtle sound
              const audio = new Audio('/notification.mp3');
              audio.play().catch((e) => console.error('Failed to play sound', e));
            }
          }

          // Clear active ticket tracking for this coding phase
          chatStore.setKey('activeTicketId', null);
        }

        if (usage) {
          console.log('Token usage:', usage);

          // AI SDK 6.0: Get message length safely from parts or content
          let messageLength = 0;
          if ((message as any).content) {
            messageLength = (message as any).content.length;
          } else if ((message as any).parts) {
            messageLength = (message as any).parts
              .filter((p: any) => p.type === 'text')
              .reduce((len: number, p: any) => len + (p.text?.length || 0), 0);
          }

          logStore.logProvider('Chat response completed', {
            component: 'Chat',
            action: 'response',
            model,
            provider: provider.name,
            usage,
            messageLength,
          });
        }

        logger.debug('Finished streaming');
      },
      messages: initialMessages,
    });

    // AI SDK 6.0: Create backward-compatible aliases
    const isLoading = status === 'streaming' || status === 'submitted';
    const append = sendMessage;
    const reload = regenerate;

    // Placeholder for data/setData (not used in AI SDK 6.0)
    const [chatData, setChatData] = useState<any>(undefined);
    const setData = setChatData;

    // Debug: Log what useChat returns
    const useChatReturn = { messages, status, isLoading, input, handleInputChange, setInput, stop, sendMessage, append, setMessages, regenerate, reload, error };

    // Handle initial prompt from landing page (seedPrompt)
    // Split into two effects: one for state setup, one for sending the message
    useEffect(() => {
      if (typeof window === 'undefined' || !seedPrompt || seedPromptProcessed.current) {
        return;
      }


      // 1. Set both view and mode to design if not already
      if (currentView !== 'design') {
        workbenchStore.currentView.set('design');
        return;
      }

      if (chatMode !== 'design') {
        setChatMode('design');
        return;
      }
    }, [seedPrompt, currentView, chatMode]);

    // Second effect: Wait for append to be ready and send the message
    useEffect(() => {
      if (typeof window === 'undefined' || !seedPrompt || seedPromptProcessed.current) {
        return;
      }

      // Only proceed when state is ready AND append function exists
      if (currentView !== 'design' || chatMode !== 'design') {
        return;
      }

      // Critical: Wait for append to be defined
      if (!append) {
        return;
      }


      const processSeedPrompt = async () => {
        seedPromptProcessed.current = true;

        // Hydrate the wizard with the initial prompt description
        const { setCurrentStep, resetDesignWizard } = await import('~/lib/stores/designWizard');
        resetDesignWizard();
        setCurrentStep(1);

        // Small delay to ensure wizard state is set
        const timer = setTimeout(() => {
          setSearchParams({});

          append({
            text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${seedPrompt}`,
          });

          // Clear the prompt so it doesn't trigger again
          localStorage.removeItem('bolt_seed_prompt');

          // Clear the input box and cookie as we've consumed the prompt
          setInput('');
          Cookies.remove(PROMPT_COOKIE_KEY);
        }, 100);

        return () => clearTimeout(timer);
      };

      processSeedPrompt();
    }, [seedPrompt, chatMode, currentView, model, provider, append, setSearchParams, setInput]);

    // Handle automated bootstrap prompt (after PRD generation)
    useEffect(() => {
      const checkBootstrap = () => {
        const { bootstrapPrompt } = chatStore.get();

        if (bootstrapPrompt) {

          // Switch to build mode
          setChatMode('build');
          workbenchStore.currentView.set('code');

          append({
            text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${bootstrapPrompt}`,
          });

          // Clear from store
          chatStore.setKey('bootstrapPrompt', null);
        }
      };

      const unsubscribe = chatStore.subscribe(checkBootstrap);

      return () => unsubscribe();
    }, [model, provider, append]);

    // Handle URL ?prompt parameter (alternative to seedPrompt)
    useEffect(() => {
      if (typeof window === 'undefined') {
        return;
      }

      const prompt = searchParams.get('prompt');

      if (prompt) {
        setSearchParams({});
        runAnimation();
        workbenchStore.currentView.set('code');
        append({
          text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${prompt}`,
        });
      }
    }, [model, provider, searchParams, append]);

    // Handle automated ticket prompts (from Plan view)
    useEffect(() => {
      const handleTicketToCode = (event: any) => {
        const { ticket, prompt } = event.detail;

        // Wait for current execution to finish if any
        if (isLoading) {
          const checkLoading = setInterval(() => {
            if (!isLoading) {
              clearInterval(checkLoading);
              startTicketWork(ticket, prompt);
            }
          }, 500);
          return;
        }

        startTicketWork(ticket, prompt);
      };

      const handleTicketToQA = (event: any) => {
        const { ticket, prompt } = event.detail;

        if (isLoading) {
          const checkLoading = setInterval(() => {
            if (!isLoading) {
              clearInterval(checkLoading);
              startTicketWork(ticket, prompt);
            }
          }, 500);
          return;
        }

        startTicketWork(ticket, prompt);
      };

      const startTicketWork = (ticket: any, prompt: string) => {
        // Track active ticket
        chatStore.setKey('activeTicketId', ticket.id);

        // Switch to code view
        workbenchStore.currentView.set('code');

        // Append message
        append({
          text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${prompt}`,
        });
      };

      window.addEventListener('ticket-to-code', handleTicketToCode);
      window.addEventListener('ticket-to-qa', handleTicketToQA);

      return () => {
        window.removeEventListener('ticket-to-code', handleTicketToCode);
        window.removeEventListener('ticket-to-qa', handleTicketToQA);
      };
    }, [isLoading, append, model, provider]);

    const { enhancingPrompt, promptEnhanced, enhancePrompt, resetEnhancer } = usePromptEnhancer();
    const { parsedMessages, parseMessages } = useMessageParser();

    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;

    useEffect(() => {
      chatStore.setKey('started', initialMessages.length > 0);
    }, []);

    useEffect(() => {
      processSampledMessages({
        messages,
        initialMessages,
        isLoading,
        parseMessages,
        storeMessageHistory,
      });
    }, [messages, isLoading, parseMessages]);

    const scrollTextArea = () => {
      const textarea = textareaRef.current;

      if (textarea) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    };

    const abort = () => {
      stop();
      chatStore.setKey('aborted', true);
      workbenchStore.abortAllActions();

      logStore.logProvider('Chat response aborted', {
        component: 'Chat',
        action: 'abort',
        model,
        provider: provider.name,
      });
    };

    const handleError = useCallback(
      (error: any, context: 'chat' | 'template' | 'llmcall' = 'chat') => {
        logger.error(`${context} request failed`, error);

        stop();
        setFakeLoading(false);

        let errorInfo = {
          message: 'An unexpected error occurred',
          isRetryable: true,
          statusCode: 500,
          provider: provider.name,
          type: 'unknown' as const,
          retryDelay: 0,
        };

        if (error.message) {
          try {
            const parsed = JSON.parse(error.message);

            if (parsed.error || parsed.message) {
              errorInfo = { ...errorInfo, ...parsed };
            } else {
              errorInfo.message = error.message;
            }
          } catch {
            errorInfo.message = error.message;
          }
        }

        let errorType: LlmErrorAlertType['errorType'] = 'unknown';
        let title = 'Request Failed';

        if (errorInfo.statusCode === 401 || errorInfo.message.toLowerCase().includes('api key')) {
          errorType = 'authentication';
          title = 'Authentication Error';
        } else if (errorInfo.statusCode === 429 || errorInfo.message.toLowerCase().includes('rate limit')) {
          errorType = 'rate_limit';
          title = 'Rate Limit Exceeded';
        } else if (errorInfo.message.toLowerCase().includes('quota')) {
          errorType = 'quota';
          title = 'Quota Exceeded';
        } else if (errorInfo.statusCode >= 500) {
          errorType = 'network';
          title = 'Server Error';
        }

        if (errorInfo.message.includes('Overloaded')) {
          errorType = 'network'; // Or a new 'overloaded' type if LlmErrorAlertType supports it. 'network' is safe fallback.
          title = 'Model Overloaded';
        }

        logStore.logError(`${context} request failed`, error, {
          component: 'Chat',
          action: 'request',
          error: errorInfo.message,
          context,
          retryable: errorInfo.isRetryable,
          errorType,
          provider: provider.name,
        });

        // Create API error alert
        setLlmErrorAlert({
          type: 'error',
          title,
          description: errorInfo.message,
          provider: provider.name,
          errorType,
        });
        setData([]);
      },
      [provider.name, stop],
    );

    const clearApiErrorAlert = useCallback(() => {
      setLlmErrorAlert(undefined);
    }, []);

    useEffect(() => {
      const textarea = textareaRef.current;

      if (textarea) {
        textarea.style.height = 'auto';

        const scrollHeight = textarea.scrollHeight;

        textarea.style.height = `${Math.min(scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
        textarea.style.overflowY = scrollHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
      }
    }, [input, textareaRef]);

    const runAnimation = async () => {
      if (chatStarted) {
        return;
      }

      chatStore.setKey('started', true);

      setChatStarted(true);
    };

    // Helper function to create message parts array from text and images
    const createMessageParts = (text: string, images: string[] = []): Array<TextUIPart | FileUIPart> => {
      // Create an array of properly typed message parts
      const parts: Array<TextUIPart | FileUIPart> = [
        {
          type: 'text',
          text,
        },
      ];

      // Add image parts if any
      images.forEach((imageData) => {
        // Extract correct MIME type from the data URL
        const mimeType = imageData.split(';')[0].split(':')[1] || 'image/jpeg';

        // Create file part according to AI SDK format
        parts.push({
          type: 'file',
          mimeType,
          data: imageData.replace(/^data:image\/[^;]+;base64,/, ''),
        });
      });

      return parts;
    };

    // Helper function to convert File[] to Attachment[] for AI SDK
    const filesToAttachments = async (files: File[]): Promise<Attachment[] | undefined> => {
      if (files.length === 0) {
        return undefined;
      }

      const attachments = await Promise.all(
        files.map(
          (file) =>
            new Promise<Attachment>((resolve) => {
              const reader = new FileReader();

              reader.onloadend = () => {
                resolve({
                  name: file.name,
                  contentType: file.type,
                  url: reader.result as string,
                });
              };
              reader.readAsDataURL(file);
            }),
        ),
      );

      return attachments;
    };

    const handleSendMessage = async (_event: React.UIEvent, messageInput?: string) => {
      const messageContent = messageInput || input;

      if (!messageContent?.trim()) {
        return;
      }

      if (isLoading) {
        abort();
        return;
      }

      let finalMessageContent = messageContent;

      if (selectedElement) {
        console.log('Selected Element:', selectedElement);

        const elementInfo = `<div class=\"__afSelectedElement__\" data-element='${JSON.stringify(selectedElement)}'>${JSON.stringify(`${selectedElement.displayText}`)}</div>`;
        finalMessageContent = messageContent + elementInfo;
      }

      runAnimation();

      if (!chatStarted) {
        setFakeLoading(true);

        // CRITICAL: Detect Design Wizard handoff - force load Expo template
        // Check if we have design scheme data (from wizard) but no files loaded yet
        const isDesignWizardHandoff = designScheme?.step1?.appName && Object.keys(files).length === 0;
        const shouldForceExpoTemplate = isDesignWizardHandoff;

        if (autoSelectTemplate || shouldForceExpoTemplate) {
          // If coming from Design Wizard, force Expo template
          // Otherwise, let AI select the template
          const { template, title } = shouldForceExpoTemplate
            ? { template: 'Expo App', title: designScheme.step1.appName || 'Mobile App' }
            : await selectStarterTemplate({
                message: finalMessageContent,
                model,
                provider,
              });

          if (template !== 'blank') {
            const temResp = await getTemplates(template, title).catch((e) => {
              if (e.message.includes('rate limit')) {
                toast.warning('Rate limit exceeded. Skipping starter template\n Continuing with blank template');
              } else {
                toast.warning('Failed to import starter template\n Continuing with blank template');
              }

              return null;
            });

            if (temResp) {
              const { assistantMessage, userMessage } = temResp;
              const userMessageText = `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${finalMessageContent}`;

              setMessages([
                {
                  id: `1-${new Date().getTime()}`,
                  role: 'user',
                  content: userMessageText,
                  parts: createMessageParts(userMessageText, imageDataList),
                },
                {
                  id: `2-${new Date().getTime()}`,
                  role: 'assistant',
                  content: assistantMessage,
                },
                {
                  id: `3-${new Date().getTime()}`,
                  role: 'user',
                  content: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${userMessage}`,
                  annotations: ['hidden'],
                },
              ]);

              const reloadOptions =
                uploadedFiles.length > 0
                  ? { experimental_attachments: await filesToAttachments(uploadedFiles) }
                  : undefined;

              if (typeof reload === 'function') {
                reload(reloadOptions);
              } else {
                console.warn('reload function is not available');
              }

              setInput('');
              Cookies.remove(PROMPT_COOKIE_KEY);

              setUploadedFiles([]);
              setImageDataList([]);

              resetEnhancer();

              textareaRef.current?.blur();
              setFakeLoading(false);

              return;
            }
          }
        }

        // If autoSelectTemplate is disabled or template selection failed, proceed with normal message
        const userMessageText = `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${finalMessageContent}`;
        const attachments = uploadedFiles.length > 0 ? await filesToAttachments(uploadedFiles) : undefined;

        // AI SDK 6.0: Send message with parts
        append({
          parts: createMessageParts(userMessageText, imageDataList),
          // @ts-ignore - experimental_attachments not in types yet
          experimental_attachments: attachments,
        });

        setFakeLoading(false);
        setInput('');
        Cookies.remove(PROMPT_COOKIE_KEY);

        setUploadedFiles([]);
        setImageDataList([]);

        resetEnhancer();

        textareaRef.current?.blur();

        return;
      }

      if (error != null) {
        setMessages(messages.slice(0, -1));
      }

      const modifiedFiles = workbenchStore.getModifiedFiles();

      chatStore.setKey('aborted', false);

      if (modifiedFiles !== undefined) {
        const userUpdateArtifact = filesToArtifacts(modifiedFiles, `${Date.now()}`);
        const messageText = `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${userUpdateArtifact}${finalMessageContent}`;

        const attachmentOptions =
          uploadedFiles.length > 0 ? { experimental_attachments: await filesToAttachments(uploadedFiles) } : undefined;

        append({
          parts: createMessageParts(messageText, imageDataList),
          // @ts-ignore - experimental_attachments not in types yet
          ...attachmentOptions,
        });

        workbenchStore.resetAllFileModifications();
      } else {
        const messageText = `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${finalMessageContent}`;

        const attachmentOptions =
          uploadedFiles.length > 0 ? { experimental_attachments: await filesToAttachments(uploadedFiles) } : undefined;

        append({
          parts: createMessageParts(messageText, imageDataList),
          // @ts-ignore - experimental_attachments not in types yet
          ...attachmentOptions,
        });
      }

      setInput('');
      Cookies.remove(PROMPT_COOKIE_KEY);

      setUploadedFiles([]);
      setImageDataList([]);

      resetEnhancer();

      textareaRef.current?.blur();
    };

    // Use local state for input to ensure responsiveness even if useChat is initializing
    const [localInput, setLocalInput] = useState(input);

    // Sync local input with useChat input when possible, but prioritize local interactions
    useEffect(() => {
      if (input && input !== localInput && localInput === '') {
        setLocalInput(input);
      }
    }, [input]);

    /**
     * Handles the change event for the textarea and updates the input state.
     * @param event - The change event from the textarea.
     */
    const onTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      setLocalInput(newValue);

      // Try to sync with useChat if available
      if (typeof handleInputChange === 'function') {
        handleInputChange(event);
      } else if (typeof setInput === 'function') {
        setInput(newValue);
      }
    };

    /**
     * Debounced function to cache the prompt in cookies.
     * Caches the trimmed value of the textarea input after a delay to optimize performance.
     */
    const debouncedCachePrompt = useCallback(
      debounce((event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const trimmedValue = event.target.value.trim();
        Cookies.set(PROMPT_COOKIE_KEY, trimmedValue, { expires: 30 });
      }, 1000),
      [],
    );

    useEffect(() => {
      const storedApiKeys = Cookies.get('apiKeys');

      if (storedApiKeys) {
        setApiKeys(JSON.parse(storedApiKeys));
      }
    }, []);

    const handleModelChange = (newModel: string) => {
      setModel(newModel);
      Cookies.set('selectedModel', newModel, { expires: 30 });
    };

    const handleProviderChange = (newProvider: ProviderInfo) => {
      setProvider(newProvider);
      Cookies.set('selectedProvider', newProvider.name, { expires: 30 });
    };

    // Redundant local state for messages in case useChat fails
    const [localMessages, setLocalMessages] = useState<Message[]>(initialMessages);
    const [isManualSending, setIsManualSending] = useState(false);

    // Sync local messages with useChat messages when available and valid
    useEffect(() => {
      if (messages && messages.length > 0) {
        setLocalMessages(messages);
      }
    }, [messages]);

    const manualAppend = async (message: Message) => {
      setIsManualSending(true);

      const newMessages = [...localMessages, message];
      setLocalMessages(newMessages);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages,
            apiKeys,
            files,
            promptId,
            contextOptimization: contextOptimizationEnabled,
            chatMode,
            designScheme,
            maxLLMSteps: mcpSettings.maxLLMSteps,
            supabase: {
              isConnected: supabaseConn.isConnected,
              hasSelectedProject: !!selectedProject,
              credentials: {
                supabaseUrl: supabaseConn?.credentials?.supabaseUrl,
                anonKey: supabaseConn?.credentials?.anonKey,
              },
            },
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error('Failed to send message');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = { id: `ai-${Date.now()}`, role: 'assistant', content: '' } as Message;

        // Add placeholder assistant message
        setLocalMessages([...newMessages, assistantMessage]);

        let buffer = '';

        const processChunk = (line: string) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return;

          try {
            if (trimmedLine.startsWith('0:')) {
              const text = JSON.parse(trimmedLine.substring(2));
              if (typeof text === 'string') {
                assistantMessage.content += text;
              }
            } else if (trimmedLine.startsWith('2:')) {
              // Protocol 2: Data/Progress
            } else if (trimmedLine.startsWith('3:')) {
              const error = JSON.parse(trimmedLine.substring(2));
              console.error('S: Error', error);
              toast.error(`Stream error: ${error}`);
              assistantMessage.content += `\n[Error: ${error}]\n`;
            }
          } catch (e) {
            console.error('Error parsing line:', trimmedLine, e);
          }
        };

        while (true) {
          const { done, value } = await reader.read();

          if (value) {
            buffer += decoder.decode(value, { stream: !done });
          }

          if (done) {
            // Process any remaining buffer
            if (buffer.trim()) {
              processChunk(buffer);
            }
            break;
          }

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            processChunk(line);
          }

          setLocalMessages([...newMessages, { ...assistantMessage }]);
        }
      } catch (err) {
        console.error('Manual send failed', err);
        toast.error('Failed to send message manually');
      } finally {
        setIsManualSending(false);
      }
    };

    return (
      <BaseChat
        ref={animationScope}
        textareaRef={textareaRef}
        input={localInput} // Use local input state
        showChat={showChat}
        chatStarted={chatStarted}
        isStreaming={isLoading || fakeLoading || isManualSending}
        onStreamingChange={(streaming) => {
          streamingState.set(streaming);
        }}
        enhancingPrompt={enhancingPrompt}
        promptEnhanced={promptEnhanced}
        sendMessage={(e, msg) => {
          const messageContent = msg || localInput;

          // Ensure we clear local input on send if not handled by sendMessage internally
          if (!msg && localInput) {
            setLocalInput('');
          }

          // Check if we can use standard handleSendMessage or need manual
          if (typeof sendMessage === 'function' && typeof append === 'function') {
            handleSendMessage(e, messageContent);
          } else {
            // Fallback to manual
            const usrMsg: Message = { id: `user-${Date.now()}`, role: 'user', content: messageContent };
            manualAppend(usrMsg);
          }
        }}
        model={model}
        setModel={handleModelChange}
        provider={provider}
        setProvider={handleProviderChange}
        providerList={activeProviders}
        handleInputChange={(e) => {
          onTextareaChange(e);
          debouncedCachePrompt(e);
        }}
        handleStop={abort}
        description={description}
        importChat={importChat}
        exportChat={exportChat}
        messages={parsedMessages.length > 0 ? parsedMessages : (messages && messages.length > 0 ? messages : localMessages)}
        enhancePrompt={() => {
          enhancePrompt(
            localInput, // Use local input
            (newInput) => {
              setInput(newInput);
              setLocalInput(newInput); // Update local state
              scrollTextArea();
            },
            model,
            provider,
            apiKeys,
          );
        }}
        uploadedFiles={uploadedFiles}
        setUploadedFiles={setUploadedFiles}
        imageDataList={imageDataList}
        setImageDataList={setImageDataList}
        actionAlert={actionAlert}
        clearAlert={() => workbenchStore.clearAlert()}
        supabaseAlert={supabaseAlert}
        clearSupabaseAlert={() => workbenchStore.clearSupabaseAlert()}
        deployAlert={deployAlert}
        clearDeployAlert={() => workbenchStore.clearDeployAlert()}
        llmErrorAlert={llmErrorAlert}
        clearLlmErrorAlert={clearApiErrorAlert}
        data={chatData}
        chatMode={chatMode}
        setChatMode={setChatMode}
        append={typeof append === 'function' ? append : manualAppend}
        designScheme={designScheme}
        setDesignScheme={setDesignScheme}
        selectedElement={selectedElement}
        setSelectedElement={setSelectedElement}
        addToolResult={addToolResult}
      />
    );
  },
);
