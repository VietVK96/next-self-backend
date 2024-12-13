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
    userAnswers: string,
  ): Promise<any> {
    // Tạo message gồm system prompt (chạy ngầm), sau đó đưa cvSummary và câu trả lời người dùng vào user prompt
    const userPrompt = `
    Here is the CV summary:\n${cvSummary}\n
    Here are the user answers:\n${userAnswers}\n
    Please provide the personal branding strategy in JSON format as described.
    `;
    for (let index = 1; index < 10; index++) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        });

        // parse JSON từ response
        let strategyJson = response.choices[0].message?.content?.trim();
        strategyJson = strategyJson
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        return strategyJson ? JSON.parse(strategyJson) : null;
      } catch (err) {
        console.log('-----data-----', err);
        continue;
      }
    }
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
