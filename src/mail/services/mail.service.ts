import { LettersEntity } from '../../entities/letters.entity';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { FindAllMailRes } from '../response/findAllMail.res';
import { FindAllMailDto } from '../dto/findAllMail.dto';
import { HeaderFooterInfo, PersonInfoDto } from '../dto/relationClass.dto';
import { FindMailRes } from '../response/findMail.res';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUpdateMailDto } from '../dto/createUpdateMail.dto';
import { CreateUpdateMailRes } from '../response/createUpdateMail.res';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import * as dayjs from 'dayjs';
import * as fs from 'fs';
import { format } from 'date-fns';
import { ConfigService } from '@nestjs/config';
import { resizeAndConvertToBase64 } from 'src/common/util/file';
import { UserService } from 'src/user/services/user.service';
import { PatientService } from 'src/patient/service/patient.service';
import { DEFAULT_LOCALE } from 'src/constants/locale';
import { CorrespondentService } from 'src/correspondent/services/correspondent.service';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
@Injectable()
export class MailService {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private correspondentService: CorrespondentService,
    private patientService: PatientService,
    private paymentScheduleService: PaymentScheduleService,
    @InjectRepository(LettersEntity)
    private lettersRepo: Repository<LettersEntity>,
    private dataSource: DataSource,
  ) {}

  // php/mail/findAll.php
  async findAll(
    draw: string,
    pageIndex: number,
    docId: number,
    groupId: number,
    search: string,
  ): Promise<FindAllMailRes> {
    if (!search) search = '';
    const pageSize = 100;

    const doctors: PersonInfoDto[] = await this.dataSource.query(`SELECT
        T_USER_USR.USR_ID AS id,
        T_USER_USR.USR_LASTNAME AS lastname,
        T_USER_USR.USR_FIRSTNAME AS firstname,
        T_USER_USR.USR_MAIL AS email
    FROM T_USER_USR`);

    let mails: FindAllMailDto[];
    if (docId) {
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
        ORDER BY favorite DESC
        LIMIT ?`,
        [search, docId, pageSize],
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

    const offSet = (pageIndex - 1) * pageSize;
    const dataPaging = mails.slice(offSet, offSet + pageSize);

    const result: FindAllMailRes = {
      draw,
      recordsTotal: dataPaging.length,
      recordsFiltered: dataPaging.length,
      totalData: mails.length,
      data: dataPaging,
    };
    return result;
  }

  // php/mail/find.php
  async findById(id: number) {
    const qr = await this.lettersRepo.findOne({
      where: { id: id },
    });

    if (!qr) throw new CNotFoundRequestException(`Mail Not found`);

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

    const mail: FindMailRes = {
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
      doctor: doctors.length === 0 ? null : doctors[0],
      patient: patients.length === 0 ? null : patients[0],
      conrrespondent: conrrespondents.length <= 0 ? null : conrrespondents[0],
      header: headers.length === 0 ? null : headers[0],
      footer: footers.length === 0 ? null : footers[0],
    };

    return mail;
  }

  // php/mail/store.php
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

  // application/Services/Mail.php
  async context(inputs: any) {
    const context: any = {};
    context.today = dayjs(new Date()).format('YYYY-MM-DD');
    context.todayLong = dayjs(new Date()).format('LL');
    const stm = await this.dataSource.query(
      `
        SELECT
          T_UPLOAD_UPL.UPL_FILENAME AS filename,
          T_GROUP_GRP.GRP_ID AS group_id
        FROM T_USER_USR
        JOIN T_GROUP_GRP
        LEFT OUTER JOIN T_UPLOAD_UPL ON T_UPLOAD_UPL.UPL_ID = T_GROUP_GRP.UPL_ID
        WHERE T_USER_USR.USR_ID = ?
			  AND T_USER_USR.organization_id = T_GROUP_GRP.GRP_ID`,
      [inputs.doctor_id],
    );
    const logoFilename = stm['filename'];
    const groupId = stm['group_id'];
    const dir = await this.configService.get('app.uploadDir');

    if (logoFilename && fs.existsSync(`${dir}/${logoFilename}`)) {
      // const stream = fs.createReadStream(`${dir}/${logoFilename}`);
      const imageInfo = await resizeAndConvertToBase64(
        `${dir}/${logoFilename}`,
        350,
        100,
      );
      context[
        'logo'
      ] = ` "<img src='${imageInfo.base64Data}' width='${imageInfo.width}' height='${imageInfo.height}' />";`;
    }
    const doctor = await this.userService.find(inputs.doctor_id);
    context.praticien = {};
    context.praticien.fullname = [
      doctor.lastname,
      doctor.firstname,
      doctor.freelance ? 'EI' : '',
    ]
      .filter(Boolean)
      .join(' ');
    doctor;
    context.praticien.fullname = doctor.phone_home_number;
    context.praticien.gsm = doctor.phone_mobile_number;
    context.praticien.faxNumber = doctor.fax_number;
    context.praticien.numeroFacturant = doctor.adeli;
    context.praticien.fullname = doctor.phone_home_number;
    context.praticien.medical.rppsNumber = doctor.rpps_number;
    if (!doctor.address) {
      context.praticien.zipCode = doctor.address.zip_code;
      if (doctor.signature_automatic && doctor.signature !== null) {
        context.praticien.signature = `<img class='signaturePraticien' alt='Signature praticien' src='${doctor.signature}' />;`;
      }
    }

    if (inputs.patient_id) {
      const patient = await this.patientService.find(inputs.patient_id);
      context.contact = {};
      context.contact.nbr = patient.number;
      context.contact.inseeKey = patient.insee_key;
      context.contact.dental = {};
      context.contact.dental.insee = patient.insee;
      context.contact.dental.inseeKey = patient.insee_key;
      const nextReminder = await this.patientService.getNextReminderByDoctor(
        patient.id,
        inputs.doctor_id,
      );
      context.contact.dateOfNextReminder = nextReminder;
      context.contact.nextAppointmentDate = '';
      context.contact.nextAppointmentTime = '';
      context.contact.nextAppointmentDuration = '';
      context.contact.nextAppointmentTitle = '';

      const nextAppointment = await this.patientService.getNextAppointment(
        patient.id,
      );
      if (nextAppointment) {
        const datetime1 = new Date(nextAppointment.EVT_START);
        const datetime2 = new Date(nextAppointment.EVT_END);

        const durationMilliseconds = datetime2.getTime() - datetime1.getTime();
        const hours = Math.floor(durationMilliseconds / (1000 * 60 * 60));
        const minutes = Math.floor(
          (durationMilliseconds % (1000 * 60 * 60)) / (1000 * 60),
        );

        const duration = new Date(0);
        duration.setHours(hours);
        duration.setMinutes(minutes);

        context.contact.nextAppointmentDate = dayjs(datetime1.toISOString())
          .locale(DEFAULT_LOCALE)
          .format('dddd, MMMM D, YYYY AD [or] h:mm:ssa [PST]');
        context.contact.nextAppointmentTime = dayjs(datetime1.toISOString())
          .locale(DEFAULT_LOCALE)
          .format('MM/DD/YY [or] h:mma');
        context.contact.nextAppointmentDuration = dayjs(datetime1)
          .locale(DEFAULT_LOCALE)
          .format('HH:mm:ss');
        context.contact.nextAppointmentTitle = nextAppointment.EVT_NAME;
      }
      if (patient.birthday) {
        context.contact.birthday = format(
          new Date(patient.birthday),
          'dd/MM/yyyy',
        );
      }
      if (patient.civility) {
        context.contact.gender = patient.civility.name;
        context.contact.genderLong = patient.civility.long_name;
        context.contact.dear = patient.civility.sex == 'F' ? 'Chère' : 'Cher';
      }
      if (patient.address) {
        context.contact.address.zipCode = patient.address.zip_code;
      }

      const temp: { [key: string]: string } = {};
      const phones = patient.phones;
      const transformedPhones = phones.reduce((result, phone) => {
        result[phone.type.name] = phone.number;
        return result;
      }, temp);

      context.contact.phones = transformedPhones;
      for (const doctor of patient.doctors) {
        if (doctor.id === inputs.doctor_id) {
          context.contact.amountDue = doctor.pivot.amount_due;
          context.contact.dateLastRec = doctor.pivot.last_payment;
          context.contact.dateLastSoin = doctor.pivot.last_care;
        }
      }
    }

    if (inputs.correspondent_id) {
      const correspondent = await this.correspondentService.find(
        inputs.correspondent_id,
      );

      context.correspondent = {};
      context.correspondent.msg = correspondent.description;
      context.correspondent.type = correspondent.type
        ? correspondent.type.name
        : '';
      if (correspondent.civility) {
        context.correspondent.gender = correspondent.civility.name;
        context.correspondent.genderLong = correspondent.civility.long_name;
        context.correspondent.dear =
          correspondent.civility.sex === 'F' ? 'Chère' : 'Cher';
      }
      if (correspondent.address) {
        context.correspondent.address.zipCode = correspondent.address.zip_code;
      }
      const temp: { [key: string]: string } = {};
      const phones = correspondent.phones;
      const transformedPhones = phones.reduce((result, phone) => {
        result[phone.type.name] = phone.number;
        return result;
      }, temp);
      context.correspondent.phones = transformedPhones;
    }
    if (inputs.payment_schedule_id) {
      // $context['payment_schedule'] = Registry::get('twig')->render('mails/payment_schedule.twig', [
      //   'payment_schedule' => $paymentSchedule
      // ]);
      context.payment_schedule = await this.paymentScheduleService.find(
        inputs.payment_schedule_id,
        groupId,
      );
    }

    return context;
  }

  // async transform(inputs: any, context: any, signature: any) {}
}
