import { Injectable } from '@nestjs/common';
import { EmailAccountEntity } from 'src/entities/email-account.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource } from 'typeorm';
import { FindEmailSettingRes } from '../response/find.email.res';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { EmailOutgoingServerEntity } from 'src/entities/email-outgoing-server.entity';
import { SaveEmailDto } from '../dto/saveEmail.setting.dto';
import * as crypto from 'crypto-js';
import { env } from 'process';

@Injectable()
export class EmailSettingService {
  constructor(private dataSource: DataSource) {}

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
    const email = await this.dataSource
      .getRepository(EmailAccountEntity)
      .findOne({
        where: { id: emailId },
      });
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

  async create(userId: number, orgId: number, payload: SaveEmailDto) {
    if (
      await this.dataSource
        .getRepository(EmailAccountEntity)
        .findOne({ where: { USRId: userId } })
    ) {
      throw new CBadRequestException(ErrorCode.EXISTING_EMAIL);
    }
    const emailAccount = new EmailAccountEntity();
    emailAccount.USRId = userId;
    emailAccount.organizationId = orgId;
    emailAccount.displayName = payload.displayName;
    emailAccount.emailAddress = payload.emailAddress;
    emailAccount.replyToAddress = payload.replyToAddress;
    const savedEmailAccount = await this.dataSource
      .getRepository(EmailAccountEntity)
      .save(emailAccount);

    const emailOutgoingServer = new EmailOutgoingServerEntity();
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
    await this.dataSource
      .getRepository(EmailOutgoingServerEntity)
      .save(emailOutgoingServer);
    return;
  }

  // async edit() {

  // }
}
