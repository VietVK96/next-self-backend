/**
 * application\Enum\ExceedingEnum.php line 1->34
 */
export class ExemptionCodeEnum {
  public static PAS_EXONERATION = '0';
  public static SOINS_PARTICULIERS_EXONERES = '3';
  public static ALD = '4';
  public static ASSURE_BENEFICIAIRE_EXONERE = '5';
  public static REGIMES_SPECIAUX = '6';
  public static DISPOSITIF_PREVENTION = '7';
  public static RESERVE_REGIME_GENERAL = '8';
  public static FSV = '9';
  public static DEPASSEMENT_SEUIL = 'C';

  public static choices = {
    [this.PAS_EXONERATION]: 'Entente directe',
    [this.SOINS_PARTICULIERS_EXONERES]: 'Soins particuliers exonérés',
    [this.ALD]:
      'Soins relatifs aux affections liste, hors liste ou multiples (ALD)',
    [this.ASSURE_BENEFICIAIRE_EXONERE]:
      'Assuré ou bénéficiaire exonéré (C.A.S.)',
    [this.REGIMES_SPECIAUX]:
      'Exonération régimes spéciaux (Service médical SNCF, régime des Mines)',
    [this.DISPOSITIF_PREVENTION]:
      "Soins dispensés en risque maladie et exonérés dans le cadre d'un dispositif de prévention",
    [this.RESERVE_REGIME_GENERAL]: 'FSV ou FSI (ancien FNS)',
    [this.DEPASSEMENT_SEUIL]:
      "Soins exonérés en codage CCAM du fait de la nature de l'acte, ou du dépassement du seuil",
  };
}
