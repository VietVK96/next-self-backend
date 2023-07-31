export class PaymentMethodEnum {
  public static ESPECE = 'espece';
  public static CHEQUE = 'cheque';
  public static CARTE = 'carte';
  public static VIREMENT = 'virement';
  public static PRELEVEMENT = 'prelevement';

  public static choices = {
    [this.ESPECE]: 'Espèce',
    [this.CHEQUE]: 'Chèque',
    [this.CARTE]: 'Carte',
    [this.VIREMENT]: 'Virement',
    [this.PRELEVEMENT]: 'Prélèvement',
  };
}
