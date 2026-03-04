import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';

@Module({
  imports: [DatabaseModule, KnowledgeModule],
  controllers: [BusinessController],
  providers: [BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}
