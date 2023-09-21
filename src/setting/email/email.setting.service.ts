import { Injectable } from '@nestjs/common';
import { EmailAccountEntity } from 'src/entities/email-account.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { FindEmailSettingRes } from './response/find.email.res';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { EmailOutgoingServerEntity } from 'src/entities/email-outgoing-server.entity';
import { SaveEmailDto } from './dto/saveEmail.setting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import * as nodemailer from 'nodemailer';
import { HaliteEncryptorHelper } from 'src/common/lib/halite/encryptor.helper';

@Injectable()
export class EmailSettingService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(EmailAccountEntity)
    private emailAccountRepo: Repository<EmailAccountEntity>,
  ) {}

  async find(userId: number): Promise<FindEmailSettingRes> {
    const user = await this.dataSource.getRepository(UserEntity).findOne({
      where: { id: userId },
      relations: {
        emailAccounts: true,
        subscribedEmailAccounts: true,
      },
    });
    return {
      emailAccounts: user.emailAccounts,
      subscribedEmailAccounts: user.subscribedEmailAccounts,
    };
  }

  async findById(
    emailId: number,
    withPassword = false,
  ): Promise<EmailAccountEntity | CBadRequestException> {
    try {
      const email = await this.emailAccountRepo.findOne({
        where: { id: emailId },
        relations: {
          subscribers: true,
        },
      });
      if (!email) return new CBadRequestException(ErrorCode.NOT_FOUND);
      delete email.MAX_ENTRIES;

      const emailOutgoingServer = await this.dataSource
        .getRepository(EmailOutgoingServerEntity)
        .findOne({
          where: { emailAccountId: emailId },
        });

      const halite = new HaliteEncryptorHelper(process.env.HALITE_KEY);

      const decryptedUserName = halite.decrypt(emailOutgoingServer.username);
      if (emailOutgoingServer?.username)
        emailOutgoingServer.username = decryptedUserName;
      if (withPassword) {
        const decryptedPassword = halite.decrypt(emailOutgoingServer.password);
        if (emailOutgoingServer?.password)
          emailOutgoingServer.password = decryptedPassword;
      } else {
        delete emailOutgoingServer?.password;
      }

      email.subscribers = email.subscribers.map((user) => {
        return { id: user?.id };
      });

      return {
        ...email,
        outgoingServer: emailOutgoingServer,
      };
    } catch (e) {
      return new CBadRequestException(ErrorCode.FORBIDDEN);
    }
  }

  async save(
    userId: number,
    orgId: number,
    payload: SaveEmailDto,
    emailId?: number,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const emailAccount = new EmailAccountEntity();
      if (emailId) {
        emailAccount.id = emailId;
      } else if (
        await this.dataSource
          .getRepository(EmailAccountEntity)
          .findOne({ where: { USRId: userId } })
      ) {
        return new CBadRequestException(ErrorCode.EXISTING_EMAIL);
      }
      emailAccount.USRId = userId;
      emailAccount.organizationId = orgId;
      emailAccount.displayName = payload.displayName;
      emailAccount.emailAddress = payload.emailAddress;
      emailAccount.replyToAddress = payload.replyToAddress;
      const savedEmailAccount = await queryRunner.manager
        .getRepository(EmailAccountEntity)
        .save(emailAccount);

      let emailOutgoingServer: EmailOutgoingServerEntity;
      if (emailId) {
        emailOutgoingServer = await this.dataSource
          .getRepository(EmailOutgoingServerEntity)
          .findOne({ where: { emailAccountId: emailId } });
      } else {
        emailOutgoingServer = new EmailOutgoingServerEntity();
      }
      emailOutgoingServer.emailAccountId = savedEmailAccount.id;
      emailOutgoingServer.hostname =
        payload.outgoingServer.hostname || 'smtp.gmail.com';
      emailOutgoingServer.port = payload.outgoingServer.port || 587;
      emailOutgoingServer.connectionEstablished = 1;

      const halite = new HaliteEncryptorHelper(process.env.HALITE_KEY);
      emailOutgoingServer.username = halite.encrypt(
        payload.outgoingServer.username,
      );
      if (!emailId && payload?.outgoingServer?.password) {
        emailOutgoingServer.password = halite.encrypt(
          payload.outgoingServer.password,
        );
      }

      await queryRunner.manager
        .getRepository(EmailOutgoingServerEntity)
        .save(emailOutgoingServer);

      const promises = [];
      if (payload?.subscribers) {
        await queryRunner.query(
          `DELETE FROM email_account_subscriber WHERE email_account_id = ?`,
          [emailId],
        );
        for (const user of payload?.subscribers) {
          if (
            await this.dataSource
              .getRepository(UserEntity)
              .findOne({ where: { id: user.id } })
          ) {
            promises.push(
              queryRunner.query(
                `INSERT INTO email_account_subscriber (email_account_id, user_id)
            VALUES (? , ?)`,
                [savedEmailAccount.id, user.id],
              ),
            );
          } else {
            throw new CBadRequestException(ErrorCode.SAVE_FAILED);
          }
        }
      }
      await Promise.all(promises);

      await queryRunner.commitTransaction();
      return { success: true };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      return new CBadRequestException(ErrorCode.SAVE_FAILED);
    } finally {
      await queryRunner.release();
    }
  }

  async delete(emailId: number) {
    const email = await this.emailAccountRepo.findOne({
      where: { id: emailId },
    });
    if (!email) throw new CBadRequestException(ErrorCode.NOT_FOUND);
    else {
      delete email.MAX_ENTRIES;
      await this.emailAccountRepo.delete(emailId);
    }
    return;
  }

  async mailTester(mailId: number) {
    try {
      const mailInfo = await this.findById(mailId, true);
      console.log('mailTester => mailInfo', mailInfo);
      if (mailInfo instanceof CBadRequestException) {
        return mailInfo;
      }
      await this.sendMailTest(mailInfo, mailInfo.emailAddress);
      return {
        success: true,
      };
    } catch (e) {
      console.log('mailTester => e', e);
      return new CBadRequestException(ErrorCode.FORBIDDEN);
    }
  }
  async sendMailTest(mailInfo: EmailAccountEntity, email: string) {
    try {
      console.log('mailInfo', mailInfo);
      const transporter = nodemailer.createTransport({
        host: mailInfo.outgoingServer.hostname,
        secure: false,
        auth: {
          user: mailInfo.outgoingServer.username,
          pass: mailInfo.outgoingServer.password,
          // port: mailInfo.outgoingServer.port,
        },
      });

      const mailOptions = {
        from: `${mailInfo.displayName} <${mailInfo.outgoingServer.username}>`,
        to: email,
        subject: `Message de l'adresse électronique ${mailInfo.outgoingServer.username}`,
        text: `
      Félicitation, votre adresse électronique ${mailInfo.outgoingServer.username} est bien configurée - vos patients recevront desormais vos messages depuis cette adresse électronique.
      `,
      };
      console.log('mailOptions', mailOptions);
      await transporter.sendMail(mailOptions);
    } catch (e) {
      console.log('bug', e);
    }
  }
}
