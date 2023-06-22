import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AntecedentPrestationEntity } from 'src/entities/antecedentprestation.entity';
import { FindAllAntecedentPrestationRes } from '../response/findall.antecedent-prestation.res';
import { FindAllStructDto } from '../dto/findAll.antecedent-prestation.dto';
import { SaveStructDto } from '../dto/save.antecedent-prestation.dto';
import { DeleteStructDto } from '../dto/delete.antecedent-prestation.dto';

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

  async save(payload: SaveStructDto) {
    const {
      id,
      name,
      teeth,
      contactId: patientId,
      libraryActId,
      libraryActQuantityId,
    } = payload;
    const query = `INSERT INTO T_DENTAL_INITIAL_DIN (DIN_ID, CON_ID, library_act_id, library_act_quantity_id, DIN_NAME, DIN_TOOTH)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        DIN_NAME = VALUES(DIN_NAME),
        DIN_TOOTH = VALUES(DIN_TOOTH)`;
    this.dataSource.manager.query(query, [
      id,
      patientId,
      libraryActId,
      libraryActQuantityId,
      name,
      teeth,
    ]);
  }

  async delete(payload: DeleteStructDto, organizationId: number) {
    const queryBuilder = this.dataSource
      .getRepository(AntecedentPrestationEntity)
      .createQueryBuilder('ap');
    queryBuilder
      .addSelect('p')
      .leftJoin('ap.contact', 'p')
      .where('ap.id = :id', { id: payload.id })
      .andWhere('p.group.id = :groupId', { groupId: organizationId });

    const antecedentPrestation = await queryBuilder.getOne();
    // const patient = antecedentPrestation.contact

    this.dataSource.manager.remove(antecedentPrestation);

    // @TODO Ids\Log:: write('Acte initial', $patient -> getId(), 3);
  }
}
