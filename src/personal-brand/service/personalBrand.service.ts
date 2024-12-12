import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { OpenAIService } from 'src/gpt/service/gpt.service';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserInfoEntity } from 'src/entities/infomation.entity';
import { Repository } from 'typeorm';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { UpdateInfoBodyDto } from '../dtos/upload.dto';

@Injectable()
export class PersonalBrandService {
  constructor(
    private readonly openAIService: OpenAIService,
    private readonly configService: ConfigService,
    @InjectRepository(UserInfoEntity)
    private readonly repo: Repository<UserInfoEntity>,
  ) {}

  async processCV(
    file: Express.Multer.File,
    user: UserIdentity,
    body: UpdateInfoBodyDto,
  ) {
    const fileExt = path.extname(file.originalname);
    const dirName =
      this.configService.get('app.uploadDir') + '/' + user.id + '/';
    const fileName = dirName + randomUUID() + fileExt;
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }
    fs.writeFileSync(fileName, file.buffer);

    const currentInfo = await this.getUserInfo(user);
    if (!currentInfo) {
      const cv = new UserInfoEntity();
      cv.cvPath = fileName;
      cv.userId = user.id;
      cv.activeStep = 1;
      cv.branchName = body.branchName;
      cv.job = body.job;
      return await this.repo.save(cv);
    } else {
      currentInfo.cvPath = fileName;
      currentInfo.userId = user.id;
      currentInfo.activeStep = 1;
      currentInfo.branchName = body.branchName;
      currentInfo.job = body.job;

      return await this.repo.save(currentInfo);
    }
  }

  async getUserInfo(currentUser: UserIdentity) {
    return await this.repo.findOne({
      where: {
        userId: currentUser.id,
      },
    });
  }

  async processAnswers(userAnswers: string, user: UserIdentity) {
    await this.repo.update({ userId: user.id }, { job: userAnswers });
    const cv = await this.repo.findOne({ where: { userId: user.id } });
    return this.openAIService.getBrandingStrategy(cv.cvPath, userAnswers);
  }

  async update(user: UserIdentity, body: UpdateInfoBodyDto) {
    const { questions } = body;
    const currentInfo = await this.getUserInfo(user);
    currentInfo.questions = questions;
    currentInfo.activeStep = 2;
    return await this.repo.save(currentInfo);
  }

  async getFinal(user: UserIdentity) {
    const currentInfo = await this.getUserInfo(user);
    const cv = fs.readFileSync(currentInfo.cvPath, 'utf8');
    return await this.openAIService.getBrandingStrategy(
      cv,
      currentInfo.questions,
    );
  }
}
