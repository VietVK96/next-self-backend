import { AddressEntity } from 'src/entities/address.entity';
import { UserEntity } from 'src/entities/user.entity';

export class FindNotificationDto {
  user: UserEntity;
  smsQuantity: number;
  products: any;
  address: AddressEntity;
}
