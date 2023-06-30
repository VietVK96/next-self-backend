/**
 * application\Enum\ExceedingEnum.php line 1->34
 */
export class ExceedingEnum {
  public static ENTENTE_DIRECTE = 'D';
  public static EXIGENCE_PARTICULIERE = 'E';
  public static DEPLACEMENT_NON_PRESCRIT = 'F';
  public static GRATUIT = 'G';
  public static NON_REMBOURSABLE = 'N';
  public static AUTORISE = 'A';
  public static MAITRISE = 'M';
  public static AUTORISE_ENTENTE_DIRECTE = 'B';
  public static MAITRISE_EXIGENCE_PARTICULIERE = 'C';
  public static SMG = 'L';

  public static choices = {
    [this.ENTENTE_DIRECTE]: 'Entente directe',
    [this.EXIGENCE_PARTICULIERE]: 'Exigence particulière',
    [this.DEPLACEMENT_NON_PRESCRIT]:
      'Dépassement pour déplacement non prescrit',
    [this.GRATUIT]: 'Gratuit',
    [this.NON_REMBOURSABLE]: 'Non remboursable',
    [this.AUTORISE]: 'Autorisé',
    [this.MAITRISE]: 'Maîtrisé',
    [this.AUTORISE_ENTENTE_DIRECTE]: 'Autorisé et entente direct cumulés',
    [this.MAITRISE_EXIGENCE_PARTICULIERE]:
      'Maîtrisé et exigence particulière cumulés',
    [this.SMG]: 'Prestation soumise à accord de prise en charge SMG',
  };
}
