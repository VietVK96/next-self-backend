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
