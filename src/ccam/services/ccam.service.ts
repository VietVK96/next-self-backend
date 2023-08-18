import { InjectRepository } from '@nestjs/typeorm';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { parseJson } from 'src/common/util/json';
import { ErrorCode } from 'src/constants/error';
import { CcamEntity } from 'src/entities/ccam.entity';
import { DomtomMajorationEntity } from 'src/entities/domtom-majoration.entity';
import { DomtomEntity } from 'src/entities/domtom.entities';
import { Like, Repository } from 'typeorm';
import { CcamCheckCmuDto } from '../dto/ccam-check-cmu.dto';
import { CcamDomtomDto } from '../dto/ccam-domtom.dto';
import { ICcamRes } from '../response/ccam.response';
import { CheckCmuResponse } from '../response/check-cmu.response';

export class CcamServices {
  constructor(
    @InjectRepository(CcamEntity)
    private readonly ccamrepo: Repository<CcamEntity>,
    @InjectRepository(DomtomEntity)
    private readonly domtomRepo: Repository<DomtomEntity>,
    @InjectRepository(DomtomMajorationEntity)
    private readonly domtomMajorationRepo: Repository<DomtomMajorationEntity>,
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

  async checkCmu(
    id: number,
    query: CcamCheckCmuDto,
  ): Promise<CheckCmuResponse> {
    const ccam = await this.ccamrepo.findOne({
      where: { id },
      relations: {
        cmuCodifications: true,
        teeth: true,
      },
    });

    if (ccam && ccam.cmuCodifications) {
      let condition = false;
      if (!ccam.teeth || ccam.teeth.length === 0) {
        condition = true;
      } else {
        condition = true;
        for (const tooth of ccam.teeth) {
          if (tooth.forbiddenTeethCmu && query?.teeth_numbers) {
            const forbiddenTeethCmu = parseJson<number[]>(
              `[${tooth.forbiddenTeethCmu}]`,
            );

            if (
              forbiddenTeethCmu.find(
                (f) => f === query.teeth_numbers[tooth.rank],
              )
            ) {
              condition = false;
              break;
            }
          }
        }
      }

      if (condition) {
        return {
          is_cmu: true,
          cmu_codification: ccam?.cmuCodifications?.[0],
        };
      }
    }
    return {
      is_cmu: false,
    };
  }

  async domtom(
    id: number,
    query: CcamDomtomDto,
  ): Promise<DomtomMajorationEntity> {
    const ccam = await this.ccamrepo.findOne({
      where: { id: query.ccamId },
    });
    if (!ccam) {
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND_CCAM);
    }

    const domtom = await this.domtomRepo.findOne({
      where: {
        id,
      },
    });
    if (!domtom) {
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND_DOMTOM);
    }
    const domtomMajoration = await this.domtomMajorationRepo.findOne({
      where: {
        ccamId: query.ccamId,
        domtomId: id,
      },
    });
    return domtomMajoration;
  }
}
