import { Injectable } from '@nestjs/common';

import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { MailTransportService } from 'src/mail/services/mailTransport.service';
import * as handlebars from 'handlebars';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private mailTransportService: MailTransportService,
  ) {}

  async sendFeedback(
    reateFeedback: CreateFeedbackDto,
    currentUser: UserIdentity,
    request,
  ): Promise<{ message: string }> {
    const { type, message } = reateFeedback;
    let errorMessage = '';

    try {
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

      const mailTo: string[] = [];

      const subject = `[e.cooDentist][${type.toUpperCase()}] Message envoyé par ${
        user.lastname + user.firstname
      }`;
      const templateFile = fs.readFileSync(
        path.resolve(__dirname, '../../templates/mail/feedback.hbs'),
        'utf-8',
      );
      const template = handlebars.compile(templateFile);
      const mailBody = template({
        user,
        feedback: {
          type,
          message,
        },
        server: request.server,
      });

      console.log('template', mailBody, {
        user,
        feedback: {
          type,
          message,
        },
        server: request.server,
      });

      const context = {
        server: request.server,
        user,
        feedback: {
          type,
          message,
        },
      };

      switch (type) {
        case 'suggestion':
          mailTo.push('eng@dentalviamedilor.com');
          mailTo.push('sales@dentalviamedilor.com');
          mailTo.push('formation@dentalviamedilor.com');
          break;
        case 'commercial':
          mailTo.push('sales@dentalviamedilor.com');
          break;
        case 'administratif':
          mailTo.push('admin@dentalviamedilor.com');
          break;
      }

      const email = {
        from: user.email,
        to: mailTo,
        subject: subject,
        template: mailBody,
        context: context,
      };

      const sentMail = await this.mailTransportService.sendEmail(
        currentUser.id,
        email,
      );

      return {
        message:
          'Le message a bien \u00e9t\u00e9 envoy\u00e9 au service concern\u00e9. 123',
      };
    } catch (error) {
      throw new CBadRequestException(errorMessage);
    }
  }
}
