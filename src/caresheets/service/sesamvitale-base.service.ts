import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseStringPromise } from 'xml2js';
import { constants } from 'crypto';
import * as https from 'https';
import { firstValueFrom } from 'rxjs';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';

@Injectable()
export class SesamvitaleBaseService {
  constructor(
    private config: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async sendRequest<T>(
    action: string,
    contents: string,
    mock?: string,
  ): Promise<T> {
    const endpoint = this.config.get<string>('app.sesamVitale.endPoint');
    const url = `${endpoint}/webservices/Fsv_SesamVitale.asmx`;

    const headers = {
      'Content-Type': 'text/xml; charset=utf-8',
    };

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT,
    });

    let { data } = await firstValueFrom(
      this.httpService.post(url, contents, {
        headers,
        httpsAgent,
        httpAgent: httpsAgent,
      }),
    );

    if (mock && mock !== '') {
      data = mock;
    }
    data = data.replaceAll('xsi:nil="true"', '');
    const resJson = await parseStringPromise(data);
    if (
      !resJson ||
      !resJson['soap:Envelope'] ||
      !resJson['soap:Envelope']['soap:Body'] ||
      !resJson['soap:Envelope']['soap:Body'][0][`${action}Response`] ||
      !resJson['soap:Envelope']['soap:Body'][0][`${action}Response`][0][
        `${action}Result`
      ]
    ) {
      throw new CBadRequestException(ErrorCode.CAN_NOT_REQUEST_TO_DENTAL_VIA);
    }
    const soapBody =
      resJson['soap:Envelope']['soap:Body'][0][`${action}Response`][0][
        `${action}Result`
      ][0];
    if (soapBody['erreur']['libelleErreur']) {
      throw new CBadRequestException(soapBody['erreur']['libelleErreur']);
    }
    return soapBody as T;
  }
}
