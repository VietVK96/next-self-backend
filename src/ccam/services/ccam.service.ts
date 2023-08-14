import { InjectRepository } from '@nestjs/typeorm';
import { CcamEntity } from 'src/entities/ccam.entity';
import { Like, Repository } from 'typeorm';
import { ICcamRes } from '../response/ccam.response';

export class CcamServices {
  constructor(
    @InjectRepository(CcamEntity)
    private readonly ccamrepo: Repository<CcamEntity>,
  ) {}

  async searchByName(search_term: string): Promise<ICcamRes[]> {
    const ccams = await this.ccamrepo.find({
      where: { name: Like(`%${search_term}%`) },
      take: 100,
      order: { name: 'ASC' },
      relations: ['family'],
    });

    const res: ICcamRes[] = ccams.map((ccam) => {
      const item: ICcamRes = {
        id: ccam.id,
        family: {
          id: ccam.ccamFamilyId,
          code: ccam.family.code,
          label: ccam.family.label,
        },
        code: ccam.code,
        name: ccam.name,
        short_name: ccam.shortName,
        created_on: ccam.createdOn,
      };
      return item;
    });
    return res;
  }

  async show(id: number) {
    const ccams = await this.ccamrepo.findOne({
      where: { id: id },
      relations: ['family', 'conditions', 'unitPrices'],
    });

    return ccams;
  }
}
