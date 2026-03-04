import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './common/database.module';
import { BusinessModule } from './business/business.module';
import { ChatModule } from './chat/chat.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { LlmModule } from './llm/llm.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    BusinessModule,
    ChatModule,
    IngestionModule,
    KnowledgeModule,
    LlmModule,
  ],
})
export class AppModule {}
