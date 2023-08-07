import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { SyncWzagendaUserEntity } from 'src/entities/sync-wzagenda-user.entity';
import { WzagendaRes } from '../res/index.res';
import { AccountStatusEnum } from 'src/enum/account-status.enum';

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
}
