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
import { SystemPromptEntity } from 'src/entities/system-pormt.entity';
import { UserEntity } from 'src/entities/user.entity';

@Injectable()
export class PersonalBrandService {
  constructor(
    private readonly openAIService: OpenAIService,
    private readonly configService: ConfigService,
    @InjectRepository(UserInfoEntity)
    private readonly repo: Repository<UserInfoEntity>,
    @InjectRepository(SystemPromptEntity)
    private readonly systemPromptRepo: Repository<SystemPromptEntity>,
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

  async getSystemPrompt() {
    return await this.systemPromptRepo.find();
  }

  async updateSystemPrompt(id: number, content: string) {
    const prompt = await this.systemPromptRepo.findOne({ where: { id } });
    await this.systemPromptRepo.update(prompt?.id, { content });
    const dirName = `./resources/system-prompt/${prompt.name}`;
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }
    fs.writeFileSync(
      path.join(dirName, `${prompt.name}.txt`),
      content,
      'utf-8',
    );
    return prompt;
  }

  async checkResultCV(currentUser: UserEntity) {
    const currentUserInfo = await this.repo.findOne({
      where: {
        userId: currentUser?.id,
      },
    });
    if (fs.existsSync(currentUserInfo.cvPath)) {
      const file = fs.readFileSync(currentUserInfo.cvPath);
      const fileExt = path.extname(currentUserInfo.originalname);
      if (file) {
        let summarizeCV = null;
        if (fileExt.toLocaleLowerCase() === '.pdf') {
          const cv = await pdfParse(file.buffer);
          summarizeCV = await this.openAIService.summarizeCV(cv.text);
        } else if (
          fileExt.toLocaleLowerCase() === '.doc' ||
          fileExt.toLocaleLowerCase() === '.docx'
        ) {
          const docData = await mammoth.extractRawText({ buffer: file });
          summarizeCV = docData.value;
        } else {
          throw new CBadRequestException('File invalid!');
        }
        return summarizeCV;
      }
    }
  }
}
