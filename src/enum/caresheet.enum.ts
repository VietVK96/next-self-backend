/**
 * application/Enum/CaresheetModeEnum.php
 */
export class CaresheetModeEnum {
  public static SESAM_VITALE = 'SV';
  public static DEGRADE = 'DEG';
  public static SESAM_SANS_VITALE = 'SSV';
  public static DESYNCHRONISEE = 'DES';
  public static PAPIER = 'PPR';

  public static choices = {
    [this.SESAM_VITALE]: 'Sesam-Vitale',
    [this.DEGRADE]: 'Dégradé',
    [this.SESAM_SANS_VITALE]: 'Sesam sans vitale',
    [this.DESYNCHRONISEE]: 'Sesam vitale désynchronisée',
    [this.PAPIER]: 'Papier',
  };
}
