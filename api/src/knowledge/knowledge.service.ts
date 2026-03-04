import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, sql } from 'drizzle-orm';
import OpenAI from 'openai';
import { DATABASE_TOKEN, type Database } from '../common/database.module';
import { knowledgeChunks } from '../common/schema';
import { OllamaEmbeddingProvider } from '../llm/providers/ollama-embedding.provider';
import type { EmbeddingProvider } from '../llm/providers/types';

@Injectable()
export class KnowledgeService implements OnModuleInit {
  private openai: OpenAI | null = null;
  private ollama: OllamaEmbeddingProvider | null = null;
  private embeddingProvider!: EmbeddingProvider;

  constructor(
    @Inject(DATABASE_TOKEN) private db: Database,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    const provider = this.configService.get<string>('EMBEDDING_PROVIDER') || 'openai';

    if (provider === 'ollama') {
      const baseUrl = this.configService.get<string>('OLLAMA_BASE_URL') || 'http://localhost:11434';
      const model = this.configService.get<string>('OLLAMA_EMBEDDING_MODEL') || 'nomic-embed-text';
      this.ollama = new OllamaEmbeddingProvider(baseUrl, model);
      this.embeddingProvider = this.ollama;
    } else {
      this.embeddingProvider = {
        name: 'openai',
        generateEmbedding: async (text: string) => {
          const openai = this.getOpenAI();
          const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
          });
          return response.data[0].embedding;
        },
        generateEmbeddings: async (texts: string[]) => {
          const openai = this.getOpenAI();
          const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: texts,
          });
          return response.data.map((d) => d.embedding);
        },
      };
    }
  }

  private getOpenAI(): OpenAI {
    if (!this.openai) {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is required when using OpenAI embeddings');
      }
      this.openai = new OpenAI({ apiKey });
    }
    return this.openai;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.embeddingProvider.generateEmbedding(text);
  }

  async addChunk(
    businessId: string,
    sourceType: string,
    sourceName: string,
    content: string,
    sourceUrl?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const embedding = await this.generateEmbedding(content);

    await this.db.insert(knowledgeChunks).values({
      businessId,
      sourceType,
      sourceName,
      sourceUrl,
      content,
      embedding,
      metadata: metadata || {},
    });
  }

  async searchSimilar(
    businessId: string,
    query: string,
    limit: number = 5,
  ): Promise<Array<{ content: string; sourceName: string; similarity: number }>> {
    const queryEmbedding = await this.generateEmbedding(query);

    const results = await this.db.execute(sql`
      SELECT 
        content,
        source_name,
        1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
      FROM ${knowledgeChunks}
      WHERE business_id = ${businessId}
      ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT ${limit}
    `);

    return results.rows.map((row: Record<string, unknown>) => ({
      content: row.content as string,
      sourceName: row.source_name as string,
      similarity: row.similarity as number,
    }));
  }

  async deleteBySource(businessId: string, sourceName: string): Promise<void> {
    await this.db
      .delete(knowledgeChunks)
      .where(
        sql`${knowledgeChunks.businessId} = ${businessId} AND ${knowledgeChunks.sourceName} = ${sourceName}`,
      );
  }

  async deleteByBusiness(businessId: string): Promise<void> {
    await this.db.delete(knowledgeChunks).where(eq(knowledgeChunks.businessId, businessId));
  }

  async healthCheck(): Promise<{ provider: string; status: string; error?: string }> {
    try {
      if (this.ollama) {
        const healthy = await this.ollama.healthCheck();
        return {
          provider: 'ollama',
          status: healthy ? 'healthy' : 'unhealthy',
          error: healthy ? undefined : 'Cannot connect to Ollama',
        };
      }
      return {
        provider: 'openai',
        status: 'unknown',
        error: 'OpenAI health check not implemented',
      };
    } catch (error) {
      return {
        provider: this.embeddingProvider.name,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
