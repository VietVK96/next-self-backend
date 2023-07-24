import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import fs from 'fs';
import sharp from 'sharp';
import {
  differenceInMinutes,
  differenceInMonths,
  differenceInYears,
  format,
  parse,
} from 'date-fns';
import { DataSource, Repository } from 'typeorm';
import { FindAllMailRes } from '../response/findAllMail.res';
import { FindAllMailDto } from '../dto/findAllMail.dto';
import { HeaderFooterInfo, PersonInfoDto } from '../dto/relationClass.dto';
import { FindMailRes } from '../response/findMail.res';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUpdateMailDto } from '../dto/createUpdateMail.dto';
import { CreateUpdateMailRes } from '../response/createUpdateMail.res';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { PatientService } from 'src/patient/service/patient.service';
import { ConfigService } from '@nestjs/config';
import { fr } from 'date-fns/locale';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import { LettersEntity } from '../../entities/letters.entity';
import { ContextMailDto, FindVariableDto } from '../dto/findVariable.dto';
import { mailVariable } from 'src/constants/mailVariable';
import { UserEntity } from 'src/entities/user.entity';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UploadEntity } from 'src/entities/upload.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { CorrespondentEntity } from 'src/entities/correspondent.entity';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import Handlebars from 'handlebars';

@Injectable()
export class MailService {
  constructor(
    private configService: ConfigService,
    private mailerService: MailerService,
    private patientService: PatientService,
    private paymentScheduleService: PaymentScheduleService,
    @InjectRepository(LettersEntity)
    private lettersRepo: Repository<LettersEntity>,
    private dataSource: DataSource,
    @InjectRepository(ContactEntity)
    private contactRepo: Repository<ContactEntity>,
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

  // application/Services/Mail.php => function find()
  async find(id: number) {
    const mail = await this.dataSource.query(
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

    if (!mail) {
      throw new CBadRequestException(`Le champ ${id} est invalide.`);
    }
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

  // application/Services/Mail.php => function context
  async context(inputs) {
    const context: any = {};
    context.today = format(new Date(), 'P');
    context.todayLong = format(new Date(), 'PPP');
    const logo = await this.dataSource.query(
      `SELECT
        T_UPLOAD_UPL.UPL_FILENAME AS filename,
        T_GROUP_GRP.GRP_ID AS group_id
      FROM T_USER_USR
      JOIN T_GROUP_GRP
      LEFT OUTER JOIN T_UPLOAD_UPL ON T_UPLOAD_UPL.UPL_ID = T_GROUP_GRP.UPL_ID
      WHERE T_USER_USR.USR_ID = ? AND T_USER_USR.organization_id = T_GROUP_GRP.GRP_ID`,
      [inputs?.doctor_id],
    );
    const logoFilename = logo?.filename;
    const groupId = logo?.group_id;
    context.logo = await this.getLogoAsBase64(logoFilename);
    const doctor = await this.dataSource.query(
      `
      SELECT
        T_USER_USR.USR_ID AS id,
        T_USER_USR.ADR_ID AS address_id,
        T_USER_USR.USR_ADMIN AS admin,
        T_USER_USR.USR_LOG AS login,
        T_USER_USR.USR_ABBR AS short_name,
        T_USER_USR.USR_LASTNAME AS lastname,
        T_USER_USR.USR_FIRSTNAME AS firstname,
        T_USER_USR.color,
        T_USER_USR.USR_MAIL AS email,
        T_USER_USR.USR_PHONE_NUMBER AS phone_home_number,
        T_USER_USR.USR_GSM AS phone_mobile_number,
        T_USER_USR.USR_FAX_NUMBER AS fax_number,
        T_USER_USR.USR_NUMERO_FACTURANT AS adeli,
        T_USER_USR.finess AS finess,
        T_USER_USR.USR_RATE_CHARGES AS taxes,
              social_security_reimbursement_base_rate,
              social_security_reimbursement_rate,
        T_USER_USR.USR_AGA_MEMBER AS aga_member,
        T_USER_USR.freelance,
        T_USER_USR.USR_DEPASSEMENT_PERMANENT AS droit_permanent_depassement,
        T_USER_USR.USR_SIGNATURE AS signature,
        T_USER_USR.USR_TOKEN AS token,
        T_USER_USR.USR_BCB_LICENSE AS bcbdexther_license,
        T_LICENSE_LIC.LIC_END AS end_of_license_at,
        T_USER_TYPE_UST.UST_PRO AS professional,
        T_USER_PREFERENCE_USP.signature_automatic,
        user_medical.rpps_number AS rpps_number
      FROM T_USER_USR
      JOIN T_USER_PREFERENCE_USP ON T_USER_PREFERENCE_USP.USR_ID = T_USER_USR.USR_ID
      LEFT OUTER JOIN T_LICENSE_LIC ON T_LICENSE_LIC.USR_ID = T_USER_USR.USR_ID AND T_USER_USR.USR_CLIENT = 0
      LEFT OUTER JOIN T_USER_TYPE_UST ON T_USER_TYPE_UST.UST_ID = T_USER_USR.UST_ID
      LEFT OUTER JOIN user_medical ON user_medical.user_id = T_USER_USR.USR_ID
      WHERE T_USER_USR.USR_ID = ?
    `,
      [inputs?.doctor_id],
    );
    context.praticien = JSON.parse(JSON.stringify(doctor));
    context.praticien.fullname = [
      doctor?.lastname,
      doctor?.firstname,
      doctor?.freelance,
    ]
      .filter((name) => {
        if (!!name) return name;
        return name instanceof Boolean && name ? 'EI' : '';
      })
      .join(' ');
    context.praticien.phoneNumber = doctor?.praticien?.phone_home_number;
    context.praticien.gsm = doctor?.praticien?.phone_mobile_number;
    context.praticien.faxNumber = doctor?.praticien?.fax_number;
    context.praticien.numeroFacturant = doctor?.praticien?.adeli;
    context.praticien.medical.rppsNumber = doctor?.praticien?.rpps_number;
    if (context?.praticien?.address) {
      context.praticien.zipCode = doctor?.praticien?.address?.zip_code;
    }
    delete context?.praticien?.signature;
    if (doctor?.signature_automatic && doctor?.signature) {
      context.praticien.signature = `<img class='signaturePraticien' alt='Signature praticien' src='${doctor?.signature}' />`;
    }
    if (inputs?.patient_id) {
      const patient = this.patientService.find(inputs?.patient_id);
      context.contact = JSON.parse(JSON.stringify(patient));
      context.nbr = context?.contact?.number;
      context.inseeKey = context?.contact?.insee_key;
      context.dental.insee = context?.contact?.insee;
      context.dental.inseeKey = context?.contact?.insee_key;
      context.dental.dateOfNextReminder =
        await this.patientService.getNextReminderByDoctor(
          context?.contact?.id,
          inputs?.doctor_id,
        );
      context.dental.nextAppointmentDate = '';
      context.dental.nextAppointmentTime = '';
      context.dental.nextAppointmentDuration = '';
      context.dental.nextAppointmentTitle = '';

      const nextAppointment = await this.patientService.getNextAppointment(
        context?.contact?.id,
      );

      // if(nextAppointment && nextAppointment?.EVT_START){
      // $datetime1 = new \DateTime($nextAppointment['EVT_START']);
      // $datetime2 = new \DateTime($nextAppointment['EVT_END']);
      // $interval = $datetime2->diff($datetime1);
      // $duration = (new \DateTime())->setTime($interval->h, $interval->i);

      // $context['contact']['nextAppointmentDate'] = static::formatDatetime($datetime1, [\IntlDateFormatter::FULL, \IntlDateFormatter::NONE]);
      // $context['contact']['nextAppointmentTime'] = static::formatDatetime($datetime1, [\IntlDateFormatter::NONE, \IntlDateFormatter::SHORT]);
      // $context['contact']['nextAppointmentDuration'] = static::formatDatetime($duration, [\IntlDateFormatter::NONE, \IntlDateFormatter::SHORT]);
      // $context['contact']['nextAppointmentTitle'] = $nextAppointment['EVT_NAME'];
      // }

      if (!context?.contact?.birthday) {
        const birthday = new Date(context?.contact?.birthday);
        const currentDate: Date = new Date(); // Replace this with the current date
        const ageInYears: number = differenceInYears(currentDate, birthday);
        const ageInMonths: number = differenceInMonths(currentDate, birthday);
        const ageFormatted: string = format(
          currentDate,
          ageInYears < 1 ? 'PPPP' : 'P',
          { locale: fr },
        );
        context.contact.age =
          ageInYears < 1
            ? `(${ageInMonths} mois)`
            : `(${ageInYears} ${ageInYears === 1 ? 'an' : 'ans'})`;
      }

      if (context?.contact?.civility) {
        context.contact.gender = context?.contact?.civility?.name;
        context.contact.genderLong = context?.contact?.civility?.long_name;
        context.contact.dear =
          context?.contact?.civility?.sex === 'F' ? 'Chere' : 'Cher';
      }

      if (context?.contact?.address) {
        context.contact.address.zipCode = context?.contact?.address?.zip_code;
      }

      const temp = [];
      const phones = context?.contact?.phones;
      for (const phone of phones) {
        temp[phone?.type?.name] = phone?.number;
      }
      context.contact.phone = temp;
    }
    if (inputs?.payment_schedule_id) {
      const paymentSchedule = this.paymentScheduleService.find(
        inputs?.payment_schedule_id,
        groupId,
      );
      context.payment_schedule = await this.mailerService.sendMail({
        to: 'nguyenthanh.rise.88@gmail.com',
        subject: 'Greeting from NestJS NodeMailer',
        template: '/payment_schedule',
        context: {
          payment_schedule: paymentSchedule,
        },
      });
    }
    return context;
  }

  // application/Services/Mail.php => 429 -> 445
  async transform(inputs: any, context: any, signature?: any) {
    inputs.body = await this.render(
      inputs?.body.replace(/\|.*?\}/, '}'),
      context,
      signature,
    );
    if (inputs?.header) {
      inputs.header.body = this.render(
        inputs?.header.body.replace(/\|.*?\}/, '}'),
        context,
        signature,
      );
    }
    if (inputs?.footer) {
      inputs.footer.body = this.render(
        inputs?.footer?.body.replace(/\|.*?\}/, '}'),
        context,
        {},
      );
      inputs.footer_content = inputs?.footer?.body;
      inputs.footer_height = inputs?.footer?.height;
    }
    return inputs;
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
    const body = inputs?.body;

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

  // application/Services/Mail.php=> 454 -> 489
  async render(message: string, context: any, signature?: any) {
    const uniqid = Date.now().toString(); // Generate a unique identifier

    // Replace the default date format in Handlebars
    Handlebars.registerHelper('formatDate', function (dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });
    });

    let content = Handlebars.compile(message)(context);

    // Replace the signature for the practitioner if it exists in the context
    if (context.praticien?.signature) {
      const regexPractitionerSignature =
        /(<img[^>]+signaturePraticien[^>]+\/?>)/;
      content = content.replace(
        regexPractitionerSignature,
        context.praticien.signature,
      );
    }

    // Replace the signature for the practitioner if it exists in the signature object
    if (signature?.practitioner) {
      const regexPractitionerClass = /class=["']signaturePraticien["']/;
      content = content.replace(
        regexPractitionerClass,
        `class="signaturePraticien" src="${signature?.practitioner}"`,
      );
    }

    // Replace the signature for the patient if it exists in the signature object
    if (signature?.patient) {
      const regexPatientClass = /class=["']signaturePatient["']/;
      content = content.replace(
        regexPatientClass,
        `class="signaturePatient" src="${signature?.patient}"`,
      );
    }

    return content;
  }

  async getLogoAsBase64(logoFilename: string): Promise<string | null> {
    // Read the file stream
    const buffer: Buffer | null = await this.getLogoAsBuffer(logoFilename);
    if (buffer) {
      // Resize and convert the image to base64
      const image = sharp(buffer).resize(350, 100, { fit: sharp.fit.inside });
      const data = await image.toBuffer();
      const base64Image = data.toString('base64');
      // Get the image dimensions
      const { width, height } = await image.metadata();
      // Create the HTML <img> tag with the base64 data
      return `<img src="data:image/png;base64,${base64Image}" width="${width}" height="${height}" />`;
    }
    return null;
  }

  async getLogoAsBuffer(logoFilename: string): Promise<Buffer | null> {
    if (!logoFilename) return null;
    const dir = await this.configService.get('app.uploadDir');
    const logoPath = `${dir}/${logoFilename}`;

    try {
      // Check if the file exists
      if (fs.existsSync(logoPath)) {
        // Create a promise to read the file stream and resolve with the Buffer data
        const bufferPromise: Promise<Buffer> = new Promise(
          (resolve, reject) => {
            const chunks: Buffer[] = [];
            const stream = fs.createReadStream(logoPath);

            stream.on('data', (chunk: Buffer) => {
              chunks.push(chunk);
            });

            stream.on('end', () => {
              // Concatenate the chunks into a single Buffer
              const buffer = Buffer.concat(chunks);
              resolve(buffer);
            });

            stream.on('error', (error) => {
              reject(error);
            });
          },
        );

        return bufferPromise;
      }

      return null;
    } catch (error) {
      // Handle any errors that might occur during file reading
      console.error('Error reading logo image:', error);
      return null;
    }
  }

  async sendTest() {
    await this.mailerService.sendMail({
      to: 'nguyenthanh.rise.88@gmail.com',
      subject: 'Greeting from NestJS NodeMailer',
      template: 'test.hbs',
      context: {},
    });
  }

  // php/mail/variable.php
  async findVariable(payload: FindVariableDto, doctorId: number) {
    let respon = JSON.stringify(mailVariable);
    if (payload.patient_id) {
      const context = await this.contextMail(payload, doctorId);
      respon = await this.render(respon, context);
    }
    return respon;
  }

  async contextMail(payload: ContextMailDto, doctorId: number) {
    const context: any = {};
    const today = new Date();
    context['today'] = this.formatDatetime(today, { dateStyle: 'short' });
    context['todayLong'] = this.formatDatetime(today, { dateStyle: 'long' });

    const statement: { filename: string; group_id: number } =
      await this.dataSource
        .createQueryBuilder(UserEntity, 'user')
        .select('upload.UPL_FILENAME', 'filename')
        .addSelect('group.GRP_ID', 'group_id')
        .leftJoin(
          OrganizationEntity,
          'group',
          'group.GRP_ID = user.organization_id',
        )
        .leftJoin(UploadEntity, 'upload', 'upload.UPL_ID = group.UPL_ID')
        .where('user.USR_ID = :doctor_id', { doctor_id: doctorId })
        .andWhere('user.organization_id = group.GRP_ID')
        .getRawOne();

    const logoFilename = statement.filename;
    // const groupId = statement.group_id;

    if (logoFilename) {
      context['logo'] = await this.getLogoAsBase64(logoFilename);
    }

    const doctor = await this.dataSource.getRepository(UserEntity).findOne({
      relations: { preference: true, medical: true, address: true },
      where: { id: doctorId },
    });
    context['praticien'] = {
      ...JSON.parse(JSON.stringify(doctor)),
      fullname: [
        doctor.lastname,
        doctor.firstname,
        doctor.freelance ? 'EI' : '',
      ]
        .filter(Boolean)
        .join(' '),
      phoneNumber: doctor.phoneNumber,
      gsm: doctor.gsm,
      faxNumber: doctor.faxNumber,
      numeroFacturant: doctor.numeroFacturant,
      medical: {
        rppsNumber: doctor.medical.rppsNumber,
      },
    };

    if (doctor.address) {
      context['praticien']['address']['zipCode'] = doctor.address.zipCode;
    }
    delete context['praticien']['signature'];

    if (
      true === Boolean(doctor.preference.signatureAutomatic) &&
      doctor.signature !== null
    ) {
      context['praticien'][
        'signature'
      ] = `<img class='signaturePraticien' alt='Signature praticien' src='${doctor.signature}' />`;
    }

    if (payload.patient_id) {
      const patient = await this.contactRepo.findOne({
        relations: ['civilityTitle', 'phones.type', 'contactUsers'],
        where: { id: payload.patient_id },
      });
      context['contact'] = {
        ...patient,
        nbr: patient.number,
        inseeKey: patient['insee_key'],
        dental: {
          insee: patient.insee,
          inseeKey: patient['insee_key'],
        },
        dateOfNextReminder: await this.getNextReminderByDoctor(
          patient.id,
          doctorId,
        ),
        nextAppointmentDate: '',
        nextAppointmentTime: '',
        nextAppointmentDuration: '',
        nextAppointmentTitle: '',
      };

      const nextAppointment = await this.getNextAppointment(
        context['contact']['id'],
      );
      if (nextAppointment) {
        const datetime1 = new Date(nextAppointment['EVT_START']);
        const datetime2 = new Date(nextAppointment['EVT_END']);

        const interval = datetime2.getTime() - datetime1.getTime();
        const duration = new Date(interval);

        const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        });

        const nextAppointmentDate = dateFormatter.format(datetime1);
        const nextAppointmentTime = timeFormatter.format(datetime1);
        const nextAppointmentDuration = `${duration.getUTCHours()}h ${duration.getUTCMinutes()}m`;
        const nextAppointmentTitle = nextAppointment['EVT_NAME'];

        context['contact'] = {
          ...context['contact'],
          nextAppointmentDate,
          nextAppointmentTime,
          nextAppointmentDuration,
          nextAppointmentTitle,
        };
      }
      if (patient.birthDate) {
        const birthday = new Date(context['contact']['birthday']);
        const currentDate = new Date();
        const ageInMilliseconds =
          BigInt(currentDate.getMilliseconds()) -
          BigInt(birthday.getMilliseconds());
        const ageInYears = Math.floor(
          Number(ageInMilliseconds / BigInt(1000 * 60 * 60 * 24 * 365.25)),
        );
        const ageInMonths = Math.floor(
          Number(
            (ageInMilliseconds % BigInt(1000 * 60 * 60 * 24 * 365.25)) /
              BigInt(1000 * 60 * 60 * 24 * 30.4375),
          ),
        );

        function formatAge(years: number, months: number) {
          if (years === 0) {
            return `${months} mois`;
          } else if (years === 1) {
            return `1 an`;
          } else {
            return `${years} ans`;
          }
        }
        context['contact']['age'] = formatAge(ageInYears, ageInMonths);
      }

      if (patient.civilityTitle) {
        context['contact'] = {
          ...context['contact'],
          gender: patient.civilityTitle.name,
          genderLong: patient.civilityTitle.longName,
          dear: patient.civilityTitle.type === 'F' ? 'Chère' : 'Cher',
        };
      }

      if (patient.address) {
        context['contact']['address']['zipCode'] = patient.address.zipCode;
      }

      const temp = [];
      const phones = patient.phones;
      for (const phone of phones) {
        temp[phone.type.name] = phone.nbr;
      }

      for (const doctor of patient.contactUsers) {
        if (doctor.id === doctorId) {
          context['contact'] = {
            ...context['contact'],
            amountDue: doctor.amount,
            dateLastRec: doctor.lastPayment,
            dateLastSoin: doctor.lastCare,
          };
        }
      }
    }

    if (payload.correspondent_id) {
      const correspondent = await this.dataSource
        .getRepository(CorrespondentEntity)
        .findOne({
          relations: ['gender'],
          where: { id: payload.correspondent_id },
        });
      context['correspondent'] = JSON.parse(JSON.stringify(correspondent));
      context['correspondent->msg'] = correspondent.msg;
      context['correspondent->type'] = correspondent.type
        ? correspondent.type
        : '';

      if (correspondent.gender) {
        context['correspondent'] = {
          ...correspondent['correspondent'],
          gender: correspondent.gender.name,
          genderLong: correspondent.gender.longName,
          dear: correspondent.gender.type === 'F' ? 'Chère' : 'Cher',
        };
      }
    }

    // @TODO
    // Récupération de l'échéancier
    // if (!empty($inputs['payment_schedule_id'])) {
    // 	$paymentSchedule = PaymentSchedule::find($inputs['payment_schedule_id'], $groupId);
    // 	$context['payment_schedule'] = Registry::get('twig')->render('mails/payment_schedule.twig', [
    // 		'payment_schedule' => $paymentSchedule
    // 	]);
    // }

    return context;
  }

  public formatDatetime(datetime: Date, format: { [key: string]: string }) {
    const formatter = new Intl.DateTimeFormat('fr-FR', format);
    return formatter.format(datetime);
  }

  public async getNextReminderByDoctor(id: number, doctorId: number) {
    const patient = await this.contactRepo.findOne({ where: { id: id } });
    const type = patient.reminderVisitType;
    switch (type) {
      case 'date':
        return patient['date'];

      case 'duration':
        const duration = await this.dataSource
          .getRepository(UserPreferenceEntity)
          .findOne({ where: { usrId: doctorId } });
        const statement = await this.dataSource.query(
          `SELECT
          (MAX(t1.max_date) + INTERVAL IF(
              CON_REMINDER_VISIT_DURATION IS NULL OR CON_REMINDER_VISIT_DURATION = 0,
              ?,
              CON_REMINDER_VISIT_DURATION
          ) MONTH) as date
      FROM T_CONTACT_CON
      JOIN (
          (
              SELECT
                  MAX(T_EVENT_TASK_ETK.ETK_DATE) AS max_date
              FROM T_CONTACT_CON
              JOIN T_EVENT_TASK_ETK
              WHERE T_CONTACT_CON.CON_ID = ?
                AND T_CONTACT_CON.CON_ID = T_EVENT_TASK_ETK.CON_ID
                AND T_EVENT_TASK_ETK.USR_ID = ?
              GROUP BY T_CONTACT_CON.CON_ID
          )
          UNION
          (
              SELECT
                  MAX(event_occurrence_evo.evo_date) AS max_date
              FROM T_CONTACT_CON
              JOIN T_EVENT_EVT
              JOIN event_occurrence_evo
              WHERE T_CONTACT_CON.CON_ID = ?
                AND T_CONTACT_CON.CON_ID = T_EVENT_EVT.CON_ID
                AND T_EVENT_EVT.USR_ID = ?
                AND T_EVENT_EVT.EVT_ID = event_occurrence_evo.evt_id
              GROUP BY T_CONTACT_CON.CON_ID
          )
      ) AS t1
      WHERE T_CONTACT_CON.CON_ID = ?`,
          [duration.reminderVisitDuration, id, doctorId, id, doctorId, id],
        );
        return statement.length !== 0 ? statement[0].date : null;
      default:
        return null;
    }
  }

  public async getNextAppointment(patientId: number) {
    const event = await this.dataSource.query(`
            SELECT
                T_EVENT_EVT.EVT_NAME,
                T_EVENT_EVT.EVT_START,
                T_EVENT_EVT.EVT_END
            FROM T_EVENT_EVT
            WHERE
                T_EVENT_EVT.CON_ID = ${patientId} AND
                T_EVENT_EVT.EVT_START > CURRENT_TIMESTAMP() AND
                T_EVENT_EVT.deleted_at IS NULL
            ORDER BY
                T_EVENT_EVT.EVT_START
            LIMIT 1`);
    return event.lenght !== 0 ? event[0] : null;
  }
}
