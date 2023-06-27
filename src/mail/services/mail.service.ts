import { LettersEntity } from './../../entities/letters.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { FindAllMailRes } from '../response/findAllMail.res';
import { FindAllMailDto } from '../dto/findAllMail.dto';
import { HeaderFooterInfo, PersonInfoDto } from '../dto/relationClass.dto';
import { FindMailRes } from '../response/findMail.res';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUpdateMailDto } from '../dto/createUpdateMail.dto';
import { CreateUpdateMailRes } from '../response/createUpdateMail.res';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';

@Injectable()
export class MailService {
  constructor(
    @InjectRepository(LettersEntity)
    private lettersRepo: Repository<LettersEntity>,
    private dataSource: DataSource,
  ) {}

  //php\mail\findAll.php
  async findAll(
    draw: string,
    pageIndex: number,
    docId: number,
    groupId: number,
    search: string,
  ): Promise<FindAllMailRes> {
    if (!search) search = '';
    const pageSize = 100;

    const doctor: PersonInfoDto[] = await this.dataSource.query(`SELECT
        T_USER_USR.USR_ID AS id,
        T_USER_USR.USR_LASTNAME AS lastname,
        T_USER_USR.USR_FIRSTNAME AS firstname,
        T_USER_USR.USR_MAIL AS email
    FROM T_USER_USR`);

    let data: FindAllMailDto[];
    if (docId) {
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
        LIMIT ?`,
        [search, docId, pageSize],
      );
      for (const iterator of data) {
        if (iterator.doctor_id !== null && docId)
          iterator.doctor = doctor.find(
            (item) => item.id === iterator.doctor_id,
          );
      }
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
        [groupId],
      );
      for (const iterator of data) {
        if (iterator.doctor_id !== null) {
          const doctorGroup: PersonInfoDto = doctor.find(
            (item) => item.id === iterator.doctor_id,
          );
          iterator.doctor = doctorGroup;
        }
      }
    }

    const offSet = (pageIndex - 1) * pageSize;
    const dataPaging = data.slice(offSet, offSet + pageSize);

    const result: FindAllMailRes = {
      draw,
      recordsTotal: dataPaging.length,
      recordsFiltered: dataPaging.length,
      totalData: data.length,
      data: dataPaging,
    };
    return result;
  }

  //php\mail\find.php
  async findById(id: number) {
    const qr = await this.lettersRepo.findOne({
      where: { id: id },
    });

    if (!qr) throw new CNotFoundRequestException(`Mail Not found`);

    const doctor: PersonInfoDto[] = await this.dataSource.query(
      `SELECT
        T_USER_USR.USR_ID AS id,
        T_USER_USR.USR_LASTNAME AS lastname,
        T_USER_USR.USR_FIRSTNAME AS firstname,
        T_USER_USR.USR_MAIL AS email
    FROM T_USER_USR
    WHERE T_USER_USR.USR_ID = ?`,
      [qr.usrId],
    );

    const patient: PersonInfoDto[] = await this.dataSource.query(
      `SELECT
        T_CONTACT_CON.CON_ID AS id,
        T_CONTACT_CON.CON_LASTNAME AS lastname,
        T_CONTACT_CON.CON_FIRSTNAME AS firstname,
        T_CONTACT_CON.CON_MAIL AS email
    FROM T_CONTACT_CON
    WHERE T_CONTACT_CON.CON_ID = ?`,
      [qr.conId],
    );

    const conrrespondent: PersonInfoDto[] = await this.dataSource.query(
      `SELECT
        T_CORRESPONDENT_CPD.CPD_ID AS id,
        T_CORRESPONDENT_CPD.CPD_LASTNAME AS lastname,
        T_CORRESPONDENT_CPD.CPD_FIRSTNAME AS firstname,
        T_CORRESPONDENT_CPD.CPD_MAIL AS email
    FROM T_CORRESPONDENT_CPD
    WHERE T_CORRESPONDENT_CPD.CPD_ID = ?`,
      [qr.cpdId],
    );

    const header: HeaderFooterInfo[] = await this.dataSource.query(
      `SELECT 
        T_LETTERS_LET.LET_ID AS id,
        T_LETTERS_LET.LET_TITLE AS title,
        T_LETTERS_LET.LET_MSG AS body,
        T_LETTERS_LET.height AS height
      FROM T_LETTERS_LET
      WHERE T_LETTERS_LET.LET_ID = ?
      `,
      [qr.headerId],
    );

    const footer: HeaderFooterInfo[] = await this.dataSource.query(
      `SELECT 
        T_LETTERS_LET.LET_ID AS id,
        T_LETTERS_LET.LET_TITLE AS title,
        T_LETTERS_LET.LET_MSG AS body,
        T_LETTERS_LET.height AS height
      FROM T_LETTERS_LET
      WHERE T_LETTERS_LET.LET_ID = ?
      `,
      [qr.footerId],
    );

    const result: FindMailRes = {
      id: qr.id,
      type: qr.type,
      title: qr.title,
      body: qr.body,
      footer_content: qr.footerContent,
      footer_height: qr.footerHeight,
      height: qr.height,
      favorite: qr.favorite,
      created_at: qr.createdAt,
      updated_at: qr.updatedAt,
      doctor: doctor.length === 0 ? null : doctor[0],
      patient: patient.length === 0 ? null : patient[0],
      conrrespondent: conrrespondent.length <= 0 ? null : conrrespondent[0],
      header: header.length === 0 ? null : header[0],
      footer: footer.length === 0 ? null : footer[0],
    };

    return result;
  }

  //php\mail\store.php
  async duplicate(payload: CreateUpdateMailDto): Promise<CreateUpdateMailRes> {
    const qr = await this.lettersRepo.query(
      `INSERT INTO T_LETTERS_LET
      ( USR_ID, header_id, footer_id, LET_TITLE, LET_MSG, footer_content, 
        footer_height, LET_TYPE, height, favorite, created_at, updated_at) 
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        payload?.doctor === null ? null : payload?.doctor,
        payload?.header === null ? null : payload?.header,
        payload?.footer === null ? null : payload?.footer,
        payload?.title,
        payload?.body,
        payload?.footer_content,
        payload?.footer_height,
        payload?.type,
        payload?.height,
        payload?.favorite,
        payload?.created_at,
        payload?.updated_at,
      ],
    );
    const dataRes = {
      id: qr.insertId,
      ...payload,
    };
    return dataRes;
  }
}
