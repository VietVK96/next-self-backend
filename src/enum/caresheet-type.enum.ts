/**
 * application/Enum/CaresheetTypeEnum.php
 */
export class CaresheetTypeEnum {
  public static DRE = 'DRE';
  public static FSE = 'FSE';
  public static ENR = 'ENR';
  public static FDE = 'FDE';
  public static FSU = 'FSU';

  public static choices = {
    [this.DRE]: 'Demande de remboursement électronique',
    [this.FSE]: 'Feuille de soin électronique',
    [this.ENR]: 'Feuille de soin électronique avec une prise en charge AMC',
    [this.FDE]:
      'Feuille de soin électronique + Demande de remboursement électronique',
    [this.FSU]: 'Feuille de soins en gestion unique',
  };
}
