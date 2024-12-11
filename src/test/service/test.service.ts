/**
 * Repositories/Group.php
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { OpenAI } from 'openai';

@Injectable()
export class TestService {
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

  async test() {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'hôm nay là thứ mấy?' }],
        max_tokens: 100,
      });
      return response.choices[0].message.content || 'No response';
    } catch (error) {
      console.error('Error with OpenAI API:', error);
      throw error;
    }
  }
}
