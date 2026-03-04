import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LLMProvider, ChatCompletionOptions, ChatCompletionResponse } from './providers/types';
import { DeepseekProvider } from './providers/deepseek.provider';

export const LLM_PROVIDER_TOKEN = 'LLM_PROVIDER';

@Injectable()
export class LlmService implements OnModuleInit {
  private provider!: LLMProvider;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const providerName = this.configService.get<string>('LLM_PROVIDER') || 'deepseek';
    this.provider = this.createProvider(providerName);
  }

  private createProvider(name: string): LLMProvider {
    switch (name) {
      case 'deepseek': {
        const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
        if (!apiKey) {
          throw new Error('DEEPSEEK_API_KEY is not configured');
        }
        const model = this.configService.get<string>('DEEPSEEK_MODEL') || 'deepseek-chat';
        return new DeepseekProvider(apiKey, model);
      }
      default:
        throw new Error(`Unknown LLM provider: ${name}`);
    }
  }

  async complete(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    return this.provider.complete(options);
  }

  async completeStream(
    options: ChatCompletionOptions,
    onChunk: (chunk: string) => void,
  ): Promise<ChatCompletionResponse> {
    if (!this.provider.completeStream) {
      const response = await this.provider.complete(options);
      onChunk(response.content);
      return response;
    }
    return this.provider.completeStream(options, onChunk);
  }

  getProviderName(): string {
    return this.provider.name;
  }
}
