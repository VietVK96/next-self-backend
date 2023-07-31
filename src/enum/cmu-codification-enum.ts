/**
 * File application/Enum/CmuCodificationEnum.php
 */
export class CmuCodificationEnum {
  public static FDA = 'FDA';
  public static FDC = 'FDC';
  public static FDR = 'FDR';
  public static FPC = 'FPC';

  public static choices = {
    [this.FDA]: 'FDA',
    [this.FDC]: 'FDC',
    [this.FDR]: 'FDR',
    [this.FPC]: 'FPC',
  };
}
