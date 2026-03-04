import { useState, useCallback, useRef, useEffect } from 'react';
import type { Message, ChatConfig } from '../types';
import { createChatApi } from '../services/chatApi';

const generateVisitorId = () => {
  const stored = localStorage.getItem('chat_visitor_id');
  if (stored) return stored;
  
  const id = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('chat_visitor_id', id);
  return id;
};

export function useChat(config: ChatConfig) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const visitorIdRef = useRef<string>(generateVisitorId());
  const api = useRef(createChatApi(config.apiUrl));

  useEffect(() => {
    api.current = createChatApi(config.apiUrl);
  }, [config.apiUrl]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.current.sendMessage({
        message: content.trim(),
        sessionId: sessionId || undefined,
        visitorId: visitorIdRef.current,
        businessId: config.businessId,
      });

      const assistantMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response.message,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSessionId(response.sessionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [config.businessId, sessionId, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, []);

  return {
    messages,
    sessionId,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
