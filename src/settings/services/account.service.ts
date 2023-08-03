import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { SyncWzagendaUserEntity } from 'src/entities/sync-wzagenda-user.entity';
import { WzagendaRes } from '../res/index.res';

@Injectable()
export class AccountService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(SyncWzagendaUserEntity)
    private syncWzagendaUserRepository: Repository<SyncWzagendaUserEntity>,
  ) {}

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

  async fetchAccountPractitioners(identity: UserIdentity): Promise<any> {
    try {
      // const [user, wzAgendaUser] = await Promise.all([
      //   this.userRepository.findOne({ where: { id: identity?.id } }),
      //   this.syncWzagendaUserRepository.findOne({
      //     where: { id: identity?.id },
      //   }),
      // ]);
      const accountStatus = 5;
      const query = `
      SELECT
      user.*,medical.*
  FROM T_USER_USR user
  JOIN user_medical medical on user.USR_ID = medical.user_id
  WHERE user.USR_CLIENT <> ?
  ORDER BY user.USR_LASTNAME ASC, user.USR_FIRSTNAME ASC
  `;
      const practioners = await this.dataSource.query(query, [accountStatus]);
      // return { user, wzAgendaUser };
      console.log(practioners);
    } catch (err) {
      throw new CBadRequestException(ErrorCode?.NOT_FOUND);
    }
  }
}
