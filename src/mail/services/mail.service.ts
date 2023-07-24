import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import fs from 'fs';
import sharp from 'sharp';
import { differenceInMonths, differenceInYears, format } from 'date-fns';
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
import { UserEntity } from 'src/entities/user.entity';
import { ErrorCode } from 'src/constants/error';
import { MailInputsDto, MailOptionsDto } from '../dto/mail.dto';

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
    inputs.body = this.render(inputs?.body, context, signature);
    if (inputs?.header) {
      inputs.header.body = this.render(inputs?.header.body, context, signature);
    }
    if (inputs?.footer) {
      inputs.footer.body = this.render(inputs?.footer?.body, context, {});
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
  async render(message: string, context: any, signature: any) {
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
      .orderBy('USR.USR_ID DESC')
      .getRawOne();
    if (!result) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND_LETTER);
    }
    return this.find(result?.id);
  }

  /**
   * Formatte le corps du courrier pour l'affichage PDF.
   *
   * @param array $inputs Informations du courrier.
   * @param array $options Options.
   *	print: Code Javascript pour impression inclus.
   *	filename: Enregistrement du PDF dans le fichier.
   */
  async pdf(inputs: MailInputsDto, options: MailOptionsDto) {
    this.addPage(inputs);
    this.clean(inputs);
    this.addPageBreak(inputs);
    this.addFontAndSize(inputs);
    this.resizeTable(inputs);
    if (options.preview) {
      return inputs.body;
    }
  }

  /**
   * Transforme les paragraphes vides en sauts de page.
   * Transforme les espaces insécables en espaces.
   * Supprime l'attribut "align".
   *
   * @param array $inputs Informations du courrier.
   */
  clean(inputs: MailInputsDto) {
    const cleanBlank = inputs.body.replace(
      '/<p[^>]*>(<span[^>]*>)?(s|&nbsp;?)*(</span>)?</p>/',
      '<br>',
    );
    const cleanNonBreakingSpace = cleanBlank.replace('&nbsp;', ' ');
    const cleanAlignAttribute = cleanNonBreakingSpace.replace(
      '/salign="[^"]+"/i',
      '',
    );
    inputs.body = cleanAlignAttribute;
  }

  /**
   * Transforme les commentaires <!-- pagebreak --> en nouvelle page.
   *
   * @param array $inputs Informations du courrier.
   */
  addPageBreak(inputs: MailInputsDto) {
    const tagsAutoClose = [
      'area',
      'base',
      'br',
      'col',
      'command',
      'embed',
      'hr',
      'img',
      'input',
      'link',
      'meta',
      'param',
      'source',
      'option',
      'circle',
      'ellipse',
      'path',
      'rect',
      'line',
      'polygon',
      'polyline',
    ];
    const pages = inputs.body.split('<!-- pagebreak -->');
    let content = '';

    // Pour chaque page du HTML.
    pages.forEach((page, pageIndex) => {
      page = content + page;
      content = '';
      const tags = [];
      let matches = [];

      const tagRegex = /<(\/?)([^>\s\/]+)([^>]*)?>/g;
      let match: RegExpExecArray;
      while ((match = tagRegex.exec(page)) !== null) {
        matches.push(match);
      }

      // Suppression des balises autofermantes.
      matches = matches.filter((value) => !tagsAutoClose.includes(value[2]));

      // Suppression des balises ouvertes ET fermées.
      matches.forEach((value) => {
        if (!value[1]) {
          tags.push(value[2]);
        } else {
          const offset = tags.indexOf(value[2]);
          if (offset !== -1) {
            tags.splice(offset, 1);
          }
        }
      });

      // Reconstruct the HTML with remaining opening tags.
      const keys = Object.keys(tags);
      const keysReversed = keys.reverse();
      keysReversed.forEach((key) => {
        page += `</${matches[key][2]}>`;
        if (matches[key][2] === 'page') {
          content = `<${matches[key][2]} ${matches[key][3]} pageset="old">${content}`;
        } else {
          content = matches[key][0] + content;
        }
      });

      pages[pageIndex] = page;
    });

    inputs.body = pages.join('');
  }

  /**
   * Récupération des éléments qui ont une police de caractères
   * afin de l'inclure également à tous les éléments enfants.
   *
   * @param array $inputs Informations du courrier.
   */
  addFontAndSize(inputs: MailInputsDto) {
    // Assuming inputs['body'] contains the HTML string
    const htmlString =
      '<?xml encoding="utf-8" ?><div>' + inputs.body + '</div>';

    // Create a new DOMParser object and parse the HTML string
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(htmlString, 'text/html');

    // Example usage of evaluateXPath function
    const xpathExpression =
      "descendant-or-self::*[contains(@style,'font-family') or contains(@style,'font-size')]";
    const nodes = this.evaluateXPath(xpathExpression, xmlDoc);

    for (const node of nodes) {
      let style = node.getAttribute('style');
      let matches: string[];

      this.removeDataMceAttributes(node);

      if ((matches = style.match(/font-family[^;]+;/))) {
        const styleFontFamily = matches[0].replace(/'/g, '');
        style = style.replace(matches[0], styleFontFamily);
        node.setAttribute('style', style);

        const childs = this.evaluateXPath(
          './/descendant::*[not(contains(@style,"font-family"))]',
          node,
        );
        this.integrateStyleIntoChilds(childs, styleFontFamily);
      }

      if ((matches = style.match(/font-size[^;]+;/))) {
        const styleFontSize = matches[0];

        const childs = this.evaluateXPath(
          './/descendant::*[not(contains(@style,"font-size"))]',
          node,
        );
        document.getElementById('a');
        this.integrateStyleIntoChilds(childs, styleFontSize);
      }
    }

    const selectNodes = xmlDoc.getElementsByTagName('select');
    let index = selectNodes.length - 1;

    while (index > -1) {
      const node = selectNodes[index];
      const selectedOption =
        node.querySelector('option[selected]') || node.querySelector('option');

      const replacementNode = xmlDoc.createElement('div');
      replacementNode.textContent = selectedOption
        ? selectedOption.textContent
        : '';

      node.parentNode.replaceChild(replacementNode, node);

      index--;
    }
    // Transformation du DOM en chaine de caractères + suppression des commentaires.
    const xmlString = new XMLSerializer().serializeToString(
      xmlDoc.documentElement,
    );
    const startIndex = xmlString.indexOf('<div>');
    const endIndex = xmlString.lastIndexOf('</div>');
    inputs.body = xmlString.slice(startIndex + 5, endIndex);
  }

  // Function to evaluate XPath expressions
  evaluateXPath(
    xpathExpression: string,
    contextNode: Document | HTMLElement,
  ): HTMLElement[] {
    const evaluator = new XPathEvaluator();
    const result = evaluator.evaluate(
      xpathExpression,
      contextNode,
      null,
      XPathResult.ANY_TYPE,
      null,
    );

    const nodes = [];
    let node = result.iterateNext();
    while (node) {
      nodes.push(node);
      node = result.iterateNext();
    }
    return nodes;
  }

  removeDataMceAttributes(node: HTMLElement) {
    for (const attribute of node.attributes) {
      if (attribute.nodeName.match(/^data-mce-/i)) {
        node.removeAttribute(attribute.nodeName);
      }
    }
  }

  integrateStyleIntoChilds(childs: HTMLElement[], styleAttribute: string) {
    for (const child of childs) {
      let attribute = styleAttribute;
      if (child.hasAttribute('style')) {
        attribute += child.getAttribute('style');
      }
      child.setAttribute('style', attribute);
    }
  }

  resizeTable(inputs: MailInputsDto) {
    // Assuming inputs['body'] contains the HTML string
    const htmlString =
      '<?xml encoding="utf-8" ?><div>' + inputs.body + '</div>';

    // Create a new DOMParser object and parse the HTML string
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(htmlString, 'text/html');

    // Function to transform table elements and their columns
    // Call the function to transform table elements and columns
    this.transformTables(xmlDoc);

    // Transformation du DOM en chaine de caractères + suppression des commentaires.
    const xmlString = new XMLSerializer().serializeToString(
      xmlDoc.documentElement,
    );
    const startIndex = xmlString.indexOf('<div>');
    const endIndex = xmlString.lastIndexOf('</div>');
    inputs.body = xmlString.slice(startIndex + 5, endIndex);
    return inputs;
  }

  transformTables(xmlDoc: Document) {
    const nodes = xmlDoc.getElementsByTagName('table');
    // Create a new DOMXPath object for XPath queries
    const xpath = new XPathEvaluator();
    for (const node of nodes) {
      // Insertion d'une largeur de 100% aux balises <table>.
      if (
        !node.hasAttribute('width') &&
        !node.getAttribute('style').match(/width\:/)
      ) {
        node.setAttribute('style', 'width: 100%;' + node.getAttribute('style'));
      }

      // Insertion d'une largeur aux colonnes des tableaux.
      const rows = node.getElementsByTagName('tr');
      for (const row of rows) {
        const cols = xpath.evaluate(
          './/td|.//th',
          row,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null,
        );
        const length = cols.snapshotLength;
        const width = 100 / length;
        for (let i = 0; i < length; i++) {
          const col = cols.snapshotItem(i) as HTMLElement;
          if (
            !col.hasAttribute('width') &&
            !col.getAttribute('style').match(/width\:/)
          ) {
            col.setAttribute(
              'style',
              'width: ' + width + '%;' + col.getAttribute('style'),
            );
          }
        }
      }
    }
  }

  /**
   * Insertion des balises <page> et <page_header> et <page_footer> pour la génération du PDF.
   *
   * @param array $inputs Informations du courrier.
   *
   * application/Services/Mail.php 746 - 783
   */
  addPage(inputs: MailInputsDto) {
    let backtop = '0';
    let backbottom = '0';
    let pageHeader = '';
    let pageFooter = '';
    // Vérification si une entête existe
    if (inputs?.header) {
      backtop = `${inputs?.header?.height}px`;
      pageHeader = `<page_header>${inputs?.header?.body}</page_header>)`;
    }

    if (inputs?.footer) {
      backbottom = `${inputs?.footer?.height}px`;
      pageFooter = `<page_footer>${inputs?.footer?.body}</page_footer>)`;
    } else if (inputs?.footer_content) {
      backbottom = `${inputs?.footer_content?.height}px`;
      pageFooter = `<page_footer>${inputs?.footer_content?.body}</page_footer>)`;
    }

    const body = `
      <style type="text/css">
      * { font-size: 12pt; font-family: Arial,sans-serif; }
      p { margin: 0; padding: 0; }
      blockquote { padding: 1em 40px; }
      hr { height: 1px; background-color: #000000; }
      ul, ol { margin-top: 1em; margin-bottom: 1em; }
      .mceitemtable, .mceitemtable td, .mceitemtable th, .mceitemtable caption, .mceitemvisualaid { border: 0 !important; }
      .mce-pagebreak { page-break-before:always; }
      </style>
      <page backtop="${backtop}" backright="0" backbottom="${backbottom}" backleft="0" orientation="portrait">
      ${pageHeader}
      ${pageFooter}
      ${inputs?.body}
      </page>
    `;
    inputs.body = body;
  }
}
