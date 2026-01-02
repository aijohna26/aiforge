import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class OpenAIProvider extends BaseProvider {
  name = 'OpenAI';
  getApiKeyLink = 'https://platform.openai.com/api-keys';

  config = {
    apiTokenKey: 'OPENAI_API_KEY',
  };

  staticModels: ModelInfo[] = [
    // GPT-5.2 models (newest)
    {
      name: 'gpt-5.2',
      label: 'GPT-5.2',
      provider: 'OpenAI',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 100000,
    },
    {
      name: 'gpt-5.2-pro',
      label: 'GPT-5.2 Pro',
      provider: 'OpenAI',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 100000,
    },
    {
      name: 'gpt-5.2-chat-latest',
      label: 'GPT-5.2 Chat Latest',
      provider: 'OpenAI',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 100000,
    },
    {
      name: 'gpt-5.1-codex-max',
      label: 'GPT-5.1 Codex Max',
      provider: 'OpenAI',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 100000,
    },
    {
      name: 'gpt-5-mini',
      label: 'GPT-5 Mini',
      provider: 'OpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 65000,
    },
    {
      name: 'gpt-5-nano',
      label: 'GPT-5 Nano',
      provider: 'OpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 32000,
    },

    // GPT-4o (for compatibility)
    {
      name: 'gpt-4o',
      label: 'GPT-4o (128k)',
      provider: 'OpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 16000,
    },
    {
      name: 'gpt-4o-mini',
      label: 'GPT-4o Mini (128k)',
      provider: 'OpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 16000,
    },

    // GPT-4 Turbo
    {
      name: 'gpt-4-turbo',
      label: 'GPT-4 Turbo (128k)',
      provider: 'OpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 4096,
    },

    // GPT-3.5 Turbo
    {
      name: 'gpt-3.5-turbo',
      label: 'GPT-3.5 Turbo (16k)',
      provider: 'OpenAI',
      maxTokenAllowed: 16385,
      maxCompletionTokens: 4096,
    },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    // Return empty array - we only use static models (10 models total)
    return [];
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'OPENAI_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const openai = createOpenAI({
      apiKey,
    });

    return openai(model);
  }
}
