import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_TOKEN, type Database } from '../common/database.module';
import { businesses } from '../common/schema';
import { KnowledgeService } from '../knowledge/knowledge.service';

@Injectable()
export class BusinessService {
  constructor(
    @Inject(DATABASE_TOKEN) private db: Database,
    private knowledgeService: KnowledgeService,
  ) {}

  async create(data: { name: string; slug: string; description?: string; websiteUrl?: string }) {
    const [business] = await this.db
      .insert(businesses)
      .values({
        name: data.name,
        slug: data.slug,
        description: data.description,
        websiteUrl: data.websiteUrl,
      })
      .returning();

    if (data.description) {
      try {
        await this.knowledgeService.addChunk(
          business.id,
          'business_profile',
          'Business Description',
          data.description,
        );
      } catch (error) {
        console.error('Failed to embed business description:', error); // eslint-disable-line no-console
      }
    }

    return business;
  }

  async findById(id: string) {
    const [business] = await this.db.select().from(businesses).where(eq(businesses.id, id));
    return business;
  }

  async findBySlug(slug: string) {
    const [business] = await this.db.select().from(businesses).where(eq(businesses.slug, slug));
    return business;
  }

  async findAll() {
    return this.db.select().from(businesses);
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string;
      websiteUrl: string;
      welcomeMessage: string;
      quickReplies: string[];
      config: Record<string, unknown>;
    }>,
  ) {
    const [business] = await this.db
      .update(businesses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(businesses.id, id))
      .returning();
    return business;
  }

  async delete(id: string) {
    await this.knowledgeService.deleteByBusiness(id);
    await this.db.delete(businesses).where(eq(businesses.id, id));
  }
}
