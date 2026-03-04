import { Inject, Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_TOKEN, type Database } from '../common/database.module';
import { chatSessions, messages } from '../common/schema';

@Injectable()
export class ChatService {
  constructor(@Inject(DATABASE_TOKEN) private db: Database) {}

  async createSession(businessId: string, visitorId: string) {
    const [session] = await this.db
      .insert(chatSessions)
      .values({
        businessId,
        visitorId,
      })
      .returning();
    return session;
  }

  async getSession(sessionId: string) {
    const [session] = await this.db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId));
    return session;
  }

  async getOrCreateSession(businessId: string, visitorId: string) {
    const existing = await this.db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.businessId, businessId), eq(chatSessions.visitorId, visitorId)))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }
    return this.createSession(businessId, visitorId);
  }

  async addMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata: Record<string, unknown> = {},
  ) {
    const [message] = await this.db
      .insert(messages)
      .values({
        sessionId,
        role,
        content,
        metadata,
      })
      .returning();

    await this.db
      .update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, sessionId));

    return message;
  }

  async getMessages(sessionId: string) {
    return this.db.select().from(messages).where(eq(messages.sessionId, sessionId));
  }
}
