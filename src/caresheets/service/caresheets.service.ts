import { Injectable, Logger, NotAcceptableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { format } from 'date-fns';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import {
  addressFormatter,
  dateFormatter,
  inseeFormatter,
} from '../../common/formatter/index';
import { UserEntity } from 'src/entities/user.entity';
import { ContactEntity } from '../../entities/contact.entity';
import { PermissionService } from 'src/user/services/permission.service';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CaresheetsDto } from '../dto/index.dto';

@Injectable()
export class CaresheetsService {
  private readonly logger: Logger = new Logger(CaresheetsService.name);

  constructor(
    private dataSource: DataSource,
    @InjectRepository(ContactEntity)
    private patientRepository: Repository<ContactEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  /**
   * php/caresheets/store.php
   */
  async store(request: CaresheetsDto) {
    return null;
  }
}
