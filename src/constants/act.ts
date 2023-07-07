export enum TraceabilityStatusEnum {
  NONE = 0,
  UNFILLED = 1,
  FILLED = 2,
}
export enum ExceedingEnum {
  ENTENTE_DIRECTE = 'D',
  EXIGENCE_PARTICULIERE = 'E',
  DEPLACEMENT_NON_PRESCRIT = 'F',
  GRATUIT = 'G',
  NON_REMBOURSABLE = 'N',
  AUTORISE = 'A',
  MAITRISE = 'M',
  AUTORISE_ENTENTE_DIRECTE = 'B',
  MAITRISE_EXIGENCE_PARTICULIERE = 'C',
  SMG = 'L',
}

export enum CodeNatureAssuranceEnum {
  ASSURANCE_MALADIE = '10',
  ALSACE_MOSELLE = '13',
  MATERNITE = '30',
  ACCIDENT_DU_TRAVAIL = '41',
  PREVENTION = '90',
}
