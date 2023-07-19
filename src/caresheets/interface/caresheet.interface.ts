export interface IChangementEta {
  teletrans?: {
    idFacture?: string[];
  };
}

export interface IConsulterTeleTrans {
  etatLotFse?: string;
  etatLotDre?: string;
}

export interface IListeDateChangementEtat {
  idLot?: string;
  numLot?: string;
  typeSecuLot?: string;
  dateCrea?: string;
  montantTotal?: string;
  montantAmo?: string;
  montantAmc?: string;
  rnm?: string;
  codeGrandRegime?: string;
  codeCaisse?: string;
  codeCentre?: string;
  cstatut?: string;
  dateEnvoi?: string;
  sendingDate?: string;
  factures?: {
    idFacture?: string[];
  };
}
