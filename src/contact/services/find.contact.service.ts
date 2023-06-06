import { Injectable } from '@nestjs/common';
import { ContactEntity } from 'src/entities/contact.entity';
import { DataSource } from 'typeorm';
import { FindAllContactDto } from '../dto/findAll.contact.dto';
import { FindAllContactRes } from '../response/findall.contact.res';

@Injectable()
export class FindContactService {
  constructor(private dataSource: DataSource) {}

  /**
   * File: php\contact\findAll.php 21-91
   * @function main function
   *
   */
  async findAll(
    request: FindAllContactDto,
    organizationId: number,
  ): Promise<FindAllContactRes[]> {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
            CON.CON_ID as id,
            CON.CON_ID as DT_RowId,
            CON.CON_ID as value,
            CON.CON_NBR as nbr,
            CON.CON_LASTNAME as lastname,
            CON.CON_FIRSTNAME as firstname,
            CON.CON_BIRTHDAY as birthday,
            CON.CON_MSG as msg,
            CON.CON_INSEE as insee_number,
            CON.CON_INSEE_KEY as insee_number_key,
            CON.CON_COLOR as color`;
    const qr = queryBuiler.select(select).from(ContactEntity, 'CON');
    console.log(request);
    if (request.conditions && request.conditions[0].field) {
      qr.where('CON.CON_LASTNAME like :name', {
        name: request.conditions[0].value,
      });
    }
    const ab: FindAllContactRes[] = await qr.getRawMany();
    for (const a of ab) {
      if (a.phones) {
        // Check and create phome number from data
      }
      /*
      $reliabilityStm->execute(array($record['id'], $practitionerId));
      $record['reliability'] = $reliabilityStm->fetchColumn();
      $reliabilityStm->closeCursor();
      */
      a.reliability = 1;
    }
    return ab;
  }
}
