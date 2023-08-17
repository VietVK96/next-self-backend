/**
 * application/Enum/ThirdPartyStatusEnum.php
 */
export class ThirdPartyStatusEnum {
  public static WAITING = 'WTN';
  public static INCOMPLETE = 'INK';
  public static PAID = 'PYD';
  public static REJECTED = 'RJT';

  public static choices = {
    [this.WAITING]: 'En attente',
    [this.INCOMPLETE]: 'Incomplet',
    [this.PAID]: 'Payé',
    [this.REJECTED]: 'Rejeté',
  };
}
