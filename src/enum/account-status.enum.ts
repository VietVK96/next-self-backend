export class AccountStatusEnum {
  public static TRIAL = 0;
  public static CLIENT = 1;
  public static DEALER = 3;
  public static TESTER = 4;
  public static TERMINATED = 5;

  public static choices = {
    [this.TRIAL]: 'Prospect',
    [this.CLIENT]: 'Client',
    [this.DEALER]: 'Revendeur',
    [this.TESTER]: 'Testeur',
    [this.TERMINATED]: 'Résilié',
  };
}
