import { Injectable } from '@nestjs/common';
import { FindAllContactDto } from 'src/contact/dto/findAll.contact.dto';
import { DataSource } from 'typeorm';
import { FindAllMailRes } from '../response/findAllMail.res';
import { FindAllMailDto } from '../dto/findAllMail.dto';

@Injectable()
export class MailService {
  constructor(private dataSource: DataSource) {}

  async findAll(doctorId: number) {
    const pageSize = 100;
    const offSet = 0;
    var data: FindAllMailDto[];
    if (doctorId) {
      data = await this.dataSource.query(
        ` SELECT SQL_CALC_FOUND_ROWS
            T_LETTERS_LET.LET_ID AS id,
            T_LETTERS_LET.USR_ID AS doctor_id,
            T_LETTERS_LET.LET_TITLE AS title,
            T_LETTERS_LET.LET_TYPE AS type,
            T_LETTERS_LET.favorite,
            T_LETTERS_LET.created_at,
            T_LETTERS_LET.updated_at
        FROM T_LETTERS_LET
        LEFT OUTER JOIN T_USER_USR ON T_USER_USR.USR_ID = T_LETTERS_LET.USR_ID
        WHERE T_LETTERS_LET.CON_ID IS NULL
        AND T_LETTERS_LET.CPD_ID IS NULL
        AND T_LETTERS_LET.LET_TITLE LIKE CONCAT(?, '%')
        AND (
                T_LETTERS_LET.USR_ID IS NULL OR
                T_LETTERS_LET.USR_ID = ?
            )
        ORDER BY favorite DESC
        LIMIT ?
        OFFSET ?`,
        ['', doctorId, pageSize, offSet],
      );
    } else {
      data = await this.dataSource.query(
        `SELECT SQL_CALC_FOUND_ROWS t1.*
        FROM (
            SELECT
                T_LETTERS_LET.LET_ID AS id,
                T_LETTERS_LET.USR_ID AS doctor_id,
                T_LETTERS_LET.LET_TITLE AS title,
                T_LETTERS_LET.LET_TYPE AS type,
                T_LETTERS_LET.favorite,
                T_LETTERS_LET.created_at,
                T_LETTERS_LET.updated_at 
            FROM T_LETTERS_LET
            WHERE T_LETTERS_LET.CON_ID IS NULL
              AND T_LETTERS_LET.CPD_ID IS NULL
              AND T_LETTERS_LET.USR_ID IS NULL
            UNION
            SELECT
                T_LETTERS_LET.LET_ID AS id,
                T_LETTERS_LET.USR_ID AS doctor_id,
                T_LETTERS_LET.LET_TITLE AS title,
                T_LETTERS_LET.LET_TYPE AS type,
                T_LETTERS_LET.favorite,
                T_LETTERS_LET.created_at,
                T_LETTERS_LET.updated_at 
            FROM T_LETTERS_LET
            JOIN T_USER_USR
            WHERE T_LETTERS_LET.CON_ID IS NULL
              AND T_LETTERS_LET.CPD_ID IS NULL
              AND T_LETTERS_LET.USR_ID = T_USER_USR.USR_ID
              AND T_USER_USR.organization_id = ?
        ) AS t1
        ORDER BY favorite DESC, title`,
        [1],
      );
    }

    const draw = '1';

    const result: FindAllMailRes = {
      draw,
      recordsTotal: data.length,
      recordsFiltered: data.length,
      data,
    };
    return result;
  }
}
