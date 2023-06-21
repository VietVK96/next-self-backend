import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AntecedentPrestationEntity } from 'src/entities/antecedentprestation.entity';
import { FindAllAntecedentPrestationRes } from '../response/findall.antecedent-prestation.res';
import { FindAllStructDto } from '../dto/findAll.antecedent-prestation.dto';

@Injectable()
export class AntecedentPrestationService {
  constructor(private dataSource: DataSource) {}

  async findAll(
    payload: FindAllStructDto,
    organizationId: number,
  ): Promise<FindAllAntecedentPrestationRes[]> {
    const queryBuilder = this.dataSource
      .getRepository(AntecedentPrestationEntity)
      .createQueryBuilder('ap');
    queryBuilder
      .select('ap.id')
      .addSelect('ap.name')
      .addSelect('ap.teeth')
      .leftJoin('ap.contact', 'p')
      .where('p.id = :id', { id: payload.id })
      .andWhere('p.group.id = :groupId', { groupId: organizationId })
      .orderBy('ap.createdAt', 'DESC');
    const result: FindAllStructDto[] = await queryBuilder.getMany();
    return result;
  }
}
