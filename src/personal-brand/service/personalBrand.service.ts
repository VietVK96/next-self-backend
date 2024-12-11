import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import path from 'path';
import { OpenAIService } from 'src/gpt/service/gpt.service';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserInfoEntity } from 'src/entities/infomation.entity';
import { Repository } from 'typeorm';
import { UserIdentity } from 'src/common/decorator/auth.decorator';

@Injectable()
export class PersonalBrandService {
  constructor(
    private openAIService: OpenAIService,
    private configService: ConfigService,
    @InjectRepository(UserInfoEntity)
    private repo: Repository<UserInfoEntity>,
    
  ) {}

  async processCV(file: Express.Multer.File , userId : number) {
    const fileExt = path.extname(file.originalname);
    if (
      ![
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ].includes(file.mimetype)
    ) {
      return false;
    }
    const dirName =
      this.configService.get('app.uploadDir') + '/' + userId + '/';
    const fileName = dirName + randomUUID() + fileExt;
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }
    fs.writeFileSync(fileName, file.buffer);
    const cv = new UserInfoEntity();
    cv.cvPath = fileName;
    cv.userId = userId;
    await this.repo.save(cv);
  }

  async processAnswers(userAnswers: Record<string, any>, user: UserIdentity ){
    await this.repo.update({userId:user.id},{job:userAnswers})
    const cv = await this.repo.findOne({where:{userId: user.id}})
    return this.openAIService.getBrandingStrategy(cv.cvPath,userAnswers)
  }
}
