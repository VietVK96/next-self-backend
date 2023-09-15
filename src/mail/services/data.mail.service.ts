import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { FindAllMailRes } from '../response/findAllMail.res';
import { HeaderFooterInfo, PersonInfoDto } from '../dto/relationClass.dto';
import { FindAllMailDto } from '../dto/findAllMail.dto';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { InjectRepository } from '@nestjs/typeorm';
import { LettersEntity } from 'src/entities/letters.entity';
import { FindMailRes } from '../response/findMail.res';
import { CreateUpdateMailDto } from '../dto/createUpdateMail.dto';
import { CreateUpdateMailRes } from '../response/createUpdateMail.res';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { UserEntity } from 'src/entities/user.entity';
import { ErrorCode } from 'src/constants/error';

@Injectable()
export class DataMailService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(LettersEntity)
    private lettersRepo: Repository<LettersEntity>,
  ) {}

  // php/mail/findAll.php
  async findAll(
    draw: string,
    pageIndex: number,
    docId: number,
    groupId: number,
    search: string,
    practitionerId: string,
    orderBy?: string,
  ): Promise<FindAllMailRes> {
    const hasLeadingDash = orderBy && orderBy.startsWith('-');
    const usableOrderBy = hasLeadingDash
      ? orderBy.substring(1)
      : orderBy ?? 'title';
    const direction = hasLeadingDash ? 'DESC' : 'ASC';
    if (!search) search = '';
    const pageSize = 100;
    const doctors: PersonInfoDto[] = await this.dataSource.query(`SELECT
        T_USER_USR.USR_ID AS id,
        T_USER_USR.USR_LASTNAME AS lastname,
        T_USER_USR.USR_FIRSTNAME AS firstname,
        T_USER_USR.USR_MAIL AS email
    FROM T_USER_USR`);

    let mails: FindAllMailDto[];

    if (!practitionerId) {
      mails = await this.dataSource.query(
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
        ORDER BY favorite DESC, ${usableOrderBy} ${direction}`,
        [search, docId],
      );
      for (const iterator of mails) {
        if (iterator.doctor_id !== null && docId)
          iterator.doctor = doctors.find(
            (item) => item.id === iterator.doctor_id,
          );
      }
    } else {
      mails = await this.dataSource.query(
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
      for (const iterator of mails) {
        if (iterator.doctor_id !== null) {
          const doctorGroup: PersonInfoDto = doctors.find(
            (item) => item.id === iterator.doctor_id,
          );
          iterator.doctor = doctorGroup;
        }
      }
    }

    const startIndex = pageIndex === -1 ? 0 : (pageIndex - 1) * pageSize;
    const endIndex = pageIndex === -1 ? mails.length : startIndex + pageSize;
    const mailPaging = mails.slice(startIndex, endIndex);

    return {
      draw,
      recordsTotal: pageIndex === -1 ? mails.length : mailPaging.length,
      recordsFiltered: pageIndex === -1 ? mails.length : mailPaging.length,
      totalData: mails.length,
      data: mailPaging,
      orderBy: orderBy,
    };
  }

  // php/mail/find.php
  async findById(id: number) {
    const qr = await this.lettersRepo.findOne({
      where: { id: id },
      relations: {
        user: {
          address: true,
        },
      },
    });

    if (!qr) return new CNotFoundRequestException(`Mail Not found`);

    const doctors: PersonInfoDto[] = await this.dataSource.query(
      `SELECT
        T_USER_USR.USR_ID AS id,
        T_USER_USR.USR_LASTNAME AS lastname,
        T_USER_USR.USR_FIRSTNAME AS firstname,
        T_USER_USR.USR_MAIL AS email
    FROM T_USER_USR
    WHERE T_USER_USR.USR_ID = ?`,
      [qr.usrId],
    );

    const patients: PersonInfoDto[] = await this.dataSource.query(
      `SELECT
        T_CONTACT_CON.CON_ID AS id,
        T_CONTACT_CON.CON_LASTNAME AS lastname,
        T_CONTACT_CON.CON_FIRSTNAME AS firstname,
        T_CONTACT_CON.CON_MAIL AS email
    FROM T_CONTACT_CON
    WHERE T_CONTACT_CON.CON_ID = ?`,
      [qr.conId],
    );

    const conrrespondents: PersonInfoDto[] = await this.dataSource.query(
      `SELECT
        T_CORRESPONDENT_CPD.CPD_ID AS id,
        T_CORRESPONDENT_CPD.CPD_LASTNAME AS lastname,
        T_CORRESPONDENT_CPD.CPD_FIRSTNAME AS firstname,
        T_CORRESPONDENT_CPD.CPD_MAIL AS email
    FROM T_CORRESPONDENT_CPD
    WHERE T_CORRESPONDENT_CPD.CPD_ID = ?`,
      [qr.cpdId],
    );

    const headers: HeaderFooterInfo[] = await this.dataSource.query(
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

    const footers: HeaderFooterInfo[] = await this.dataSource.query(
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

    if (qr?.user?.password) delete qr.user.password;
    const mail: FindMailRes = {
      id: qr.id,
      type: qr.type,
      title: qr.title,
      body: qr.msg,
      footer_content: qr.footerContent,
      footer_height: qr.footerHeight,
      height: qr.height,
      favorite: qr.favorite,
      created_at: qr.createdAt,
      updated_at: qr.updatedAt,
      doctor: doctors.length === 0 ? null : doctors[0],
      patient: patients.length === 0 ? null : patients[0],
      conrrespondent: conrrespondents.length <= 0 ? null : conrrespondents[0],
      header: headers.length === 0 ? null : headers[0],
      footer: footers.length === 0 ? null : footers[0],
      user: qr.user,
    };

    return mail;
  }

  // php/mail/store.php
  async duplicate(
    payload: CreateUpdateMailDto,
    doctorId?: number,
  ): Promise<CreateUpdateMailRes> {
    const qr = await this.lettersRepo.query(
      `INSERT INTO T_LETTERS_LET
      ( USR_ID, CON_ID, CPD_ID, header_id, footer_id, LET_TITLE, LET_MSG, footer_content, 
        footer_height, LET_TYPE, height, favorite) 
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        doctorId ? doctorId : null,
        payload?.patientId ? payload.patientId : null,
        payload?.correspondentId ? payload.correspondentId : null,
        payload?.header === null ? null : payload?.header,
        payload?.footer === null ? null : payload?.footer,
        payload?.title,
        payload?.body,
        payload?.footer_content,
        payload?.footer_height || 20,
        payload?.type,
        payload?.height || 20,
        payload?.favorite || 0,
      ],
    );
    const mail = {
      id: qr.insertId,
      ...payload,
    };
    return mail;
  }

  async delete(id: number) {
    const qr = await this.lettersRepo.find({ where: { id } });

    if (qr.length === 0) throw new InternalServerErrorException();
    return await this.lettersRepo.delete(id);
  }

  // application/Services/Mail.php => function find()
  async find(id: number) {
    const mails = await this.dataSource.query(
      `SELECT
				LET_ID AS id,
				LET_TYPE AS type,
				LET_TITLE AS title,
				LET_MSG AS body,
        footer_content,
        footer_height,
				height,
				favorite,
				created_at,
				updated_at,
				USR_ID AS doctor_id,
				CON_ID AS patient_id,
				CPD_ID AS correspondent_id,
				header_id,
        footer_id
			FROM T_LETTERS_LET
			WHERE LET_ID = ?`,
      [id],
    );

    if (mails.length === 0) {
      throw new CBadRequestException(`Le champ ${id} est invalide.`);
    }

    const mail = mails[0];
    mail.doctor = null;
    if (mail?.doctor_id) {
      const doctor = await this.dataSource.query(
        `SELECT
          USR_ID AS id,
          USR_LASTNAME AS lastname,
          USR_FIRSTNAME AS firstname,
          USR_MAIL AS email
        FROM T_USER_USR
        WHERE USR_ID = ?`,
        [mail?.doctor_id],
      );
      if (doctor && doctor?.id) {
        mail.doctor = doctor;
      }
    }
    delete mail.doctor_id;

    if (mail?.patient_id) {
      const patient = await this.dataSource.query(
        `SELECT
					CON_ID AS id,
					CON_LASTNAME AS lastname,
					CON_FIRSTNAME AS firstname,
					CON_MAIL AS email
				FROM T_CONTACT_CON
				WHERE CON_ID = ?`,
        [mail?.patient_id],
      );
      mail.patient = patient;
    } else {
      mail.patient = null;
    }
    delete mail.patient_id;

    // Récupération du correspondant
    if (mail?.correspondent_id) {
      const correspondant = await this.dataSource.query(
        `SELECT
					CPD_ID AS id,
					CPD_LASTNAME AS lastname,
					CPD_FIRSTNAME AS firstname,
					CPD_MAIL AS email
				FROM T_CORRESPONDENT_CPD
				WHERE CPD_ID = ?`,
        [mail?.correspondent_id],
      );
      mail.correspondant = correspondant;
    } else {
      mail.correspondant = null;
    }
    delete mail.correspondent_id;

    if (mail?.header_id) {
      const header = await this.dataSource.query(
        `SELECT
					LET_ID AS id,
					LET_TITLE AS title,
					LET_MSG AS body,
					height
				FROM T_LETTERS_LET
				WHERE LET_ID = ?`,
        [mail?.header_id],
      );
      mail.header = header;
    } else {
      mail.header = null;
    }

    if (mail?.footer_id) {
      const footer = await this.dataSource.query(
        `SELECT
          LET_ID AS id,
          LET_TITLE AS title,
          LET_MSG AS body,
          height
        FROM T_LETTERS_LET
        WHERE LET_ID = ?`,
        [mail?.footer],
      );
      mail.footer = footer;
    } else {
      mail.footer = null;
    }
    delete mail.footer_id;

    return mail;
  }

  // application/Services/Mail.php=> 38 -> 87
  async store(inputs: any) {
    const doctorId = inputs?.doctor?.id;
    const patientId =
      inputs?.patient && inputs?.patient?.id ? inputs?.patient?.id : null;
    const correspondentId =
      inputs?.correspondent && inputs?.correspondent?.id
        ? inputs?.correspondent?.id
        : null;
    const headerId =
      inputs?.header && inputs?.header?.id ? inputs?.header?.id : null;
    const footerId =
      inputs?.footer && inputs?.footer?.id ? inputs?.footer?.id : null;
    const type = inputs?.type ? inputs?.type : null;
    const height = inputs?.height ? inputs?.height : null;
    const favorite = !!inputs?.favorite ?? false;
    const footerContent = !!inputs?.footer_content
      ? inputs?.footer_content
      : null;
    const footerHeight = !!inputs?.footer_height
      ? Number(inputs?.footer_height)
      : 0;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const res = await queryRunner.query(
        `INSERT INTO T_LETTERS_LET 
      (USR_ID, CON_ID, CPD_ID, header_id, footer_id, LET_TITLE, LET_MSG, footer_content, footer_height, LET_TYPE, height, favorite)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          doctorId,
          patientId,
          correspondentId,
          headerId,
          footerId,
          inputs['title'],
          inputs['body'],
          footerContent,
          footerHeight,
          type,
          height,
          favorite,
        ],
      );
      const id = res[0].lastInsertId;
      // Traçabilité
      // if (!empty($patientId)) {
      // 	Ids\Log::write('Courrier', $patientId, 1);
      // }
      await queryRunner.commitTransaction();
      return this.find(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async findOnePaymentScheduleTemplateByDoctor(doctorId: number) {
    const queryBuilder = this.dataSource.createQueryBuilder();
    const select = 'LET.LET_ID as id';
    const result = await queryBuilder
      .select(select)
      .from(LettersEntity, 'LET')
      .leftJoin(UserEntity, 'USR', 'USR.USR_ID = LET.USR_ID')
      .where("LET.LET_TITLE = 'ECHEANCIER'")
      .andWhere('LET.CON_ID IS NULL')
      .andWhere('LET.CPD_ID IS NULL')
      .andWhere(
        `LET.USR_ID IS NULL OR
				          LET.USR_ID = :userId`,
        {
          userId: doctorId,
        },
      )
      .orderBy('USR.USR_ID', 'DESC')
      .getRawOne();
    if (!result) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND_LETTER);
    }
    return this.find(result?.id);
  }
}
