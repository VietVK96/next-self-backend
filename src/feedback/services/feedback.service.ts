import { Injectable } from '@nestjs/common';

import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { MailTransportService } from 'src/mail/services/mailTransport.service';
import * as handlebars from 'handlebars';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import * as fs from 'fs';
import * as path from 'path';
import { ErrorCode } from 'src/constants/error';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private mailTransportService: MailTransportService,
    private configService: ConfigService,
  ) {}

  async sendFeedback(
    reateFeedback: CreateFeedbackDto,
    currentUser: UserIdentity,
    userAgent: string,
  ): Promise<{ success: boolean }> {
    const { type, message } = reateFeedback;
    let errorMessage = '';

    // Kiểm tra các tham số
    if (
      !['hotline', 'administratif', 'commercial', 'suggestion'].includes(type)
    ) {
      errorMessage = 'validation.exists';
    } else if (!message) {
      errorMessage = 'validation.required';
    }

    if (errorMessage) {
      throw new CBadRequestException(errorMessage);
    }

    const user = await this.userRepo.findOne({
      where: { id: currentUser.id },
    });

    if (!user) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND_DOCTOR);
    }

    const mailTo: string[] = this.configService.get<string[]>(
      `mailFeedBack.${type}`,
      [],
    );
    const hotlineMail = this.configService.get<string>(
      'mailFeedBack.hotlineMail',
    );
    mailTo.push(hotlineMail);

    const subject = `[weClever][${type.toUpperCase()}] Message envoyé par ${
      user.lastname + user.firstname
    }`;
    const tempFolder = this.configService.get<string>(
      'app.mail.folderTemplate',
    );
    const emailTemplate = fs.readFileSync(
      path.join(tempFolder, 'mail/feedback.hbs'),
      'utf-8',
    );
    const template = handlebars.compile(emailTemplate);
    const mailBody = template({
      user,
      feedback: {
        type,
        message,
      },
      server: userAgent,
    });

    const context = {
      server: userAgent,
      user,
      feedback: {
        type,
        message,
      },
    };

    const email = {
      from: user.email,
      to: mailTo,
      subject: subject,
      html: mailBody,
      context: context,
    };

    try {
      await this.mailTransportService.sendEmail(currentUser.id, email);
      return {
        success: true,
      };
    } catch (error) {
      throw new CBadRequestException(ErrorCode.CANNOT_SEND_MAIL);
    }
  }
}
