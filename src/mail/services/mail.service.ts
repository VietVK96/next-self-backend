import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as dayjs from 'dayjs';
import * as sharp from 'sharp';
import * as xpath from 'xpath';
import { format } from 'date-fns';
import { DataSource, Repository } from 'typeorm';
import { FindAllMailRes } from '../response/findAllMail.res';
import { FindAllMailDto } from '../dto/findAllMail.dto';
import { HeaderFooterInfo, PersonInfoDto } from '../dto/relationClass.dto';
import { FindMailRes } from '../response/findMail.res';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUpdateMailDto } from '../dto/createUpdateMail.dto';
import { CreateUpdateMailRes } from '../response/createUpdateMail.res';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { PatientService } from 'src/patient/service/patient.service';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ConfigService } from '@nestjs/config';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import { EnumLettersType, LettersEntity } from '../../entities/letters.entity';
import { UserEntity } from 'src/entities/user.entity';
import { ErrorCode } from 'src/constants/error';
import { MailInputsDto, MailOptionsDto, UpdateMailDto } from '../dto/mail.dto';
import { ContextMailDto, FindVariableDto } from '../dto/findVariable.dto';
import { mailVariable } from 'src/constants/mailVariable';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UploadEntity } from 'src/entities/upload.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { CorrespondentEntity } from 'src/entities/correspondent.entity';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import Handlebars from 'handlebars';
import { FactureEmailDataDto } from 'src/dental/dto/facture.dto';
import { sanitizeFilename } from 'src/common/util/file';
import * as path from 'path';
import { SendMailDto } from '../dto/sendMail.dto';
import { validateEmail } from 'src/common/util/string';
import { MailTransportService } from './mailTransport.service';
import { SuccessResponse } from 'src/common/response/success.res';
import { FindHeaderFooterRes } from '../response/findHeaderFooter.res';
import { DOMParser, XMLSerializer } from 'xmldom';
import puppeteer from 'puppeteer';

@Injectable()
export class MailService {
  constructor(
    private configService: ConfigService,
    private mailerService: MailerService,
    private patientService: PatientService,
    private paymentScheduleService: PaymentScheduleService,
    private mailTransportService: MailTransportService,
    @InjectRepository(LettersEntity)
    private lettersRepo: Repository<LettersEntity>,
    private dataSource: DataSource,
    @InjectRepository(ContactEntity)
    private contactRepo: Repository<ContactEntity>,
  ) {}

  MAX_FILESIZE = 10 * 1024 * 1024;

  // php/mail/findAll.php
  async findAll(
    draw: string,
    pageIndex: number,
    docId: number,
    groupId: number,
    search: string,
    practitionerId: string,
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
        ORDER BY favorite DESC`,
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
      ( USR_ID, header_id, footer_id, LET_TITLE, LET_MSG, footer_content, 
        footer_height, LET_TYPE, height, favorite) 
        VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        doctorId ? doctorId : null,
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
    // const groupId = logo?.group_id;
    context.logo = await this.getLogoAsBase64(logoFilename);

    const doctor = await this.dataSource.getRepository(UserEntity).findOne({
      relations: { preference: true, medical: true, address: true },
      where: { id: inputs?.doctor_id },
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

    if (inputs?.patient_id) {
      const patient = await this.contactRepo.findOne({
        relations: ['civilityTitle', 'phones.type', 'contactUsers'],
        where: { id: inputs?.patient_id },
      });
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

      const nextAppointment = await this.getNextAppointment(
        context['contact']['id'],
      );
      if (nextAppointment && nextAppointment?.EVT_START) {
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

      if (!context?.contact?.birthday) {
        const birthday = new Date(context?.contact?.birthday);
        const currentDate: Date = new Date(); // Replace this with the current date
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
        context.contact.age = formatAge(ageInYears, ageInMonths);
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
        temp[phone?.type?.name] = phone?.nbr;
      }
      context.contact.phone = temp;
      for (const doctor of patient.contactUsers) {
        if (doctor.id === inputs?.doctor_id) {
          context['contact'] = {
            ...context['contact'],
            amountDue: doctor.amount,
            dateLastRec: doctor.lastPayment,
            dateLastSoin: doctor.lastCare,
          };
        }
      }
    }

    if (inputs?.correspondent_id) {
      const correspondent = await this.dataSource
        .getRepository(CorrespondentEntity)
        .findOne({
          relations: ['gender'],
          where: { id: inputs?.correspondent_id },
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

  // application/Services/Mail.php => 429 -> 445
  async transform(inputs: any, context: any, signature?: any) {
    console.log('transform', inputs);
    inputs.body = await this.render(
      inputs?.body.replace(/[|].*?}/, '}'),
      context,
      signature,
    );
    if (inputs?.header) {
      inputs.header.body = await this.render(
        inputs?.header.body.replace(/[|].*?}/, '}'),
        context,
        signature,
      );
    }
    if (inputs?.footer) {
      inputs.footer.body = await this.render(
        inputs?.footer?.body.replace(/[|].*?}/, '}'),
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
    // const body = inputs?.body;

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
    const errParser = `</span></span></span><span style="vertical-align: inherit;"><span style="vertical-align: inherit;"><span style="vertical-align: inherit;">`;
    while (message.includes(errParser)) {
      message = message.replace(errParser, '');
    }
    // const uniqid = Date.now().toString();

    // Generate a unique identifier
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

  async sendTest(id: number) {
    await this.mailerService.sendMail({
      to: 'nguyenthanh.rise.88@gmail.com',
      subject: `Greeting from NestJS NodeMailer ${id}`,
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

  async sendFactureEmail(data: FactureEmailDataDto) {
    await this.mailerService.sendMail({
      from: data?.from,
      to: data?.to,
      subject: data?.subject,
      template: data?.template,
      attachments: data?.attachments,
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
  async pdf(inputs: MailInputsDto, options?: MailOptionsDto) {
    this.addPage(inputs);
    this.clean(inputs);
    this.addPageBreak(inputs);
    this.addFontAndSize(inputs);
    this.resizeTable(inputs);
    if (options?.preview) {
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

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(htmlString, 'text/html');
    const dom = new DOMParser().parseFromString(
      `<?xml encoding="utf-8" ?><div>${inputs.body}</div>`,
      'text/xml',
    );
    const nodes = xpath.select(
      'descendant-or-self::*[contains(@style,"font-family") or contains(@style,"font-size")]',
      dom,
    ) as HTMLElement[];

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
    contextNode: HTMLElement,
  ): HTMLElement[] {
    const parser = new DOMParser();
    const doc: Document = parser.parseFromString(
      contextNode.outerHTML,
      'text/html',
    );

    const select = xpath.useNamespaces({});
    const nodes = select(xpathExpression, doc) as Node[];
    const elementNodes: HTMLElement[] = [];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.nodeType === 1) {
        elementNodes.push(node as HTMLElement);
      }
    }

    return elementNodes;
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

  async update(inputs: UpdateMailDto) {
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
    const title = inputs?.title;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const res = await queryRunner.query(
        `
        UPDATE T_LETTERS_LET
        SET header_id = ?,
                  footer_id = ?,
          LET_TITLE = ?,
          LET_MSG = ?,
                  footer_content = ?,
                  footer_height = ?,
          LET_TYPE = ?,
          height = ?,
          favorite = ?
        WHERE LET_ID = ?
      `,
        [
          headerId,
          footerId,
          title,
          body,
          footerContent,
          footerHeight,
          type,
          height,
          favorite,
          inputs?.id,
        ],
      );
      await queryRunner.commitTransaction();
      return this.find(inputs?.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async sendTemplate(
    userId: number,
    payload: SendMailDto,
    files: Express.Multer.File[],
  ) {
    const mail = await this.findById(payload.id);
    if (mail instanceof CNotFoundRequestException) return mail;
    let mailTitle = mail.title;
    const mailFilename = sanitizeFilename(`${mailTitle}.pdf`);
    // const mailDirname = path ? path.join(process.cwd(), mailFilename) : '';
    const doctor = mail.doctor;
    const patient = mail.patient;
    const correspondent = mail?.conrrespondent;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    try {
      const mailTo: string[] = [];
      const messageTo: string[] = [];
      if (payload?.other && payload.other.length !== 0) {
        for (const mail of payload.other) {
          if (validateEmail(mail)) {
            mailTo.push(mail);
            messageTo.push(mail);
          }
        }
      }

      if (
        payload?.correspondent &&
        correspondent &&
        validateEmail(correspondent?.email)
      ) {
        mailTo.push(correspondent.email);
        messageTo.push(
          `${correspondent?.lastname} ${correspondent?.firstname} (${correspondent?.email})`,
        );
        if (patient) {
          mailTitle = `${patient?.lastname} ${patient?.firstname} - ${patient?.email}`;
        }
      }

      if (payload.patient && patient && validateEmail(patient?.email)) {
        mailTo.push(patient.email);
        messageTo.push(
          `${patient?.lastname} ${patient?.firstname} (${patient?.email})`,
        );
        await queryRunner.query(
          `
        INSERT INTO T_CONTACT_NOTE_CNO (CON_ID, CNO_DATE, CNO_MESSAGE)
        VALUES (?, CURDATE(), ?)`,
          [
            patient?.id,
            `Envoi du courrier ${mailFilename} par email : ${
              messageTo ? messageTo?.join(';') : ''
            }`,
          ],
        );
      }

      if (mailTo.length === 0) {
        return new CBadRequestException('Au moins un destinataire est requis');
      }

      const context = await this.contextMail(
        {
          patient_id: mail?.patient?.id ? mail.patient.id : null,
          correspondent_id: mail?.conrrespondent?.id
            ? mail.conrrespondent.id
            : null,
        },
        mail?.doctor?.id,
      );
      const mailConverted = await this.transform(mail, context, mailFilename);
      const htmlContent = mailConverted?.body
        ? mailConverted?.body
        : '<div></div>';
      await page.setContent(`<div style="padding: 30px;">${htmlContent}</div>`);

      const pdfBuffer = await page.pdf();
      console.log('pdfBuffer', pdfBuffer);

      // @TODO
      // Mail::pdf($mailConverted, array('filename' => $mailDirname));

      const subject = `${mail?.title} du ${dayjs(new Date()).format(
        'YYYY-MM-DD',
      )} de Dr ${mail?.user?.lastname} ${mail?.user?.firstname}`;

      if (mail?.patient) {
        subject.concat(
          ` pour ${mail.patient.lastname} ${mail.patient.firstname}`,
        );
      }

      const attachments: { filename: string; content: Buffer }[] = [];
      for (const file of files) {
        if (this.MAX_FILESIZE < file.size)
          return new CBadRequestException(
            'La taille des pièces jointes ne doit pas excéder 10Mo',
          );
        attachments.push({
          filename: file.originalname,
          content: file.buffer,
        });
      }

      const fullName = [mail?.user?.lastname, mail?.user?.firstname].join(' ');
      const emailTemplate = fs.readFileSync(
        path.join(__dirname, '../../../templates/mail/mailTemplate.hbs'),
        'utf-8',
      );
      const template = handlebars.compile(emailTemplate);
      mail.title = mailFilename;
      const mailBody = template({ fullName, mail });

      const result = await this.mailTransportService.sendEmail(userId, {
        from: doctor.email,
        to: mailTo,
        subject: subject,
        template: mailBody,
        context: mail,
        attachments: [
          {
            filename: mailFilename,
            content: pdfBuffer,
          },
          ...attachments,
        ],
      });

      if (
        result instanceof CBadRequestException ||
        (result instanceof SuccessResponse && !result?.success)
      )
        return new CBadRequestException(ErrorCode.CANNOT_SEND_MAIL);
      return { success: true };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      return new CBadRequestException(ErrorCode.CANNOT_SEND_MAIL);
    } finally {
      await queryRunner.release();
      await browser.close();
    }
  }
  /**
   * application/Repositories/Mail.php => 33 -> 44
   */
  async footers({
    doctor_id,
    patient_id,
    correspondent_id,
  }: {
    doctor_id: number;
    patient_id: number;
    correspondent_id: number;
  }) {
    try {
      const footers = await this.lettersRepo.find({
        where: {
          usrId: doctor_id,
          type: EnumLettersType.FOOTER,
        },
        relations: {
          doctor: true,
        },
        order: {
          title: 'ASC',
        },
      });

      const res: FindHeaderFooterRes[] = [];
      if (footers.length > 0) {
        footers.forEach((footer) => {
          res.push({
            id: footer.id,
            title: footer.title,
            body: footer.msg,
            type: footer.type,
            height: footer.height,
            favorite: footer.favorite,
            createdAt: footer.createdAt,
            updatedAt: footer.updatedAt,
          });
        });
      }

      if (patient_id) {
        const context = await this.contextMail(
          {
            patient_id,
            correspondent_id,
          },
          doctor_id,
        );

        res.forEach(async (item) => {
          if (item?.body) {
            item.body = await this.render(item?.body, context);
          }
        });
      }

      return res;
    } catch (err) {
      throw new CBadRequestException(err?.message);
    }
  }

  /**
   * application/Repositories/Mail.php => 15 -> 25
   */
  async headers({
    doctor_id,
    patient_id,
    correspondent_id,
  }: {
    doctor_id: number;
    patient_id: number;
    correspondent_id: number;
  }) {
    try {
      const headers = await this.lettersRepo.find({
        where: {
          usrId: doctor_id,
          type: EnumLettersType.HEADER,
        },
        relations: {
          doctor: true,
        },
        order: {
          title: 'ASC',
        },
      });

      const res: FindHeaderFooterRes[] = [];
      if (headers.length > 0) {
        headers.forEach((header) => {
          res.push({
            id: header.id,
            title: header.title,
            body: header.msg,
            type: header.type,
            height: header.height,
            favorite: header.favorite,
            createdAt: header.createdAt,
            updatedAt: header.updatedAt,
          });
        });
      }

      if (patient_id) {
        const context = await this.contextMail(
          {
            patient_id,
            correspondent_id,
          },
          doctor_id,
        );

        res.forEach(async (item) => {
          if (item?.body) {
            item.body = await this.render(item?.body, context);
          }
        });
      }

      return res;
    } catch (err) {
      throw new CBadRequestException(err?.message);
    }
  }

  async preview(
    id: number,
    doctorId: number,
    groupId: number,
  ): Promise<string | CBadRequestException> {
    try {
      const doctor = await this.dataSource.getRepository(UserEntity).findOne({
        where: { id: doctorId },
        relations: {
          medical: true,
          address: true,
        },
      });
      if (!doctor) return new CBadRequestException(ErrorCode.NOT_FOUND_DOCTOR);

      const today = new Date();
      const birthday = new Date(2000, 2, 14);
      const diffMonth = dayjs(today).diff(dayjs(birthday), 'month');
      const year = Math.floor(diffMonth / 12);
      const month = diffMonth - year * 12;

      const context = {
        today: this.formatDatetime(today, { dateStyle: 'short' }),
        todayLong: this.formatDatetime(today, { dateStyle: 'long' }),
        logo: '',
        praticien: {
          fullname: `${doctor?.lastname ? doctor.lastname : ''} ${
            doctor?.firstname ? doctor.firstname : ''
          }`,
          lastname: doctor?.lastname ? doctor.lastname : '',
          firstname: doctor?.firstname ? doctor.firstname : '',
          email: doctor?.email ? doctor.email : '',
          phoneNumber: doctor?.phoneNumber ? doctor.phoneNumber : '',
          gsm: doctor?.gsm ? doctor.gsm : '',
          faxNumber: doctor?.faxNumber ? doctor.faxNumber : '',
          numeroFacturant: doctor?.numeroFacturant
            ? doctor.numeroFacturant
            : '',
          rpps: doctor?.medical?.rppsNumber ? doctor.medical.rppsNumber : '',
          address: {
            street: doctor?.address?.street ? doctor.address.street : '',
            zipCode: doctor?.address?.zipCode ? doctor.address.zipCode : '',
            city: doctor?.address?.city ? doctor.address.city : '',
            country: doctor?.address?.country ? doctor.address.country : '',
          },
          medical: {
            rppsNumber: doctor?.medical?.rppsNumber
              ? doctor.medical.rppsNumber
              : '',
          },
        },
        contact: {
          gender: 'M',
          genderLong: 'Monsieur',
          dear: 'Chèr',
          nbr: '9999',
          lastname: 'FAMILLEDEUX',
          firstname: 'PHILIPPE',
          birthday: birthday.toDateString(),
          age: `${year > 0 ? `${year} ans` : ''} ${
            month > 0 ? `${month} mois` : ''
          }`,
          email: 'philippe@familledeux.com',
          amountDue: '9999.99',
          dateLastRec: '2020-01-01',
          dateLastSoin: '2020-01-01',
          dateOfNextReminder: '2020-01-01',
          nextAppointmentDate: '2020-01-01',
          nextAppointmentTime: '00:00:00',
          nextAppointmentDuration: '12:00:00',
          nextAppointmentTitle: 'Appointment Title',
          address: {
            street: '515 CHE DU MAS DE ROCHET',
            zipCode: '34170',
            city: 'CASTELNAU LE LEZ',
            country: 'FRANCE',
          },
          phones: {
            home: '(01) 234 567 89',
            mobile: '(01) 234 567 89',
            office: '(01) 234 567 89',
            fax: '(01) 234 567 89',
          },
          dental: {
            insee: '1661926220098',
            inseeKey: '96',
          },
        },
        correspondent: {
          gender: 'Mme',
          dear: 'Chère',
          lastname: 'FAMILLEDEUX',
          firstname: 'ELISEE',
          type: 'Médecin',
          email: 'elisee@familledeux.com',
          msg: 'correspondent msg',
          address: {
            street: '515 CHE DU MAS DE ROCHET',
            zipCode: '34170',
            city: 'CASTELNAU LE LEZ',
            country: 'FRANCE',
          },
          phones: {
            home: '(01) 234 567 89',
            mobile: '(01) 234 567 89',
            office: '(01) 234 567 89',
            fax: '(01) 234 567 89',
          },
        },
      };

      const logoStatement = await this.dataSource.query(
        `SELECT
        UPL.UPL_FILENAME
          FROM T_GROUP_GRP GRP
          JOIN T_UPLOAD_UPL UPL
          WHERE GRP.GRP_ID = ?
            AND GRP.UPL_ID = UPL.UPL_ID`,
        [groupId],
      );
      if (logoStatement.length > 0) {
        const logo = logoStatement[0];
        fs.access(`${logo['UPL_FILENAME']}`, fs.constants.F_OK, (err) => {
          if (err) {
            console.log('File does not exist');
            return;
          }

          fs.readFile(`${logo['UPL_FILENAME']}`, 'utf8', (err, data) => {
            if (err) {
              console.log('Error reading file:', err);
              return;
            }

            const base64Data = Buffer.from(data).toString('base64');
            const mimeType = 'text/plain';
            const dataUrl = `data:${mimeType};base64,${base64Data}`;
            context.logo = `<img src=\"${dataUrl}" />`;
          });
        });
      }
      const paymentScheduleTemplate = fs.readFileSync(
        `${process.cwd()}/templates/mail/payment_schedule.hbs`,
        'utf-8',
      );
      const template = handlebars.compile(paymentScheduleTemplate);
      const mailBody = template({
        payment_schedule: {
          label: 'Echéancier',
          amount: 100.0,
          lines: [
            {
              date: '2023-01-01',
              amount: 25.0,
            },
            {
              date: '2023-02-01',
              amount: 25.0,
            },
            {
              date: '2023-03-01',
              amount: 25.0,
            },
            {
              date: '2023-04-01',
              amount: 25.0,
            },
          ],
        },
      });
      context['payment_schedule'] = mailBody;
      const mail = await this.findById(id);
      if (mail instanceof CNotFoundRequestException) return mail;
      const mailConverted = await this.transform(mail, context);
      //  @TODO
      // Mail::pdf($mailConverted);
      if (mailConverted?.body) return mailConverted.body;
      return '';
    } catch (err) {
      return new CBadRequestException(ErrorCode.FORBIDDEN);
    }
  }
}
