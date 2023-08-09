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
import { google } from 'googleapis';
import { UpdateGoogleCalendarDto } from '../dtos/google-calendar.dto';
import { SuccessResponse } from 'src/common/response/success.res';
import { AccountStatusEnum } from 'src/enum/account-status.enum';
import { AccountWzAgendaSubmitDto } from '../dtos/wzagenda.dto';
import { WzAgendaService } from './wzagenda.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import { constants } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { parseStringPromise } from 'xml2js';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private userService: UserService,
    @InjectRepository(SyncWzagendaUserEntity)
    private syncWzagendaUserRepository: Repository<SyncWzagendaUserEntity>,
    private config: ConfigService,
    private readonly httpService: HttpService,
    private dataSource: DataSource,
  ) {}

  async findGoogleByUser(userId: number) {
    const stm = `
    SELECT
				T_SYNC_GOOGLE_USER_SGU.SGU_ACCESS_TOKEN AS access_token,
				T_SYNC_GOOGLE_USER_SGU.SGU_TOKEN AS token,
				T_SYNC_GOOGLE_USER_SGU.SGU_CALENDAR_ID AS resource_id_partner,
				T_SYNC_GOOGLE_USER_SGU.SGU_ACTIVATED_ON AS activated_at
			FROM T_SYNC_GOOGLE_USER_SGU
			WHERE T_SYNC_GOOGLE_USER_SGU.USR_ID = ?`;

    const googleList = await this.dataSource.query(stm, [userId]);
    return googleList[0];
  }

  async fetchAccountWzagenda(identity: UserIdentity): Promise<WzagendaRes> {
    try {
      const [user, wzAgendaUser] = await Promise.all([
        this.userRepository.findOne({ where: { id: identity?.id } }),
        this.syncWzagendaUserRepository.findOne({
          where: { id: identity?.id },
        }),
      ]);
      return { user, wzAgendaUser };
    } catch (err) {
      throw new CBadRequestException(ErrorCode?.NOT_FOUND);
    }
  }

  async accountWzAgendaSubmit(
    identity: UserIdentity,
    req: AccountWzAgendaSubmitDto,
  ): Promise<any> {
    try {
      if (!req?.calendarId) {
        throw new CBadRequestException(ErrorCode?.NOT_FOUND_CALENDAR_ID);
      }
      let wzAgendaUser = await this.syncWzagendaUserRepository.findOne({
        where: { id: identity?.id },
      });
      if (!wzAgendaUser) {
        const user = await this.userRepository.findOne({
          where: { id: identity?.id },
        });
        wzAgendaUser = await this.syncWzagendaUserRepository.save({
          id: identity?.id,
          calendarId: req?.calendarId,
        });
      }

      const xml = `<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="https://secure.wz-agenda.net/webservices/3.1/server.php#wzcalendar" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <SOAP-ENV:Body>
          <ns1:checkSubscriptionId>
            <is xsi:type="xsd:string">${req?.calendarId}</is>
          </ns1:checkSubscriptionId>
        </SOAP-ENV:Body>
      </SOAP-ENV:Envelope>`;
      const data = await this.sendRequest<any>('ListeChangementEtat', xml);
      return null;
    } catch (err) {
      throw new CBadRequestException(ErrorCode?.NOT_FOUND);
    }
  }

  private async sendRequest<T>(
    action: string,
    contents: string,
    mock?: string,
  ): Promise<T> {
    const url = this.config.get<string>('app.wzagenda.wsdl');

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

  async fetchAccountPractitioners(organizationId: number) {
    const user = await this.userRepository.find({
      where: {
        client: Not(AccountStatusEnum.TERMINATED),
        organizationId,
      },
      relations: {
        medical: true,
      },
      order: {
        lastname: 'ASC',
        firstname: 'ASC',
      },
    });
    return user
      .filter((x) => x.medical)
      .map((y) => {
        return {
          id: y?.id,
          lastname: y?.lastname,
          firstname: y?.firstname,
          medical: y?.medical,
        };
      });
  }

  async getGoogleCalendar(userId: number) {
    if (!userId) throw new CBadRequestException(ErrorCode.FORBIDDEN);
    const user = await this.userService.find(userId);
    const google = await this.findGoogleByUser(userId);
    return {
      professional: user?.professional,
      google,
    };
  }

  async updateGoogleCalendar(
    identity: UserIdentity,
    body: UpdateGoogleCalendarDto,
  ): Promise<SuccessResponse> {
    try {
      if (!body?.code || !body?.google_calendar_id) {
        throw new CBadRequestException(ErrorCode.CALENDAR_ID_IS_REQUIRED);
      }
      const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
      const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
      const client = process.env.CLIENT_SIDE;

      const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        client,
      );

      const res = await oauth2Client.getToken(body?.code);
      const { access_token, refresh_token } = res.tokens;

      if (!refresh_token)
        throw new CBadRequestException(
          ErrorCode.CANNOT_GET_CALENDAR_INFORMATION,
        );

      const query = `
        INSERT INTO T_SYNC_GOOGLE_USER_SGU (USR_ID, SGU_ACCESS_TOKEN, SGU_TOKEN, SGU_CALENDAR_ID, SGU_ACTIVATED_ON)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP())
        ON DUPLICATE KEY UPDATE
        SGU_ACCESS_TOKEN = VALUES(SGU_ACCESS_TOKEN),
        SGU_TOKEN = VALUES(SGU_TOKEN),
        SGU_CALENDAR_ID = VALUES(SGU_CALENDAR_ID),
        SGU_GOOGLE_LAST_MODIFIED = SGU_LAST_MODIFIED`;
      await this.dataSource.query(query, [
        identity?.id,
        access_token,
        refresh_token,
        body?.google_calendar_id,
      ]);
      return {
        success: true,
      };
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }
}
