import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';

@Module({
  imports: [DatabaseModule, KnowledgeModule],
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
