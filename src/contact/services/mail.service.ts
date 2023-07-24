import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FindAllMailRes } from '../response/findAll.mail.res';
import { FindAllMailDto } from '../dto/findAll.mail.contact';

interface LetterI {
  id: number;
  doctor_id: number;
  title: string;
  type: string;
  favorite: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class MailService {
  constructor(private dataSource: DataSource) {}

  async findAll(payload: FindAllMailDto): Promise<FindAllMailRes> {
    let direction = '';
    let usableOrderBy = '';
    if (payload.order_by) {
      const hasLeadingDash = payload.order_by.indexOf('-') === 0;
      direction = hasLeadingDash ? 'DESC' : 'ASC';
      usableOrderBy = hasLeadingDash
        ? payload.order_by.substring(1)
        : payload.order_by;
    }

    const statements: LetterI[] = await this.dataSource.query(
      `
    SELECT SQL_CALC_FOUND_ROWS
        T_LETTERS_LET.LET_ID AS id,
        T_LETTERS_LET.USR_ID AS doctor_id,
        T_LETTERS_LET.LET_TITLE AS title,
        T_LETTERS_LET.LET_TYPE AS type,
        T_LETTERS_LET.favorite,
        T_LETTERS_LET.created_at,
        T_LETTERS_LET.updated_at
    FROM T_LETTERS_LET
    WHERE T_LETTERS_LET.CON_ID = ?
    ORDER BY favorite DESC, ${
      payload.order_by ? `${usableOrderBy} ${direction}` : null
    } 
    LIMIT ?
    OFFSET ?`,
      [payload.id, payload.length, payload.start],
    );

    const count: { cnt: number }[] = await this.dataSource.query(
      `SELECT FOUND_ROWS() as cnt`,
    );
    const mails = [];
    const promises = [];
    for (const statement of statements) {
      promises.push(
        this.dataSource.query(
          `SELECT
      T_USER_USR.USR_ID AS id,
      T_USER_USR.USR_LASTNAME AS lastname,
      T_USER_USR.USR_FIRSTNAME AS firstname,
      T_USER_USR.USR_MAIL AS email
      FROM T_USER_USR
      WHERE T_USER_USR.USR_ID = ?`,
          [statement.doctor_id],
        ),
      );
    }
    const results = await Promise.all(promises);
    for (let i = 0; i < statements.length; i++) {
      statements[i]['doctor'] = results[i].length !== 0 ? results[i][0] : null;
      mails.push(statements[i]);
    }
    return {
      draw: payload.draw.toString(),
      recordsTotal: count[0].cnt,
      recordsFiltered: count[0].cnt,
      data: mails,
    };
  }
}
