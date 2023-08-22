export class InitFactureRes {
  object_connexion?: string;
  id_user?: number;
  id_societe?: number;
  id_facture?: number;
  noFacture?: string;
  dateFacture?: string;
  titreFacture?: string;
  identPrat?: string;
  adressePrat?: string;
  identPat?: string;
  modePaiement?: string;
  infosCompl?: string;
  details?: DetailsRes[];
  pdf?: string;
  billSignatureDoctor?: string;
  billAmount?: number;
  billSecuAmount?: number;
  billTemplate?: number;
  userNumeroFacturant?: string;
  contactFullname?: string;
  contactBirthday?: string;
  contactInsee?: string;
  groupId?: number;
}

export class DetailsRes {
  id_facture_line?: number;
  typeLigne?: string;
  dateLigne?: string;
  dentsLigne?: string;
  descriptionLigne?: string;
  prixLigne?: number;
  name?: string;
  cotation?: string;
  secuAmount?: number;
  materials?: string;
}

export class AjaxSeancesCaseRes {
  date: string;
  data: AjaxEventTaskRes[];
}

export class AjaxEventTaskRes {
  id?: number;
  name?: string;
  date?: string;
  amount?: number;
  cotation?: string;
  ccamFamily?: string;
  teeth?: string;
  secuAmount?: number;
  exceeding?: string;
  type?: string;
  ccamCode?: string;
  coef?: number;
  ngapKeyName?: string;
}
