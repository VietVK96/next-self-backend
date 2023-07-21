import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { LibraryActEntity } from 'src/entities/library-act.entity';
import { FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class LibraryActsService {
  constructor(
    @InjectRepository(LibraryActEntity)
    private libraryActRepo: Repository<LibraryActEntity>,
  ) {}

  async getActs(id: number, identity: UserIdentity): Promise<LibraryActEntity> {
    const where: FindOptionsWhere<LibraryActEntity> = {
      organizationId: identity.org,
      id,
    };
    const data = await this.libraryActRepo.findOne({
      where,
      relations: {
        quantities: {
          ccam: {
            conditions: true,
            family: {},
          },
        },
      },
    });
    return data;
  }
}
