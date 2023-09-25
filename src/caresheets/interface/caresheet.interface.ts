export interface IChangementEta {
  teletrans?: {
    idFacture?: string[];
  };
}

export interface IConsulterTeleTrans {
  etatLotFse?: string;
  etatLotDre?: string;
}

export interface IConsulterFacture {
  etatLotFse?: string[];
  etatLotDre?: string[];
  typeFacture?: string[];
  numeroFse?: string[];
  estValide?: string[];
  modeFacture?: string[];
  AMO?: {
    isTp: string[];
    montant: string[];
  }[];
  AMC?: {
    isTp: string[];
    montant: string[];
  }[];
  prestations?: {
    codePrestation: string[];
    montantTotal: string[];
    montantAMO: string[];
    montantAMC: string[];
    montantPP: string[];
    coefficient: string[];
    codesActes: string[];
  }[];

  documents?: {
    idDocument: string[];
    typeDocument: string[];
    nomDocument: string[];
    dateDocument: string[];
    etatDocument: string[];
  }[];
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

export interface IConsulterListeCpseRsp {
  erreur?: string[];
  carteCps?: {
    idNational?: string[];
    numNatPs?: string[];
    fseAutorise?: string[];
    lotAutorise?: string[];
    nomPs?: string[];
    prenomPs?: string[];
    typeCarte?: string[];
    finess?: string[];
    numFiness?: string[];
  }[];
}

export interface IConsulterUtlDetailRsp {
  erreur?: string[];
  utilisateur?: {
    idtUtil?: string[];
    nomPs?: string[];
    prenomPs?: string[];
    estArchive?: string[];
    statut?: IConsulterUtlStatut[];
  }[];
}

export interface IConsulterUtlStatut {
  codeConvention: string[];
  numIdtNat: string[];
  numNatPs: string[];
  nomUtf: string[];
  numStructure: string[];
  numFiness: string[];
  codeSpecialite: string[];
}

export interface IConsulterClient {
  individu?: {
    idPatient?: string[];
    nomUsuel?: string[];
    prenom?: string[];
    rangGem?: string[];
    dateNaissance?: string[];
    nirIndividu?: string[];
    nirIndividuCle?: string[];
    codeCivilite?: string[];
    isDateLunaire?: string[];
    codeServiceAMO: string[];
    dateDebutServiceAMO?: string[];
    dateFinServiceAMO?: string[];
    couvertureAMO?: string[];
    couvertureAMC?: string[];
    idAssure?: string[];
  }[];
}
