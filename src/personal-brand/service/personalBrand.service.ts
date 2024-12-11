import { Injectable } from '@nestjs/common';
import { OpenAIService } from 'src/gpt/service/gpt.service';

@Injectable()
export class PersonalBrandService {
  constructor(private openAIService: OpenAIService) {}

  async processCV(file: Express.Multer.File) {
    console.log('-----data-----', 'dsa');
  }
}
