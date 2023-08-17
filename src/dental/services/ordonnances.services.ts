import { Injectable } from '@nestjs/common';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OrdonnancesDto } from '../dto/ordonnances.dto';
import { MedicalOrderEntity } from 'src/entities/medical-order.entity';
import { ErrorCode } from 'src/constants/error';
import { MedicalHeaderEntity } from 'src/entities/medical-header.entity';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { EnregistrerFactureDto, PrintPDFDto } from '../dto/facture.dto';
import { checkBoolean, checkId } from 'src/common/util/number';
import { PdfTemplateFile, customCreatePdf } from 'src/common/util/pdf';
import { UserEntity } from 'src/entities/user.entity';
import * as cheerio from 'cheerio';
import * as path from 'path';
import {
  br2nl,
  generateFullName,
  nl2br,
  validateEmail,
} from 'src/common/util/string';
import { checkDay } from 'src/common/util/day';
import { generateBarcode } from 'src/common/util/image';
import * as handlebars from 'handlebars';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import * as dayjs from 'dayjs';
import * as fs from 'fs';
import { MailTransportService } from 'src/mail/services/mailTransport.service';
import { PlanPlfEntity } from 'src/entities/plan-plf.entity';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';

@Injectable()
export class OrdonnancesServices {
  constructor(
    @InjectRepository(MedicalHeaderEntity)
    private medicalHeaderRepository: Repository<MedicalHeaderEntity>,
    @InjectRepository(MedicalOrderEntity)
    private medicalRepository: Repository<MedicalOrderEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(MedicalOrderEntity)
    private medicalOrderRepo: Repository<MedicalOrderEntity>,
    @InjectRepository(PlanPlfEntity)
    private planPlfRepository: Repository<PlanPlfEntity>,
    @InjectRepository(ContactNoteEntity)
    private contactNoteRepo: Repository<ContactNoteEntity>,
    private mailTransportService: MailTransportService,
  ) {}

  //ecoophp/dental/ordonnances/ordo_email.php
  async sendMail(id: number, identity: UserIdentity) {
    try {
      id = checkId(id);
      const data = await this.medicalOrderRepo.findOne({
        where: {
          id: id || 0,
        },
        relations: {
          user: {
            setting: true,
            address: true,
          },
          contact: true,
        },
      });

      if (
        !validateEmail(data?.user?.email) ||
        !validateEmail(data?.contact?.email)
      ) {
        throw new CBadRequestException(
          'Veuillez renseigner une adresse email valide dans la fiche patient',
        );
      }

      const date = dayjs(data.date).locale('fr').format('DD MMM YYYY');
      const medicalOrderDate = dayjs(data.date).format('DD/MM/YYYY');
      const filename = `Ordonnance_${dayjs(data.date).format(
        'DD_MM_YYYY',
      )}.pdf`;
      const emailTemplate = fs.readFileSync(
        path.join(process.cwd(), 'templates/mail', 'quote.hbs'),
        'utf-8',
      );
      const userFullName = generateFullName(
        data?.user?.firstname,
        data?.user?.lastname,
      );

      // get template
      handlebars.registerHelper({
        isset: (v1: any) => {
          if (Number(v1)) return true;
          return v1 ? true : false;
        },
      });
      const template = handlebars.compile(emailTemplate);
      const mailBody = template({ data, date, userFullName });

      const subject = `Ordonnance du ${date} de Dr ${userFullName} pour ${generateFullName(
        data?.contact?.firstname,
        data?.contact?.lastname,
      )}`;
      await this.mailTransportService.sendEmail(identity.id, {
        from: data.user.email,
        to: data.contact.email,
        subject,
        template: mailBody,
        context: {
          quote: data,
        },
        attachments: [
          {
            filename: filename,
            content: await this.generatePdf({ id }, identity),
          },
        ],
      });
      await this.contactNoteRepo.save({
        conId: data.conId,
        message: `Envoi par email de l'ordonnance du ${medicalOrderDate} de ${data.user.lastname} ${data.user.firstname}`,
      });
      return {
        success: true,
      };
    } catch (error) {
      throw new CBadRequestException(ErrorCode.CANNOT_SEND_MAIL);
    }
  }

  async update(payload: OrdonnancesDto) {
    try {
      if ((payload?.creation_date as string) && (payload?.end_date as string)) {
        await this.medicalRepository.save({
          usrId: payload?.user_id,
          conId: payload?.patient_id,
          title: payload?.title,
          date: payload?.creation_date,
          endDate: payload?.end_date,
        });
      }

      if (payload?.keep_params === 1) {
        const medicalHeader = this.medicalHeaderRepository.findOne({
          where: { userId: payload?.user_id },
        });
        if (!medicalHeader) {
          await this.medicalHeaderRepository.create({
            userId: payload?.user_id,
            msg: payload?.header_msg,
            address: payload?.address,
            identPrat: payload?.ident_prat,
            height: payload?.header_height,
            format: payload?.format,
          });
        }
        await this.medicalHeaderRepository.save({
          userId: payload?.user_id,
          msg: payload?.header_msg,
          address: payload?.address,
          identPrat: payload?.ident_prat,
          height: payload?.header_height,
          format: payload?.format,
          headerEnable: payload?.header_enable,
        });
        return medicalHeader;
      }
      {
        const medicalHeader = this.medicalHeaderRepository.findOne({
          where: { userId: payload?.user_id },
        });
        return (await medicalHeader).id;
      }
    } catch {
      return new CBadRequestException(ErrorCode.NOT_FOUND);
    }
  }

  async getMedicalByPatientId(patientId: number, currentUser: UserIdentity) {
    const medicalOrder = await this.medicalRepository.findOne({
      where: { conId: patientId, usrId: currentUser?.id },
      order: { createdAt: 'DESC' },
    });
    if (!medicalOrder)
      throw new CNotFoundRequestException(ErrorCode.STATUS_NOT_FOUND);
    return medicalOrder;
  }

  async generatePdf(req: PrintPDFDto, identity: UserIdentity) {
    const id = checkId(req?.id);
    try {
      const medicalOrder = await this.medicalRepository.findOne({
        where: {
          id: id || 0,
          user: {
            organizationId: identity.org,
          },
        },
        relations: {
          user: true,
        },
      });

      const date_ordonnance = medicalOrder?.date;
      // const format_papier = medicalOrder?.format;
      const ident_patient = medicalOrder?.identContact;
      const ident_prat = medicalOrder?.identPrat;
      const adresse = medicalOrder?.address;
      const complement_entete = medicalOrder?.headerMsg;
      const numberOfPrescription = medicalOrder?.numberOfPrescription;
      const prescriptions = medicalOrder?.prescription.replace(
        /textarea/gi,
        'div',
      );
      const comment = medicalOrder?.comment;
      const headerEnable = checkBoolean(medicalOrder?.headerEnable);
      const medicalOrderSignaturePraticien = medicalOrder?.signaturePraticien;
      const finessNumber = medicalOrder?.user?.finess;

      const user = await this.userRepository.findOne({
        where: { id: medicalOrder.usrId },
        relations: { medical: true },
      });
      const rppsNumber = user?.medical?.rppsNumber;

      // Load the HTML content into cheerio
      const cheerioInstance = cheerio.load(
        '<ul>' + br2nl(prescriptions) + '</ul>',
      );

      // Get the list items with div elements containing the class 'crossDelete' and line breaks
      const entries = cheerioInstance('li > div.crossDelete, li > br');

      // Remove the selected elements from the DOM
      entries.remove();

      // Extract the cleaned HTML content
      const cleanedHTML = cheerioInstance('ul').html();

      // 'cleanedHTML' now contains the HTML content with the unwanted elements removed
      // Now let's convert the 'format_papier' to JavaScript equivalent
      // let format: string[];
      // let orientation: string;
      // const matches = format_papier.match(/^([0-9]+)x([0-9]+)$/);

      // if (matches) {
      //   format = [matches[1], matches[2]];
      //   orientation = 'P';
      // } else {
      //   format = [format_papier.substring(0, 2)];
      //   orientation = format_papier === 'A5p' ? 'L' : 'P';
      // }

      /* versions à imprimer */
      const versions: string[] = [];
      if (req?.original) {
        versions.push('original');
      }
      if (req?.duplicate) {
        versions.push('duplicata');
      }
      if (!versions.length) {
        // rien n'est spécifié, on imprime les deux par défaut
        versions.push('original');
        versions.push('duplicata');
      }

      const imgFinessNumber = await generateBarcode({ text: finessNumber });
      const imgRppsNumber = await generateBarcode({ text: rppsNumber });
      const data = {
        ident_prat: nl2br(ident_prat),
        adresse: nl2br(adresse),
        complement_entete: nl2br(complement_entete),
        rppsNumber,
        finessNumber,
        headerEnable,
        versions,
        versionsLength: versions.length - 1,
        ident_patient,
        prescriptions: nl2br(cleanedHTML),
        numberOfPrescription,
        medicalOrderSignaturePraticien,
        hasMedicalOrderSignaturePraticien: medicalOrderSignaturePraticien
          ? true
          : false,
        comment: nl2br(comment),
        hasComment: comment ? true : false,
        date_ordonnance: checkDay(date_ordonnance, 'DD/MM/YYYY'),
        bodyMargin: 50,
        imgFinessNumber,
        imgRppsNumber,
      };
      console.log('---aaa', data.adresse);

      const filePath = path.join(
        process.cwd(),
        'templates/pdf/ordo',
        'ordo.hbs',
      );
      const files: PdfTemplateFile[] = [
        {
          data,
          path: filePath,
        },
      ];

      const options = {
        format: 'A4',
        displayHeaderFooter: true,
        footerTemplate: '',
        margin: {
          left: '5mm',
          top: '5mm',
          right: '5mm',
          bottom: '5mm',
        },
      };

      return customCreatePdf({ files, options });
    } catch (error) {
      throw new CBadRequestException(ErrorCode.ERROR_GET_PDF);
    }
  }
}
