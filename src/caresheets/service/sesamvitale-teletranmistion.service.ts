import { Injectable } from '@nestjs/common';
import {
  IChangementEta,
  IConsulterListeCpseRsp,
  IConsulterTeleTrans,
  IConsulterUtlDetailRsp,
  IConsulterFacture,
  IListeDateChangementEtat,
  IRecevoirDetailListeRsp,
  IRecevoirRsp,
  IConsulterClient,
  ITransmettrePatient,
} from '../interface/caresheet.interface';
import { SesamvitaleBaseService } from './sesamvitale-base.service';
import { UserEntity } from 'src/entities/user.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import * as dayjs from 'dayjs';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class SesamvitaleTeletranmistionService extends SesamvitaleBaseService {
  constructor(
    private dataSource: DataSource,
    config: ConfigService,
    httpService: HttpService,
  ) {
    super(config, httpService);
  }

  async listeChangementEtat(idTeletrans: number): Promise<IChangementEta> {
    const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:jux="http://www.juxta.fr" xmlns:xsd="XsdWebServiceFSV.xsd">
  <soapenv:Body>
    <jux:ListeChangementEtat>
      <xsd:appelListeChangementEtat>
        <xsd:idTeletrans>${idTeletrans}</xsd:idTeletrans>
      </xsd:appelListeChangementEtat>
    </jux:ListeChangementEtat>
  </soapenv:Body>
</soapenv:Envelope>`;
    const data = await this.sendRequest<IChangementEta>(
      'ListeChangementEtat',
      xml,
    );
    return data;
  }

  async consulterTeleTrans(idFacture: string): Promise<IConsulterTeleTrans> {
    const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:jux="http://www.juxta.fr" xmlns:xsd="XsdWebServiceFSV.xsd"><soapenv:Body><jux:ConsulterTeleTrans><xsd:appelConsulterTeleTrans><xsd:idFacture>${idFacture}</xsd:idFacture></xsd:appelConsulterTeleTrans></jux:ConsulterTeleTrans></soapenv:Body></soapenv:Envelope>`;
    const data = await this.sendRequest<IConsulterTeleTrans>(
      'ConsulterTeleTrans',
      xml,
    );
    return data;
  }

  async listeDateChangementEtat(
    finessNumber: string,
    startDate: string,
    endDate: string,
  ): Promise<IListeDateChangementEtat> {
    const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:jux="http://www.juxta.fr" xmlns:xsd="XsdWebServiceFSV.xsd"><soapenv:Body><jux:ListeDateChangementEtat><xsd:appelListeDateChangementEtat><xsd:numFiness>${finessNumber}</xsd:numFiness><xsd:dateDebut format="yyyyMMdd">${startDate}</xsd:dateDebut><xsd:dateFin format="yyyyMMdd">${endDate}</xsd:dateFin></xsd:appelListeDateChangementEtat></jux:ListeDateChangementEtat></soapenv:Body></soapenv:Envelope>`;

    const data = await this.sendRequest<IListeDateChangementEtat>(
      'ListeDateChangementEtat',
      xml,
    );
    return data;
  }

  async recevoirDetailListeRsp(
    finessNumber: string,
    mock?: string,
  ): Promise<IRecevoirDetailListeRsp> {
    const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:jux="http://www.juxta.fr" xmlns:xsd="XsdWebServiceFSV.xsd"><soapenv:Body><jux:RecevoirDetailListeRsp><xsd:appelRecevoirDetailListeRsp><xsd:numFiness>${finessNumber}</xsd:numFiness></xsd:appelRecevoirDetailListeRsp></jux:RecevoirDetailListeRsp></soapenv:Body></soapenv:Envelope>`;

    const data = await this.sendRequest<IRecevoirDetailListeRsp>(
      'RecevoirDetailListeRsp',
      xml,
      mock,
    );
    return data;
  }

  async recevoirRsp(
    finessNumber: string,
    mock?: string,
  ): Promise<IRecevoirRsp> {
    const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:jux="http://www.juxta.fr" xmlns:xsd="XsdWebServiceFSV.xsd"><soapenv:Body><jux:RecevoirRsp><xsd:appelRecevoirRsp><xsd:numFiness>${finessNumber}</xsd:numFiness></xsd:appelRecevoirRsp></jux:RecevoirRsp></soapenv:Body></soapenv:Envelope>`;
    const data = await this.sendRequest<IRecevoirRsp>('RecevoirRsp', xml, mock);
    return data;
  }

  async marquerRsp(idtRsp: string[]) {
    let idtRspXml = ``;
    for (const id of idtRsp) {
      idtRspXml += `<xsd:idRsp>${id}</xsd:idRsp>`;
    }

    const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:jux="http://www.juxta.fr" xmlns:xsd="XsdWebServiceFSV.xsd"><soapenv:Body><jux:MarquerRsp><xsd:appelMarquerRsp><xsd:listeRsp>${idtRspXml}</xsd:listeRsp></xsd:appelMarquerRsp></jux:MarquerRsp></soapenv:Body></soapenv:Envelope>`;

    await this.sendRequest('MarquerRsp', xml);
  }

  async consulterListeCps(idFitness: string): Promise<IConsulterListeCpseRsp> {
    const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:jux="http://www.juxta.fr" xmlns:xsd="XsdWebServiceFSV.xsd">
  <soapenv:Body>
    <jux:ConsulterListeCps>
      <xsd:appelConsulterListeCps>
        <xsd:numFiness>${idFitness}</xsd:numFiness>
      </xsd:appelConsulterListeCps>
    </jux:ConsulterListeCps>
  </soapenv:Body>
</soapenv:Envelope>`;

    const data = await this.sendRequest<IConsulterListeCpseRsp>(
      'ConsulterListeCps',
      xml,
    );

    return data;
  }

  async consulterUtlDetail(
    idFitness: string,
    nationalIdentifierNumber: string,
  ): Promise<IConsulterUtlDetailRsp> {
    const ArchivedValue = false;
    const idFitnessNumber = idFitness.slice(0, -1);
    const idNationalIdentifierNumber = nationalIdentifierNumber.slice(0, -1);
    const isArchivedValue = ArchivedValue.toString();
    const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:jux="http://www.juxta.fr" xmlns:xsd="XsdWebServiceFSV.xsd">
  <soapenv:Body>
    <jux:ConsulterUtlDetail>
      <xsd:appelConsulterUtlDetail>
        <xsd:numFacturationSansCle>${idFitnessNumber}</xsd:numFacturationSansCle>
        <xsd:numIdtNatSansCle>${idNationalIdentifierNumber}</xsd:numIdtNatSansCle>
        <xsd:estArchive>${isArchivedValue}</xsd:estArchive>
      </xsd:appelConsulterUtlDetail>
    </jux:ConsulterUtlDetail>
  </soapenv:Body>
</soapenv:Envelope>`;
    const data = await this.sendRequest<IConsulterUtlDetailRsp>(
      'ConsulterUtlDetail',
      xml,
    );
    return data;
  }

  async consulterFacture(idFacture: number): Promise<IConsulterFacture> {
    const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:jux="http://www.juxta.fr" xmlns:xsd="XsdWebServiceFSV.xsd">
    <soapenv:Body>
      <jux:ConsulterFacture>
        <xsd:appelConsulterFacture>
          <xsd:idFacture>${idFacture}</xsd:idFacture>
        </xsd:appelConsulterFacture>
      </jux:ConsulterFacture>
    </soapenv:Body>
  </soapenv:Envelope>`;
    const data = await this.sendRequest<IConsulterFacture>(
      'ConsulterFacture',
      xml,
    );
    return data;
  }

  async consulterClient(idPatient: number): Promise<IConsulterClient> {
    const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:jux="http://www.juxta.fr" xmlns:xsd="XsdWebServiceFSV.xsd">
      <soapenv:Body>
        <jux:ConsulterClient>
          <xsd:appelConsulterClient>
            <xsd:idPatient>${idPatient}</xsd:idPatient>
          </xsd:appelConsulterClient>
        </jux:ConsulterClient>
      </soapenv:Body>
    </soapenv:Envelope>`;
    const data = await this.sendRequest<IConsulterClient>(
      'ConsulterClient',
      xml,
    );
    return data;
  }

  async transmettrePatient(user: UserEntity, patient: ContactEntity) {
    if (
      !patient?.firstname ||
      !patient?.lastname ||
      !patient?.birthday ||
      !patient?.birthOrder ||
      !patient?.insee ||
      !patient?.inseeKey
    ) {
      throw new CBadRequestException(ErrorCode.ERROR_PATIENT_IS_REQUIRED);
    }
    const birthDate = patient?.birthDateLunar
      ? dayjs(patient?.birthDateLunar).format('YYYYMMDD')
      : dayjs(patient?.birthday).format('YYYYMMDD');
    const matches = birthDate.match(
      /^(?<year>[0-9]{4})(?<month>[0-9]{2})(?<day>[0-9]{2})$/,
    );

    if (patient?.externalReferenceId) {
      const respone = await this.consulterClient(patient?.externalReferenceId);
      if (
        respone?.individu?.[0]?.nomUsuel?.[0].toLocaleLowerCase() ===
          patient?.lastname.toLocaleLowerCase() &&
        respone?.individu?.[0]?.prenom?.[0].toLocaleLowerCase() ===
          patient?.firstname.toLocaleLowerCase() &&
        respone?.individu?.[0]?.rangGem?.[0] === String(patient?.birthOrder) &&
        respone?.individu?.[0]?.dateNaissance?.[0] ===
          `${matches?.groups?.year}${matches?.groups?.month}${matches?.groups?.day}` &&
        respone?.individu?.[0]?.nirIndividu?.[0] === patient?.insee &&
        respone?.individu?.[0]?.nirIndividuCle?.[0] === patient?.inseeKey
      ) {
        return null;
      }
    }

    const numFacturation = user?.medical?.finessNumber;
    const numRpps = user?.medical?.nationalIdentifierNumber;
    const idPatient = patient?.externalReferenceId;
    const nom = patient?.lastname;
    const prenom = patient?.firstname;
    const jour = matches?.groups?.day;
    const mois = matches?.groups?.month;
    const annee = matches?.groups?.year;
    const lunaire = !!patient?.birthDateLunar ? 'true' : 'false';
    const numeroSS = patient?.insee;
    const cleNumeroSS = patient?.inseeKey;
    const rangNaissance = patient?.birthOrder;
    const xml = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:jux="http://www.juxta.fr" xmlns:xsd="XsdWebServiceFSV.xsd">
      <soapenv:Body>
        <jux:transmettrePatient>
          <xsd:appelTransmettrePatient>
            ${
              numFacturation
                ? `<xsd:numFacturation>${numFacturation}</xsd:numFacturation>`
                : ''
            }
            ${numRpps ? `<xsd:numRpps>${numRpps}</xsd:numRpps>` : ''}
            ${idPatient ? `<xsd:idPatient>${idPatient}</xsd:idPatient>` : ``}
            ${nom ? `<xsd:nom>${nom}</xsd:nom>` : ''}
            ${prenom ? `<xsd:prenom>${prenom}</xsd:prenom>` : ''}
            <xsd:dateNaissance>
              ${jour ? `<xsd:jour>${jour}</xsd:jour>` : ``}
              ${mois ? `<xsd:mois>${mois}</xsd:mois>` : ``}
              ${annee ? `<xsd:annee>${annee}</xsd:annee>` : ``}
              <xsd:lunaire>${lunaire}</xsd:lunaire>
            </xsd:dateNaissance>
            ${numeroSS ? `<xsd:numeroSS>${numeroSS}</xsd:numeroSS>` : ``}
            ${
              cleNumeroSS
                ? `<xsd:cleNumeroSS>${cleNumeroSS}</xsd:cleNumeroSS>`
                : ``
            }
            ${
              rangNaissance
                ? `<xsd:rangNaissance>${rangNaissance}</xsd:rangNaissance>`
                : ``
            }
          </xsd:appelTransmettrePatient>
        </jux:transmettrePatient>
      </soapenv:Body>
    </soapenv:Envelope>`;

    const respone = await this.sendRequest<ITransmettrePatient>(
      'transmettrePatient',
      xml,
    );

    if (!patient?.externalReferenceId) {
      patient.externalReferenceId = Number(respone?.idPatient?.[0]);
      await this.dataSource.getRepository(UserEntity).save(patient);
    }
    return respone;
  }

  async transmettreFacture(data: {
    identification: {
      idPatient?: number;
      dateFacturation?: string;
      datePrescription?: string;
      numFiness?: string;
      numNatPs?: string;
      numNatPsRemplace?: string;
      isTpAmo?: boolean;
      isTpAmc?: boolean;
      prescripteur?: string;
      modeSecurisation?: string;
      ParcoursDeSoin: {
        situationParcoursDeSoin?: string;
        nomMedecinOrienteur?: string;
        prenomMedecinOrienteur?: string;
      };
      GenererDRE?: boolean;
    };
    actes: any[];
  }) {
    const _getpPescripteurXml = (prescripteur: any) => {
      const codeConditionExercice = prescripteur?.codeConditionExercice;
      const numIdFacPresc = prescripteur?.numIdFacPresc;
      const rppsPresc = prescripteur?.rppsPresc;
      const numeroStructure = prescripteur?.numeroStructure;
      const codeSpecialite = prescripteur?.codeSpecialite;
      const estPrescipteurSncf = prescripteur?.estPrescipteurSncf;
      if (numIdFacPresc) {
        return `
        <xsd:prescripteur>
          ${
            codeConditionExercice
              ? `<xsd:codeConditionExercice>${codeConditionExercice}</xsd:codeConditionExercice>`
              : ''
          }
          ${
            numIdFacPresc
              ? `<xsd:numIdFacPresc>${numIdFacPresc?.slice(
                  0,
                  -1,
                )}</xsd:numIdFacPresc>`
              : ''
          }
          ${
            numIdFacPresc
              ? `<xsd:numIdFacPrescCle>${numIdFacPresc?.slice(
                  -1,
                )}</xsd:numIdFacPrescCle>`
              : ''
          }
          ${
            codeSpecialite
              ? `<xsd:codeSpecialite>${codeSpecialite}</xsd:codeSpecialite>`
              : ''
          }
          ${
            rppsPresc
              ? `<xsd:rppsPresc>${rppsPresc?.slice(0, -1)}</xsd:rppsPresc>`
              : ''
          }
          ${
            rppsPresc
              ? `<xsd:rppsPrescCle>${rppsPresc?.slice(-1)}</xsd:rppsPrescCle>`
              : ''
          }
          ${
            numeroStructure
              ? `<xsd:numeroStructure>${numeroStructure}</xsd:numeroStructure>`
              : ''
          }
          ${
            estPrescipteurSncf !== null && estPrescipteurSncf !== undefined
              ? `<xsd:estPrescipteurSncf>${
                  estPrescipteurSncf ? 'true' : 'false'
                }</xsd:estPrescipteurSncf>`
              : ''
          }
        </xsd:prescripteur>
        `;
      }
      return '';
    };

    const _getSituationParcoursDeSoin = () => {
      const situationParcoursDeSoin =
        data?.identification?.ParcoursDeSoin?.situationParcoursDeSoin;
      if (situationParcoursDeSoin) {
        const nomMedecinOrienteur =
          data?.identification?.ParcoursDeSoin?.nomMedecinOrienteur;
        const prenomMedecinOrienteur =
          data?.identification?.ParcoursDeSoin?.prenomMedecinOrienteur;
        return `
        <xsd:ParcoursDeSoin>
          ${
            situationParcoursDeSoin
              ? `<xsd:situationParcoursDeSoin>${situationParcoursDeSoin}</xsd:situationParcoursDeSoin>`
              : ''
          }
          ${
            nomMedecinOrienteur
              ? `<xsd:nomMedecinOrienteur>${nomMedecinOrienteur}</xsd:nomMedecinOrienteur>`
              : ''
          }
          ${
            prenomMedecinOrienteur
              ? `<xsd:prenomMedecinOrienteur>${prenomMedecinOrienteur}</xsd:prenomMedecinOrienteur>`
              : ''
          }
        </xsd:ParcoursDeSoin>
        `;
      }
      return '';
    };

    const acte = data?.actes?.map(
      (acte, index) => `
                <xsd:acte>
                <xsd:numero>${index}</xsd:numero>
                ${
                  acte?.dateExecution
                    ? `<xsd:dateExecution format="yyyyMMdd">${dayjs(
                        acte?.dateExecution,
                      ).format('YYYYMMDD')}</xsd:dateExecution>`
                    : ''
                }
                <xsd:codeActe>${acte?.codeActe ?? ''}</xsd:codeActe>
                <xsd:qte>${acte?.qte ?? ''}</xsd:qte>
                ${
                  acte?.montantHonoraire
                    ? ` <xsd:montantHonoraire>${acte?.montantHonoraire}</xsd:montantHonoraire>`
                    : ''
                }
                <xsd:libelle>${acte?.libelle ?? ''}</xsd:libelle>
                <xsd:numeroDents>${acte?.numeroDents ?? ''}</xsd:numeroDents>
                <xsd:coefficient>${acte?.coefficient ?? ''}</xsd:coefficient>
                ${
                  acte?.codeAssociation
                    ? `<xsd:codeAssociation>${acte?.codeAssociation}</xsd:codeAssociation>`
                    : ``
                }
                ${
                  acte?.qualifDepense
                    ? `<xsd:qualifDepense>${acte?.qualifDepense}</xsd:qualifDepense>`
                    : ``
                }
                ${
                  acte?.complementPrestation
                    ? `<xsd:complementPrestation>${acte?.complementPrestation}</xsd:complementPrestation>`
                    : ``
                }
                ${
                  acte?.codeModificateur1
                    ? `<xsd:codeModificateur1>
              <xsd:codeModificateur>              
              ${acte?.codeModificateur1}
              </xsd:codeModificateur>
              </xsd:codeModificateur1>`
                    : ``
                }
                ${
                  acte?.codeModificateur2
                    ? `<xsd:codeModificateur2>
              <xsd:codeModificateur>              
              ${acte?.codeModificateur2}
              </xsd:codeModificateur>
              </xsd:codeModificateur2>`
                    : ``
                }
                ${
                  acte?.codeModificateur3
                    ? `<xsd:codeModificateur3>
              <xsd:codeModificateur>              
              ${acte?.codeModificateur3}
              </xsd:codeModificateur>
              </xsd:codeModificateur3>`
                    : ``
                }
                ${
                  acte?.codeModificateur4
                    ? `<xsd:codeModificateur4>
              <xsd:codeModificateur>              
              ${acte?.codeModificateur4}
              </xsd:codeModificateur>
              </xsd:codeModificateur4>`
                    : ``
                }
                ${
                  acte?.remboursementExceptionnel !== undefined
                    ? `<xsd:remboursementExceptionnel>${
                        !!acte?.remboursementExceptionnel ? 'true' : 'false'
                      }</xsd:remboursementExceptionnel>`
                    : ``
                }
                ${
                  acte?.codeJustifExoneration
                    ? `<xsd:codeJustifExoneration>${acte?.codeJustifExoneration}</xsd:codeJustifExoneration>`
                    : ``
                }
                ${
                  acte?.isAld !== undefined
                    ? `<xsd:isAld>${
                        !!acte?.isAld ? 'true' : 'false'
                      }</xsd:isAld>`
                    : ``
                }
                ${
                  acte?.dateDemandePrealable
                    ? `<xsd:dateDemandePrealable format="yyyyMMdd">${acte?.dateDemandePrealable}</xsd:dateDemandePrealable>`
                    : ``
                }
                ${
                  acte?.codeAccordPrealable
                    ? `<xsd:codeAccordPrealable">${acte?.codeAccordPrealable}</xsd:codeAccordPrealable>`
                    : ``
                }
              </xsd:acte>
              `,
    );
    const xml = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:jux="http://www.juxta.fr" xmlns:xsd="XsdWebServiceFSV.xsd">
      <soapenv:Body>
        <jux:TransmettreFacture>
          <xsd:appelTransmettreFacture>
            <xsd:identification>
            ${
              data?.identification?.idPatient
                ? `<xsd:idPatient>${data?.identification?.idPatient}</xsd:idPatient>`
                : ''
            }
              <xsd:source>${'ecoodentist'}</xsd:source>
              ${
                data?.identification?.dateFacturation
                  ? `<xsd:dateFacturation format="yyyyMMdd">${data?.identification?.dateFacturation}</xsd:dateFacturation>`
                  : ''
              }
                ${
                  data?.identification?.datePrescription
                    ? `<xsd:datePrescription format="yyyyMMdd">${data?.identification?.datePrescription}</xsd:datePrescription>`
                    : ''
                }
              ${
                data?.identification?.numNatPs
                  ? `<xsd:numNatPs>${data?.identification?.numNatPs}</xsd:numNatPs>`
                  : ''
              }
              ${
                data?.identification?.numFiness
                  ? `<xsd:numFiness>${data?.identification?.numFiness}</xsd:numFiness>`
                  : ''
              }
         ${
           data?.identification?.numNatPsRemplace
             ? `<xsd:numNatPsRemplace>${data?.identification?.numNatPsRemplace}</xsd:numNatPsRemplace>`
             : ''
         }
         ${
           data?.identification?.isTpAmo !== undefined
             ? `<xsd:isTpAmo>${
                 data?.identification?.isTpAmo ? 'true' : 'false'
               }</xsd:isTpAmo>`
             : ''
         }
        ${
          data?.identification?.isTpAmc !== undefined
            ? `<xsd:isTpAmc>${
                data?.identification?.isTpAmc ? 'true' : 'false'
              }</xsd:isTpAmc>`
            : ''
        }
         ${
           data?.identification?.GenererDRE !== undefined
             ? `<xsd:GenererDRE>${
                 data?.identification?.GenererDRE ? 'true' : 'false'
               }</xsd:GenererDRE>`
             : ''
         }
         ${
           data?.identification?.modeSecurisation
             ? `<xsd:modeSecurisation>${data?.identification?.modeSecurisation}</xsd:modeSecurisation>`
             : ''
         }
              ${_getpPescripteurXml(data?.identification?.prescripteur)}
              ${_getSituationParcoursDeSoin()}
            </xsd:identification>
            ${acte.join('')}
           
          </xsd:appelTransmettreFacture>
        </jux:TransmettreFacture>
      </soapenv:Body>
    </soapenv:Envelope>`;
    const res = await this.sendRequest<any>('TransmettreFacture', xml);
    return res;
  }
}
