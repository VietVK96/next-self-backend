import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';
import { LicenseEntity } from 'src/entities/license.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';

@Injectable()
export class LicenseService {
  constructor(
    @InjectRepository(LicenseEntity)
    private licenseRepo: Repository<LicenseEntity>, // private dataSource: DataSource,
  ) {}

  async blocked(id: number) {
    const now = dayjs().format('YYYY-MM-DD');
    const data = await this.licenseRepo.count({
      where: {
        usrId: id,
        end: MoreThanOrEqual(now),
      },
    });

    return data === 0;
  }
}
