import { Injectable } from '@nestjs/common';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { FactureEmailDataDto } from 'src/dental/dto/facture.dto';
import { EmailAccountEntity } from 'src/entities/email-account.entity';
import { EmailOutgoingServerEntity } from 'src/entities/email-outgoing-server.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto-js';
import * as nodemailer from 'nodemailer';
import { env } from 'process';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailTransportService {
  constructor(private dataSource: DataSource) {}

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
      const decryptedUserName = crypto.AES.decrypt(
        emailOutgoingServer.username,
        env.SECRET_KEY_EMAIL,
      );
      emailOutgoingServer.username = decryptedUserName.toString(
        crypto.enc.Utf8,
      );
      const decryptedPassword = crypto.AES.decrypt(
        emailOutgoingServer.password,
        env.SECRET_KEY_EMAIL,
      );
      emailOutgoingServer.password = decryptedPassword.toString(
        crypto.enc.Utf8,
      );

      const transport = nodemailer.createTransport({
        host: emailOutgoingServer.hostname,
        secure: false,
        port: emailOutgoingServer.port,
        auth: {
          pass: emailOutgoingServer.password,
          user: emailOutgoingServer.username,
        },
      });

      return transport;
    } catch (e) {
      return new CBadRequestException(ErrorCode.FORBIDDEN);
    }
  }

  async sendEmail(userId: number, data: FactureEmailDataDto) {
    const transportInstance = await this.createTranspoter(userId);
    if (transportInstance instanceof CBadRequestException)
      return transportInstance;

    const mailOptions = {
      from: data?.from,
      to: data?.to,
      subject: data?.subject,
      html: data?.template,
      attachments: data?.attachments,
    };

    const result = await transportInstance.sendMail(mailOptions);
    if (result.rejected.length !== 0)
      return new CBadRequestException(ErrorCode.CANNOT_SEND_MAIL);
    return { success: true };
  }
}
