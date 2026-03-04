export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  businessId: string;
  visitorId: string;
  messages: Message[];
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  websiteUrl: string | null;
  welcomeMessage: string | null;
  quickReplies: string[];
  config: {
    primaryColor?: string;
    position?: 'bottom-right' | 'bottom-left';
    bubbleIcon?: string;
  };
}

export interface ChatConfig {
  businessId: string;
  apiUrl?: string;
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  visitorId: string;
  businessId: string;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  suggestions?: string[];
}
