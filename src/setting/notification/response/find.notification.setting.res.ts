import { AddressEntity } from 'src/entities/address.entity';
import { UserEntity } from 'src/entities/user.entity';

export class FindNotificationRes {
  user: {
    admin: number;
    group: {
      smsShared: number;
    };
  };
  smsQuantity: number;
  products: any;
  address: {
    allFieldsRequiredForBilling: boolean;
  };
}
