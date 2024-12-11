import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { OpenAI } from 'openai';
import { UserEntity } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { systemPrompt } from '../data/systemPorm';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get('app.apiKey'),
    });
  }

  async getBrandingStrategy(
    cvSummary: string,
    userAnswers: Record<string, any>,
  ): Promise<any> {
    // Tạo message gồm system prompt (chạy ngầm), sau đó đưa cvSummary và câu trả lời người dùng vào user prompt
    const userPrompt = `
    Here is the CV summary:\n${cvSummary}\n
    Here are the user answers:\n${JSON.stringify(userAnswers, null, 2)}\n
    Please provide the personal branding strategy in JSON format as described.
    `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    // parse JSON từ response
    const strategyJson = response.choices[0].message?.content?.trim();
    return strategyJson ? JSON.parse(strategyJson) : null;
  }

  async summarizeCV(cvText: string): Promise<string> {
    // Gọi OpenAI để tóm tắt nội dung CV
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes CV content.',
        },
        { role: 'user', content: `Summarize the following CV:\n${cvText}` },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message?.content?.trim() || '';
  }
}
