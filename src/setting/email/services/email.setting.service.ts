import { Injectable } from '@nestjs/common';
import { EmailAccountEntity } from 'src/entities/email-account.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class EmailSettingService {
  constructor(private dataSource: DataSource) {}

  async find(userId: number): Promise<{
    emailAccounts: EmailAccountEntity[];
    subscribedEmailAccounts: EmailAccountEntity[];
  }> {
    const user = await this.dataSource.getRepository(UserEntity).findOneOrFail({
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
}
