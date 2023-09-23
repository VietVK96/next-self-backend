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
import dayjs from 'dayjs';

@Injectable()
export class SesamvitaleTeletranmistionService extends SesamvitaleBaseService {
  // constructor(
  //   private config: ConfigService,
  //   private readonly httpService: HttpService,
  // ){
  //   super(config, httpService);
  // }

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
    const birthDate =
      patient?.birthDateLunar ?? dayjs(patient?.birthday).format('YYYY-MM-DD');
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

    const numFacturation = user?.medical?.finessNumber ?? '';
    const numRpps = user?.medical?.nationalIdentifierNumber ?? '';
    const idPatient = patient?.externalReferenceId ?? '';
    const nom = patient?.lastname ?? '';
    const prenom = patient?.firstname ?? '';
    const jour = matches?.groups?.day ?? '';
    const mois = matches?.groups?.month ?? '';
    const annee = matches?.groups?.year ?? '';
    const lunaire = !!patient?.birthDateLunar ? 'true' : 'false';
    const numeroSS = patient?.insee ?? '';
    const cleNumeroSS = patient?.inseeKey ?? '';
    const rangNaissance = patient?.birthOrder ?? '';
    const xml = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:jux="http://www.juxta.fr" xmlns:xsd="XsdWebServiceFSV.xsd">
      <soapenv:Body>
        <jux:transmettrePatient>
          <xsd:appelTransmettrePatient>
            <xsd:numFacturation>${numFacturation}</xsd:numFacturation>
            <xsd:numRpps>${numRpps}</xsd:numRpps>
            ${idPatient ? `<xsd:idPatient>${idPatient}</xsd:idPatient>` : ``}
            <xsd:nom>${nom}</xsd:nom>
            <xsd:prenom>${prenom}</xsd:prenom>
            <xsd:dateNaissance>
              <xsd:jour>${jour}</xsd:jour>
              <xsd:mois>${mois}</xsd:mois>
              <xsd:annee>${annee}</xsd:annee>
              <xsd:lunaire>${lunaire}</xsd:lunaire>
            </xsd:dateNaissance>
            <xsd:numeroSS>${numeroSS}</xsd:numeroSS>
            <xsd:cleNumeroSS>${cleNumeroSS}</xsd:cleNumeroSS>
            <xsd:rangNaissance>${rangNaissance}</xsd:rangNaissance>
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
    }
    return respone;
  }
}
