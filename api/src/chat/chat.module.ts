import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database.module';
import { LlmModule } from '../llm/llm.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { BusinessService } from '../business/business.service';

@Module({
  imports: [DatabaseModule, LlmModule, KnowledgeModule],
  controllers: [ChatController],
  providers: [ChatService, BusinessService],
  exports: [ChatService],
})
export class ChatModule {}
