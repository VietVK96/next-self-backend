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
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';

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

    let summarizeCV = null;
    if (file) {
      if (fileExt.toLocaleLowerCase() === '.pdf') {
        const cv = await pdfParse(file.buffer);
        summarizeCV = await this.openAIService.summarizeCV(cv.text);
      } else if (
        fileExt.toLocaleLowerCase() === '.doc' ||
        fileExt.toLocaleLowerCase() === '.docx'
      ) {
        const docData = await mammoth.extractRawText({ buffer: file.buffer });
        summarizeCV = docData.value;
      } else {
        throw new CBadRequestException('File invalid!');
      }
    }
    const currentInfo = await this.getUserInfo(user);
    const brandPlatform = JSON.stringify(body);
    if (!currentInfo) {
      const cv = new UserInfoEntity();
      cv.cvPath = fileName;
      cv.userId = user.id;
      cv.activeStep = 1;
      cv.summarizeCV = summarizeCV;
      cv.brandPlatform = brandPlatform;
      cv.originalname = file?.originalname ?? null;
      return await this.repo.save(cv);
    } else {
      currentInfo.cvPath = fileName;
      currentInfo.userId = user.id;
      currentInfo.activeStep = 1;
      currentInfo.summarizeCV = summarizeCV;
      currentInfo.brandPlatform = brandPlatform;
      currentInfo.originalname = file?.originalname ?? null;
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
    let summarizeCV = currentInfo?.summarizeCV;
    if (!summarizeCV) {
      let brandPlatform: string | UpdateInfoBodyDto = currentInfo.brandPlatform;
      if (typeof brandPlatform === 'string') {
        brandPlatform = JSON.parse(brandPlatform) as UpdateInfoBodyDto;
      }

      summarizeCV = `
      I am ${brandPlatform.title} in ${brandPlatform.technique} field, i want to ${brandPlatform?.goals}
      `;
    }
    return await this.openAIService.getBrandingStrategy(
      summarizeCV,
      currentInfo.questions,
    );
  }
}
