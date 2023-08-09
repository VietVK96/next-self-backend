import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Not } from 'typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { SyncWzagendaUserEntity } from 'src/entities/sync-wzagenda-user.entity';
import { WzagendaRes } from '../res/index.res';
import { UserService } from 'src/user/services/user.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import * as https from 'https';
import { constants } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { parseStringPromise } from 'xml2js';

@Injectable()
export class WzAgendaService {
  constructor(
    private config: ConfigService,
    private readonly httpService: HttpService,
    private dataSource: DataSource,
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
