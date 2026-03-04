import { Injectable } from '@nestjs/common';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { WebScraper } from './web-scraper';

export interface IngestUrlOptions {
  url: string;
  businessId: string;
  maxDepth?: number;
  maxPages?: number;
}

export interface IngestResult {
  source: string;
  chunksAdded: number;
  pagesScraped: number;
}

@Injectable()
export class IngestionService {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  async ingestUrl(options: IngestUrlOptions): Promise<IngestResult> {
    const { url, businessId, maxDepth = 0, maxPages = 1 } = options;

    const scrapedPages = await WebScraper.scrapeWithDepth(url, maxDepth, maxPages);

    let totalChunks = 0;

    for (const page of scrapedPages) {
      const chunks = WebScraper.chunkText(page.content, 1000, 100);

      for (let i = 0; i < chunks.length; i++) {
        await this.knowledgeService.addChunk(businessId, 'web', page.url, chunks[i], page.url, {
          title: page.title,
          chunkIndex: i,
          totalChunks: chunks.length,
        });
      }

      totalChunks += chunks.length;
    }

    return {
      source: url,
      chunksAdded: totalChunks,
      pagesScraped: scrapedPages.length,
    };
  }

  async ingestText(businessId: string, sourceName: string, text: string): Promise<number> {
    const chunks = WebScraper.chunkText(text, 1000, 100);

    for (let i = 0; i < chunks.length; i++) {
      await this.knowledgeService.addChunk(
        businessId,
        'document',
        sourceName,
        chunks[i],
        undefined,
        {
          chunkIndex: i,
          totalChunks: chunks.length,
        },
      );
    }

    return chunks.length;
  }
}
