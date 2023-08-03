import { Injectable } from '@nestjs/common';
import { EmailAccountEntity } from 'src/entities/email-account.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { FindEmailSettingRes } from './response/find.email.res';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { EmailOutgoingServerEntity } from 'src/entities/email-outgoing-server.entity';
import { SaveEmailDto } from './dto/saveEmail.setting.dto';
import * as crypto from 'crypto-js';
import { env } from 'process';
import { InjectRepository } from '@nestjs/typeorm';

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

  async findById(emailId: number): Promise<EmailAccountEntity> {
    const email = await this.emailAccountRepo.findOne({
      where: { id: emailId },
    });
    if (!email) throw new CBadRequestException(ErrorCode.NOT_FOUND);
    delete email.MAX_ENTRIES;

    const emailOutgoingServer = await this.dataSource
      .getRepository(EmailOutgoingServerEntity)
      .findOne({
        where: { emailAccountId: emailId },
      });
    delete emailOutgoingServer.password;
    const decryptedPassword = crypto.DES.decrypt(
      emailOutgoingServer.username,
      env.SECRET_KEY_EMAIL,
    );
    emailOutgoingServer.username = decryptedPassword.toString(crypto.enc.Utf8);

    return {
      ...email,
      outgoingServer: emailOutgoingServer,
    };
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
        throw new CBadRequestException(ErrorCode.EXISTING_EMAIL);
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
      emailOutgoingServer.hostname = payload.outgoingServer.hostname;
      emailOutgoingServer.port = payload.outgoingServer.port;
      emailOutgoingServer.connectionEstablished = 1;
      emailOutgoingServer.username = crypto.DES.encrypt(
        payload.outgoingServer.username,
        env.SECRET_KEY_EMAIL,
      ).toString();
      emailOutgoingServer.password = crypto.DES.encrypt(
        payload.outgoingServer.password,
        env.SECRET_KEY_EMAIL,
      ).toString();
      await queryRunner.manager
        .getRepository(EmailOutgoingServerEntity)
        .save(emailOutgoingServer);

      const promises = [];
      if (payload?.subscribers && payload?.subscribers.length > 0) {
        await queryRunner.query(
          `DELETE FROM email_account_subscriber WHERE email_account_id = ?`,
          [emailId],
        );
        for (const userId of payload?.subscribers) {
          if (
            await this.dataSource
              .getRepository(UserEntity)
              .findOne({ where: { id: userId } })
          ) {
            promises.push(
              queryRunner.query(
                `INSERT INTO email_account_subscriber (email_account_id, user_id)
            VALUES (? , ?)`,
                [savedEmailAccount.id, userId],
              ),
            );
          } else {
            throw new CBadRequestException(ErrorCode.SAVE_FAILED);
          }
        }
      }
      await Promise.all(promises);

      await queryRunner.commitTransaction();
      return;
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
}
