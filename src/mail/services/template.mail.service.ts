import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ContextMailDto } from '../dto/findVariable.dto';
import { UserEntity } from 'src/entities/user.entity';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UploadEntity } from 'src/entities/upload.entity';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { CorrespondentEntity } from 'src/entities/correspondent.entity';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';

@Injectable()
export class TemplateMailService {
  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
    @InjectRepository(ContactEntity)
    private contactRepo: Repository<ContactEntity>,
  ) {}

  // application/Services/Mail.php=> 454 -> 489
  async render(
    message: string,
    context: any,
    signature?: any,
    isPreview?: boolean,
  ) {
    const errParser = `</span></span></span><span style="vertical-align: inherit;"><span style="vertical-align: inherit;"><span style="vertical-align: inherit;">`;
    while (message.includes(errParser)) {
      message = message.replace(errParser, '');
    }
    // const uniqid = Date.now().toString();

    // Generate a unique identifier
    // Replace the default date format in Handlebars
    handlebars.registerHelper('formatDate', function (dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });
    });

    let content = message;
    if (isPreview) content = handlebars.compile(message)(context);

    // Replace the signature for the practitioner if it exists in the context
    if (context.praticien?.signature) {
      const htmlString = context.praticien?.signature;
      const imgTagPattern = /<img\s[^>]*src=['"]([^'"]*)['"][^>]*>/i;
      const match = htmlString.match(imgTagPattern);
      if (match) {
        const srcAttribute = match[1].trim();
        if (srcAttribute !== '') {
          const regexPractitionerSignature =
            /(<img[^>]+signaturePraticien[^>]+\/?>)/;
          content = content.replace(
            regexPractitionerSignature,
            context.praticien.signature,
          );
        }
      }
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
    if (!doctor) throw new CBadRequestException(ErrorCode.YOU_NOT_HAVE_DOCTOR);

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
      if (patient.birthday) {
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

  public formatDatetime(datetime: Date, format: { [key: string]: string }) {
    const formatter = new Intl.DateTimeFormat('fr-FR', format);
    return formatter.format(datetime);
  }
}
