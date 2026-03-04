import { Controller, Post, Get, Body, Param, HttpCode } from '@nestjs/common';
import { ChatService } from './chat.service';
import { LlmService } from '../llm/llm.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { BusinessService } from '../business/business.service';
import type { ChatRequest, ChatResponse } from '../common/schema';
import type { ChatMessage } from '../llm/providers/types';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly llmService: LlmService,
    private readonly knowledgeService: KnowledgeService,
    private readonly businessService: BusinessService,
  ) {}

  @Post()
  @HttpCode(200)
  async chat(@Body() body: ChatRequest): Promise<ChatResponse> {
    const { message, sessionId, visitorId, businessId } = body;

    let session;
    if (sessionId) {
      session = await this.chatService.getSession(sessionId);
    }

    if (!session) {
      session = await this.chatService.getOrCreateSession(businessId, visitorId);
    }

    await this.chatService.addMessage(session.id, 'user', message);

    const business = await this.businessService.findById(businessId);

    const relevantChunks = await this.knowledgeService.searchSimilar(businessId, message, 5);

    const systemPrompt = this.buildSystemPrompt(business, relevantChunks);

    const previousMessages = await this.chatService.getMessages(session.id);
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...previousMessages.slice(-10).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await this.llmService.complete({
      messages: chatMessages,
      temperature: 0.7,
      maxTokens: 1000,
    });

    await this.chatService.addMessage(session.id, 'assistant', response.content, {
      sources: relevantChunks.map((c) => c.sourceName),
    });

    return {
      message: response.content,
      sessionId: session.id,
    };
  }

  @Get('session/:sessionId/messages')
  async getMessages(@Param('sessionId') sessionId: string) {
    return this.chatService.getMessages(sessionId);
  }

  private buildSystemPrompt(
    business: { name: string; description: string | null } | undefined,
    chunks: Array<{ content: string; sourceName: string }>,
  ): string {
    const context = chunks.map((c) => c.content).join('\n\n');

    return `You are a helpful assistant for ${business?.name || 'a business'}${business?.description ? `. ${business.description}` : ''}.

Use the following context to answer questions. If you don't find the answer in the context, say you don't have that information but try to be helpful.

Context:
${context}

Be friendly, concise, and helpful. If asked about something not in the context, politely explain that you don't have that specific information.`;
  }
}
