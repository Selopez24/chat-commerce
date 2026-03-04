import type { Message as MessageType } from '../../types';
import styles from './Message.module.scss';

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  return (
    <div className={`${styles.message} ${styles[message.role]}`}>
      <div className={styles.bubble}>
        <div className={styles.content}>{message.content}</div>
        <div className={styles.timestamp}>
          {new Date(message.createdAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}
