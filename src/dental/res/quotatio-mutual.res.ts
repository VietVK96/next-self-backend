import { PaymentItemRes } from 'src/payment-schedule/response/payment.res';

export class QuotationMutualInitByRes {
  txch: number;
  ident_prat: string;
  ident_pat: number;
  nom_prenom_patient: string;
  date_de_naissance_patient: string;
  date_devis: string;
  duree_devis: number;
  INSEE: string;
  adresse_pat: string;
  tel: string;
  organisme: string;
  contrat: string;
  ref: string;
  dispo_desc: string;
  paymentSchedule: PaymentItemRes | null;
  dispo: boolean;
  description: string;
  date_acceptation: string;
  patientLastname: string;
  patientFirstname: string;
  patientCivilityName: string;
  email: string;
  quotationAmount: number;
  quotationPersonRepayment: number;
  quotationPersonAmount: number;
  userSignature: string;
  id_user: number;
  actes: QuotationMutualInitActeRes[];
}

export class QuotationMutualInitActeRes {
  id_devis_acte: number;
  library_act_id: number;
  library_act_quantity_id: number;
  localisation: string;
  libelle: string;
  materiau: string;
  cotation: string;
  remboursable: string;
  prixachat: number;
  honoraires: number;
  tarif_secu: number;
  rss: number;
  roc: number | string;
  secuAmount: number;
  secuRepayment: number;
  mutualRepaymentType: number;
  mutualRepaymentRate: number;
  mutualRepayment: number;
  mutualComplement: number;
  personRepayment: number;
  personAmount: number;
  nouveau?: boolean;
  prixvente?: number;
  prestation?: number;
  charges?: number;
  nrss?: number;
}
