import { pgTable, uuid, text, timestamp, jsonb, vector, index, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  websiteUrl: text('website_url'),
  welcomeMessage: text('welcome_message').default('Hello! How can I help you today?'),
  quickReplies: jsonb('quick_replies').$type<string[]>().default([]),
  config: jsonb('config')
    .$type<{
      primaryColor?: string;
      position?: 'bottom-right' | 'bottom-left';
      bubbleIcon?: string;
    }>()
    .default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id')
    .references(() => businesses.id)
    .notNull(),
  visitorId: text('visitor_id').notNull(),
  metadata: jsonb('metadata')
    .$type<{
      userAgent?: string;
      referrer?: string;
      ipAddress?: string;
    }>()
    .default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .references(() => chatSessions.id)
    .notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata')
    .$type<{
      sources?: string[];
      confidence?: number;
    }>()
    .default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const knowledgeChunks = pgTable(
  'knowledge_chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .references(() => businesses.id)
      .notNull(),
    sourceType: text('source_type').notNull(),
    sourceUrl: text('source_url'),
    sourceName: text('source_name').notNull(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 768 }),
    metadata: jsonb('metadata')
      .$type<{
        pageNumber?: number;
        chunkIndex?: number;
      }>()
      .default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    embeddingIndex: index('embedding_index').using('hnsw', table.embedding.op('vector_cosine_ops')),
  }),
);

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id')
    .references(() => businesses.id)
    .notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  url: text('url'),
  status: text('status').notNull().default('pending'),
  chunkCount: text('chunk_count').default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;
export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
export type NewKnowledgeChunk = typeof knowledgeChunks.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export const businessesRelations = relations(businesses, ({ many }) => ({
  chatSessions: many(chatSessions),
  knowledgeChunks: many(knowledgeChunks),
  documents: many(documents),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  business: one(businesses, {
    fields: [chatSessions.businessId],
    references: [businesses.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [messages.sessionId],
    references: [chatSessions.id],
  }),
}));

export const knowledgeChunksRelations = relations(knowledgeChunks, ({ one }) => ({
  business: one(businesses, {
    fields: [knowledgeChunks.businessId],
    references: [businesses.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  business: one(businesses, {
    fields: [documents.businessId],
    references: [businesses.id],
  }),
}));

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
