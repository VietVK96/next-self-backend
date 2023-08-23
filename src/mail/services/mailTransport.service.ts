import { Injectable } from '@nestjs/common';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { FactureEmailDataDto } from 'src/dental/dto/facture.dto';
import { EmailAccountEntity } from 'src/entities/email-account.entity';
import { EmailOutgoingServerEntity } from 'src/entities/email-outgoing-server.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource } from 'typeorm';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { ConfigService } from '@nestjs/config';
import { HaliteEncryptorHelper } from 'src/common/lib/halite/encryptor.helper';
import Mail from 'nodemailer/lib/mailer';

@Injectable()
export class MailTransportService {
  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  async createTranspoter(
    userId: number,
  ): Promise<
    nodemailer.Transporter<SMTPTransport.SentMessageInfo> | CBadRequestException
  > {
    try {
      const user = await this.dataSource.getRepository(UserEntity).findOne({
        where: { id: userId },
        relations: {
          emailAccounts: true,
        },
      });

      if (!user) return new CBadRequestException(ErrorCode.ERROR_GET_USER);
      if (user.emailAccounts.length === 0)
        return new CBadRequestException(ErrorCode.NOT_FOUND_EMAIL_SETTING);

      const email: EmailAccountEntity = user.emailAccounts[0];
      const emailOutgoingServer = await this.dataSource
        .getRepository(EmailOutgoingServerEntity)
        .findOne({ where: { emailAccountId: email.id } });

      const key = this.configService.get<string>('app.haliteKey');
      const encryptFactory = new HaliteEncryptorHelper(key);

      emailOutgoingServer.username = encryptFactory.decrypt(
        emailOutgoingServer?.username,
      );
      emailOutgoingServer.password = encryptFactory.decrypt(
        emailOutgoingServer?.password,
      );
      const transport = nodemailer.createTransport({
        host: emailOutgoingServer.hostname,

        port: emailOutgoingServer.port,
        auth: {
          user: emailOutgoingServer.username,
          pass: emailOutgoingServer.password,
        },
      });

      return transport;
    } catch (e) {
      return new CBadRequestException(ErrorCode.FORBIDDEN);
    }
  }

  async sendEmail(userId: number, data: Mail.Options) {
    try {
      const transportInstance = await this.createTranspoter(userId);
      if (transportInstance instanceof CBadRequestException) {
        return transportInstance;
      }

      const result = await transportInstance.sendMail(data);
      if (result.rejected.length !== 0) {
        return new CBadRequestException(ErrorCode.CANNOT_SEND_MAIL);
      }
      return { success: true };
    } catch (error) {}
  }
}
