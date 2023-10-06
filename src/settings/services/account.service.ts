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
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import { firstValueFrom } from 'rxjs';
import { parseStringPromise } from 'xml2js';
import { format } from 'date-fns';
import { FindAccountRes } from 'src/setting/account/response/find.account.res';

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

  async find(userId: number): Promise<FindAccountRes> {
    const users = await this.dataSource.query(
      `
    SELECT
				T_USER_USR.USR_ID AS id,
				T_USER_USR.ADR_ID AS address_id,
				T_USER_USR.USR_ADMIN AS admin,
				T_USER_USR.USR_LOG AS login,
				T_USER_USR.USR_ABBR AS short_name,
				T_USER_USR.USR_LASTNAME AS lastname,
				T_USER_USR.USR_FIRSTNAME AS firstname,
                T_USER_USR.color,
				T_USER_USR.USR_MAIL AS email,
				T_USER_USR.USR_PHONE_NUMBER AS phone_home_number,
				T_USER_USR.USR_GSM AS phone_mobile_number,
				T_USER_USR.USR_FAX_NUMBER AS fax_number,
				T_USER_USR.USR_NUMERO_FACTURANT AS adeli,
				T_USER_USR.finess AS finess,
                T_USER_USR.USR_RATE_CHARGES AS taxes,
                social_security_reimbursement_base_rate,
                social_security_reimbursement_rate,
				T_USER_USR.USR_AGA_MEMBER AS aga_member,
				T_USER_USR.freelance,
				T_USER_USR.USR_DEPASSEMENT_PERMANENT AS droit_permanent_depassement,
				T_USER_USR.USR_SIGNATURE AS signature,
				T_USER_USR.USR_TOKEN AS token,
				T_USER_USR.USR_BCB_LICENSE AS bcbdexther_license,
				T_LICENSE_LIC.LIC_END AS end_of_license_at,
                T_USER_TYPE_UST.UST_PRO AS professional,
                T_USER_PREFERENCE_USP.signature_automatic,
                user_medical.rpps_number AS rpps_number
			FROM T_USER_USR
            JOIN T_USER_PREFERENCE_USP ON T_USER_PREFERENCE_USP.USR_ID = T_USER_USR.USR_ID
			LEFT OUTER JOIN T_LICENSE_LIC ON T_LICENSE_LIC.USR_ID = T_USER_USR.USR_ID AND T_USER_USR.USR_CLIENT = 0
			LEFT OUTER JOIN T_USER_TYPE_UST ON T_USER_TYPE_UST.UST_ID = T_USER_USR.UST_ID
			LEFT OUTER JOIN user_medical ON user_medical.user_id = T_USER_USR.USR_ID
			WHERE T_USER_USR.USR_ID = ?`,
      [userId],
    );

    const user = users.length > 0 ? users[0] : {};
    const address = await this.dataSource.query(
      `
      SELECT
                  T_ADDRESS_ADR.ADR_ID AS id,
                  T_ADDRESS_ADR.ADR_STREET AS street,
                  T_ADDRESS_ADR.ADR_STREET_COMP AS street_comp,
                  T_ADDRESS_ADR.ADR_ZIP_CODE AS zip_code,
                  T_ADDRESS_ADR.ADR_CITY AS city,
                  T_ADDRESS_ADR.ADR_COUNTRY AS country,
                  T_ADDRESS_ADR.ADR_COUNTRY_ABBR AS country_code
              FROM T_ADDRESS_ADR
              WHERE T_ADDRESS_ADR.ADR_ID = ?`,
      user.address_id,
    );
    user.address = address[0];
    delete user.address_id;

    const connections = await this.dataSource.query(
      `
    SELECT
				T_USER_CONNECTION_USC.USC_IP AS ip,
				T_USER_CONNECTION_USC.USC_SESSION_ID AS session_id,
				T_USER_CONNECTION_USC.USC_AGENT AS agent,
				T_USER_CONNECTION_USC.created_at
			FROM T_USER_CONNECTION_USC
			WHERE T_USER_CONNECTION_USC.USR_ID = ?
			ORDER BY T_USER_CONNECTION_USC.created_at DESC
			LIMIT 1`,
      [userId],
    );

    return {
      user,
      userConnection: connections.length > 0 ? connections[0] : {},
    };
  }

  async fetchAccountWzagenda(identity: UserIdentity): Promise<WzagendaRes> {
    try {
      const [user, wzAgendaUser] = await Promise.all([
        this.find(identity?.id),
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
  ): Promise<SyncWzagendaUserEntity> {
    if (!req?.calendarId) {
      throw new CBadRequestException(ErrorCode?.NOT_FOUND_CALENDAR_ID);
    }
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="https://secure.wz-agenda.net/webservices/3.1/server.php#wzcalendar" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><SOAP-ENV:Body><ns1:checkSubscriptionId><is xsi:type="xsd:string">${req?.calendarId}</is></ns1:checkSubscriptionId></SOAP-ENV:Body></SOAP-ENV:Envelope>`;
    const res = await this.sendRequestWzAgenda<any>(xml);
    if (res == '0') {
      throw new CBadRequestException(ErrorCode.CAN_NOT_REQUEST_TO_WZ_AGENDA);
    }
    // Why use any ?
    const params: {
      id?: number;
    } = {};
    // Do wzAgendaUser used any more?
    // const wzAgendaUser = await this.syncWzagendaUserRepository.findOne({
    //   where: { id: identity?.id },
    // });
    params.id = identity?.id;
    return await this.syncWzagendaUserRepository.save({
      ...params,
      calendarId: req?.calendarId,
      lastModified: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    });
  }

  private async sendRequestWzAgenda<T>(
    contents: string,
    mock?: string,
  ): Promise<T> {
    const url = this.config.get<string>('app.wzagenda.wsdl');
    const headers = {
      'Content-Type': 'text/xml; charset=utf-8',
    };
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    let { data } = await firstValueFrom(
      this.httpService.post(url, contents, {
        headers,
        httpsAgent,
      }),
    );

    if (mock && mock !== '') {
      data = mock;
    }
    data = data.replaceAll('xsi:nil="true"', '');
    const resJson = await parseStringPromise(data);
    if (
      !resJson ||
      !resJson['SOAP-ENV:Envelope'] ||
      !resJson['SOAP-ENV:Envelope']['SOAP-ENV:Body'] ||
      !resJson['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0] ||
      !resJson['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0][
        'ns4:checkSubscriptionIdResponse'
      ] ||
      !resJson['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0][
        'ns4:checkSubscriptionIdResponse'
      ][0] ||
      !resJson['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0][
        'ns4:checkSubscriptionIdResponse'
      ][0]['success'] ||
      !resJson['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0][
        'ns4:checkSubscriptionIdResponse'
      ][0]['success'][0]
    ) {
      throw new CBadRequestException(ErrorCode.CAN_NOT_REQUEST_TO_WZ_AGENDA);
    }
    return resJson['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0][
      'ns4:checkSubscriptionIdResponse'
    ][0]['success'][0]['_'];
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
      const GOOGLE_CLIENT_ID = this.config.get<string>(
        'app.googleCalendar.clientId',
      );
      const GOOGLE_CLIENT_SECRET = this.config.get<string>(
        'app.googleCalendar.clientSecret',
      );
      const client = this.config.get<string>('app.googleCalendar.clientSide');

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
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }
}
