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
  lot?: {
    idLot?: string[];
    numLot?: string[];
    typeSecuLot?: string[];
    dateCrea?: { _: string }[];
    montantTotal?: string[];
    montantAmo?: string[];
    montantAmc?: string[];
    rnm?: string[];
    codeGrandRegime?: string[];
    codeCaisse?: string[];
    codeCentre?: string[];
    cstatut?: string[];
    dateEnvoi?: { _: string }[];
    sendingDate?: { _: string }[];
    factures?: {
      idFacture?: string[];
    };
  }[];
}

export interface IFileRecevoirDetailListeRsp {
  erreur?: {
    libelleErreur?: string;
  };
  rsp?: {
    nReference?: string[];
    sRegime?: string[];
    virements: {
      sVirement1?: string[];
      sVirement2?: string[];
      factures?: {
        nNoFacture?: string[];
        rejets?: {
          sCode?: string[];
          sLibelle?: string[];
        }[];
        partAmo?: {
          sEtatPaiement?: string[];
          xMttpaye?: string[];
        };
        partAmc?: {
          sEtatPaiement?: string[];
          xMttpaye?: string[];
        };
      }[];
      dDateComptable?: string[];
    }[];
  };
  idtRsp?: string[];
}
export interface IRecevoirDetailListeRsp {
  fichier?: IFileRecevoirDetailListeRsp[];
}

export interface IRecevoirRsp {
  erreur?: {
    libelleErreur?: string[];
  };
  listeRspNonTraites?: {
    rsp?: {
      idRsp?: string[];
      fichier?: string[];
    }[];
  }[];
}
