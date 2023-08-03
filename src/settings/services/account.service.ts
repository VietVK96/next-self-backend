import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { SyncWzagendaUserEntity } from 'src/entities/sync-wzagenda-user.entity';
import { WzagendaRes } from '../res/index.res';
import { UserService } from 'src/user/services/user.service';

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

  async getGoogleCalendar(userId: number) {
    if (!userId) throw new CBadRequestException(ErrorCode.FORBIDDEN);
    const user = await this.userService.find(userId);
    const google = await this.findGoogleByUser(userId);
    return {
      user,
      google,
    };
  }
}
