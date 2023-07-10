import { Injectable } from '@nestjs/common';
import { SaveContraindicationDto } from '../dto/contraindication.contact.dto';
import { DataSource } from 'typeorm';

@Injectable()
export class ContraindicationContactService {
  constructor(private dataSource: DataSource) {}

  async saveContraindication(payload: SaveContraindicationDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // suppression des contre-indications précédentes
      await queryRunner.query(
        `DELETE FROM T_CONTACT_CONTRAINDICATION_COC WHERE CON_ID = ?`,
        [payload.id],
      );

      // ajout des nouvelles contre-indications
      if (payload.contraindications && payload.contraindications.length > 0) {
        const values = [];
        payload.contraindications.forEach((id) => {
          values.push({
            CON_ID: payload.id,
            MLC_ID: id,
          });
        });

        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into('T_CONTACT_CONTRAINDICATION_COC')
          .values(values)
          .execute();
      }

      // modification du message du patient
      await queryRunner.query(
        `UPDATE T_CONTACT_CON SET CON_MSG = ? WHERE CON_ID = ?`,
        [payload.msg, payload.id],
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
}
