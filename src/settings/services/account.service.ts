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

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private userService: UserService,
    @InjectRepository(SyncWzagendaUserEntity)
    private syncWzagendaUserRepository: Repository<SyncWzagendaUserEntity>,
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
