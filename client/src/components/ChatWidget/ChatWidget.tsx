import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { Message } from '../Message/Message';
import { ChatInput } from '../ChatInput/ChatInput';
import type { ChatConfig } from '../../types';
import styles from './ChatWidget.module.scss';

interface ChatWidgetProps {
  config: ChatConfig;
  title?: string;
  welcomeMessage?: string;
  quickReplies?: string[];
}

export function ChatWidget({
  config,
  title = 'Chat',
  welcomeMessage = 'Hello! How can I help you today?',
  quickReplies = [],
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isLoading, error, sendMessage } = useChat(config);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const position = config.position || 'bottom-right';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (config.primaryColor) {
      document.documentElement.style.setProperty('--chat-primary-color', config.primaryColor);
    }
  }, [config.primaryColor]);

  const handleQuickReply = (reply: string) => {
    void sendMessage(reply);
  };

  return (
    <div
      className={`${styles.widgetContainer} ${styles[position === 'bottom-right' ? 'bottomRight' : 'bottomLeft']}`}
    >
      {isOpen && (
        <div
          className={`${styles.chatWindow} ${styles[position === 'bottom-right' ? 'bottomRight' : 'bottomLeft']}`}
        >
          <div className={styles.header}>
            <h3>{title}</h3>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className={styles.messagesContainer}>
            {messages.length === 0 ? (
              <div className={styles.emptyState}>
                <MessageCircle size={48} strokeWidth={1} />
                <p>{welcomeMessage}</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <Message key={msg.id} message={msg} />
                ))}
                {isLoading && (
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {messages.length === 0 && quickReplies.length > 0 && (
            <div className={styles.quickReplies}>
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  className={styles.quickReplyButton}
                  onClick={() => handleQuickReply(reply)}
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          <ChatInput onSend={sendMessage} disabled={isLoading} />
        </div>
      )}

      <button className={styles.bubbleButton} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
