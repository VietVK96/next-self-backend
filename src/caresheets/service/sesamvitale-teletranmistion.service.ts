import { Injectable } from '@nestjs/common';
import {
  IChangementEta,
  IConsulterTeleTrans,
  IListeDateChangementEtat,
} from '../interface/caresheet.interface';
import { SesamvitaleBaseService } from './sesamvitale-base.service';

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
  ): Promise<IListeDateChangementEtat[]> {
    const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:jux="http://www.juxta.fr" xmlns:xsd="XsdWebServiceFSV.xsd"><soapenv:Body><jux:ListeDateChangementEtat><xsd:appelListeDateChangementEtat><xsd:numFiness>${finessNumber}</xsd:numFiness><xsd:dateDebut format="yyyyMMdd">${startDate}</xsd:dateDebut><xsd:dateFin format="yyyyMMdd">${endDate}</xsd:dateFin></xsd:appelListeDateChangementEtat></jux:ListeDateChangementEtat></soapenv:Body></soapenv:Envelope>`;

    const data = await this.sendRequest<IListeDateChangementEtat[]>(
      'ListeDateChangementEtat',
      xml,
    );
    return data;
  }
}
