import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { LibraryActFamilyEntity } from 'src/entities/library-act-family.entity';
import { LibraryActEntity } from 'src/entities/library-act.entity';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { ActFamiliesDto, ActFamiliesSearchDto } from '../dto/act-families.dto';

@Injectable()
export class LibrariesService {
  constructor(
    @InjectRepository(LibraryActFamilyEntity)
    private libraryActFamilyRepo: Repository<LibraryActFamilyEntity>,
    @InjectRepository(LibraryActEntity)
    private libraryActRepo: Repository<LibraryActEntity>,
  ) {}

  /**
   * php/libraries/act-families/index.php done
   *
   */
  async getALl(
    request: ActFamiliesDto,
    identity: UserIdentity,
  ): Promise<LibraryActFamilyEntity[]> {
    const where: FindOptionsWhere<LibraryActFamilyEntity> = {
      organizationId: identity.org,
    };
    if (request.used_only) {
      where.used = 1;
    }
    const data = await this.libraryActFamilyRepo.find({
      where,
      order: {
        position: 'ASC',
        id: 'ASC',
      },
    });

    return data;
  }

  /**
   * php/libraries/act-families/acts/index.php 100%
   */
  async getAct(
    id: number,
    identity: UserIdentity,
    request: ActFamiliesDto,
  ): Promise<LibraryActEntity[]> {
    const where: FindOptionsWhere<LibraryActEntity> = {
      organizationId: identity.org,
      libraryActFamilyId: id,
    };
    if (request.used_only) {
      where.used = 1;
    }
    const data = await this.libraryActRepo.find({
      where,
      order: {
        position: 'ASC',
        id: 'ASC',
      },
    });

    return data;
  }

  async searchActFamilies(
    identity: UserIdentity,
    params: ActFamiliesSearchDto,
  ) {
    return await this.libraryActRepo?.find({
      where: {
        organizationId: identity?.org,
        label: Like(`${params?.search_term}%`),
      },
    });
  }
}
