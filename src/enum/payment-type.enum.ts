export class PaymentTypeEnum {
  public static SOLDE = 'solde';
  public static ACOMPTE = 'acompte';
  public static HONORAIRE = 'honoraire';
  public static REMBOURSEMENT = 'remboursement';

  public static choices = {
    [this.SOLDE]: 'Solde',
    [this.ACOMPTE]: 'Acompte',
    [this.HONORAIRE]: 'Honoraire',
    [this.REMBOURSEMENT]: 'Remboursement',
  };
}
