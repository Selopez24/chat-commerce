export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  name: string;
  complete(options: ChatCompletionOptions): Promise<ChatCompletionResponse>;
  completeStream?(
    options: ChatCompletionOptions,
    onChunk: (chunk: string) => void,
  ): Promise<ChatCompletionResponse>;
}

export interface EmbeddingProvider {
  name: string;
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}
