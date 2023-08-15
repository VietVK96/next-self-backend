import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { LibraryActEntity } from 'src/entities/library-act.entity';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { AcFamiliesCopyRes } from '../res/act-families.res';

@Injectable()
export class LibraryActsService {
  constructor(
    private dataSource: DataSource,
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
  async sortableLibraryAct(payload: AcFamiliesCopyRes[]) {
    const ids = payload.map((item) => item.id);
    let i = 0;
    for (const id of ids) {
      try {
        await this.dataSource
          .createQueryBuilder()
          .update(LibraryActEntity)
          .set({ position: i })
          .where({ id })
          .execute();
        i++;
      } catch (error) {}
    }
    return;
  }
}
