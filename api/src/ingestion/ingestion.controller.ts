import { Controller, Post, Body, Param } from '@nestjs/common';
import { IngestionService } from './ingestion.service';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('url/:businessId')
  async ingestUrl(
    @Param('businessId') businessId: string,
    @Body() body: { url: string; maxDepth?: number; maxPages?: number },
  ) {
    return this.ingestionService.ingestUrl({
      url: body.url,
      businessId,
      maxDepth: body.maxDepth,
      maxPages: body.maxPages,
    });
  }

  @Post('text/:businessId')
  async ingestText(
    @Param('businessId') businessId: string,
    @Body() body: { sourceName: string; text: string },
  ) {
    const chunksAdded = await this.ingestionService.ingestText(
      businessId,
      body.sourceName,
      body.text,
    );

    return {
      source: body.sourceName,
      chunksAdded,
    };
  }
}
