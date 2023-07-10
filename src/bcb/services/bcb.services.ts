import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { EntityManager } from 'typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { BcbDto } from '../dto/bcb.dto';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { ErrorCode } from 'src/constants/error';
import { fakeData } from '../data/bcb.data';

@Injectable()
export class BcbServices {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async findAll(payload: BcbDto) {
    if (payload.license === 999999998) {
      throw new CNotFoundRequestException(ErrorCode.STATUS_NOT_FOUND); //Bad Request
    }
    //TODO: dumping data
    return fakeData;
  }
}
