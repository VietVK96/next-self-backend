import { EmailAccountEntity } from 'src/entities/email-account.entity';

export class FindEmailSettingRes {
  emailAccounts: EmailAccountEntity[];
  subscribedEmailAccounts: EmailAccountEntity[];
}
