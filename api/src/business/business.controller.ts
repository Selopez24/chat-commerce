import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { BusinessService } from './business.service';

@Controller('businesses')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  async create(
    @Body()
    body: {
      name: string;
      slug: string;
      description?: string;
      websiteUrl?: string;
    },
  ) {
    return this.businessService.create(body);
  }

  @Get()
  async findAll() {
    return this.businessService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const business = await this.businessService.findById(id);
    if (!business) {
      throw new Error('Business not found');
    }
    return business;
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const business = await this.businessService.findBySlug(slug);
    if (!business) {
      throw new Error('Business not found');
    }
    return business;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      slug: string;
      description: string;
      websiteUrl: string;
      welcomeMessage: string;
      quickReplies: string[];
      config: Record<string, unknown>;
    }>,
  ) {
    return this.businessService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.businessService.delete(id);
    return { success: true };
  }
}
