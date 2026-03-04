import type { ChatRequest, ChatResponse, Business } from '../types';

const DEFAULT_API_URL = 'http://localhost:3001';

export class ChatApi {
  private apiUrl: string;

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || DEFAULT_API_URL;
  }

  async sendMessage(data: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.apiUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getBusiness(slug: string): Promise<Business> {
    const response = await fetch(`${this.apiUrl}/businesses/slug/${slug}`);

    if (!response.ok) {
      throw new Error(`Business API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getSessionMessages(sessionId: string): Promise<ChatResponse[]> {
    const response = await fetch(`${this.apiUrl}/chat/session/${sessionId}/messages`);

    if (!response.ok) {
      throw new Error(`Session API error: ${response.statusText}`);
    }

    return response.json();
  }
}

export const createChatApi = (apiUrl?: string) => new ChatApi(apiUrl);
