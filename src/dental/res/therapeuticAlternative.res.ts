import { CcamEntity } from 'src/entities/ccam.entity';
import { DentalQuotationActEntity } from 'src/entities/dental-quotation-act.entity';

export class TherapeuticAlternativesJsonRes {
  [key: string]: {
    [key: string]: TherapeuticAlternativesDataRes;
  };
}
export class TherapeuticAlternativesDataRes {
  Actes_Directeurs: string[];
  Code_Panier: number;
  racm?: string[];
  rac0: string[];
}

export class MedicalTherapeuticAlternativeJsonRes {
  materiaux: {
    canines: string[];
    molaires: string[];
    incisives: string[];
    deuxiemePremolaire: string[];
    premierePremolaire: string[];
  };
  families: string[];
  moderate_alternative: boolean;
}

export class OrderByMaterialsMadeByPratitionerRes {
  ccam: CcamEntity;
  materialCode: number;
  hasMaterialCode: boolean;
}

export class TherapeuticAlternatives0Res {
  act: DentalQuotationActEntity;
  ccam: CcamEntity;
  tooth: string;
  position: string;
  actesDirecteurs: string[];
  materialCode: number;
  madeByPractitioner?: boolean;
}

export class GetTherapeuticAlternativeRes {
  rac0: TherapeuticAlternatives0Res[];
  racm: TherapeuticAlternatives0Res[];
}
