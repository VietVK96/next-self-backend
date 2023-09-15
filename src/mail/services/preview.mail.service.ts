import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource } from 'typeorm';
import { DataMailService } from './data.mail.service';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { TemplateMailService } from './template.mail.service';

@Injectable()
export class PreviewMailService {
  constructor(
    private dataSource: DataSource,
    private dataMailService: DataMailService,
    private templateMailService: TemplateMailService,
  ) {}

  async preview(id: number, doctorId: number, groupId: number) {
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
      const mail = await this.dataMailService.findById(id);
      if (mail instanceof CNotFoundRequestException) return mail;
      //  @TODO
      // Mail::pdf($mailConverted);
      return await this.transform(mail, context, null, true);
    } catch (err) {
      return new CBadRequestException(ErrorCode.FORBIDDEN);
    }
  }

  // application/Services/Mail.php => 429 -> 445
  async transform(
    inputs: any,
    context: any,
    signature?: any,
    isPreview?: boolean,
  ) {
    inputs.body = await this.templateMailService.render(
      inputs?.body.replace(/[|].*?}/, '}'),
      context,
      signature,
      isPreview,
    );
    if (inputs?.header) {
      inputs.header.body = await this.templateMailService.render(
        inputs?.header.body.replace(/[|].*?}/, '}'),
        context,
        signature,
        isPreview,
      );
    }
    if (inputs?.footer) {
      inputs.footer.body = await this.templateMailService.render(
        inputs?.footer?.body.replace(/[|].*?}/, '}'),
        context,
        signature,
        isPreview,
      );
      inputs.footer_content = inputs?.footer?.body;
      inputs.footer_height = inputs?.footer?.height;
    }
    return inputs;
  }

  public formatDatetime(datetime: Date, format: { [key: string]: string }) {
    const formatter = new Intl.DateTimeFormat('fr-FR', format);
    return formatter.format(datetime);
  }
}
