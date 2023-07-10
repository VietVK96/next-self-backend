import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { ContactEntity } from 'src/entities/contact.entity';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';

@Injectable()
export class TrashContactService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ContactEntity)
    private readonly contactRepo: Repository<ContactEntity>,
  ) {}

  async findAll(groupId?: number, start?: number, length?: number) {
    const totalData = await this.dataSource.query(
      ` SELECT SQL_CALC_FOUND_ROWS
        CON.CON_ID id,
        CON.CON_NBR nbr,
        CON.CON_LASTNAME lastname,
        CON.CON_FIRSTNAME firstname,
        USR.USR_ID practitionerId,
        USR.USR_ABBR practitionerAbbr,
        USR.USR_LASTNAME practitionerLastname,
        USR.USR_FIRSTNAME practitionerFirstname
    FROM T_CONTACT_CON CON
    LEFT OUTER JOIN T_USER_USR USR ON USR.USR_ID = CON.USR_ID
    WHERE CON.organization_id = ?
      AND CON.deleted_at IS NOT NULL
    ORDER BY lastname, firstname, nbr`,
      [groupId],
    );

    const offSet = (start - 1) * length;
    const results = totalData.slice(offSet, offSet + length);

    return {
      data: results,
      pageIndex: start,
      pageData: results.length,
      totalData: totalData.length,
    };
  }

  async restore(groupId?: number, ids?: number[]) {
    try {
      const contacts = await this.contactRepo.find({
        where: {
          id: In(ids),
          organizationId: groupId,
          deletedAt: Not(IsNull()),
        },
        withDeleted: true,
      });

      if (contacts.length === 0)
        throw new CBadRequestException(ErrorCode.NOT_FOUND_CONTACT);
      const updateContacts = contacts.map((item) => {
        item.deletedAt = null;
        return item;
      });
      await this.contactRepo.save(updateContacts);
      return;
    } catch {
      throw new CBadRequestException(ErrorCode.NOT_FOUND_CONTACT);
    }
  }
}
