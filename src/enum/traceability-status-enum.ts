export class TraceabilityStatusEnum {
  public static NONE = 0;
  public static UNFILLED = 1;
  public static FILLED = 2;

  public static choices = {
    [this.NONE]: 'Aucune',
    [this.UNFILLED]: 'Vide',
    [this.FILLED]: 'Remplie',
  };
}
