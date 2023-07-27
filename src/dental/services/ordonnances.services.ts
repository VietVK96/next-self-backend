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
import { generateBarcode } from '../constant/hbrHelper';
import { br2nl } from 'src/common/util/string';
import { checkDay } from 'src/common/util/day';

@Injectable()
export class OrdonnancesServices {
  constructor(
    @InjectRepository(MedicalHeaderEntity)
    private medicalHeaderRepository: Repository<MedicalHeaderEntity>,
    @InjectRepository(MedicalOrderEntity)
    private medicalRepository: Repository<MedicalOrderEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

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

  async getMail(payload: EnregistrerFactureDto) {
    if (payload?.user_id) {
      return payload?.user_id;
    }
    return new CNotFoundRequestException(ErrorCode.STATUS_NOT_FOUND);
  }

  async generatePdf(req: PrintPDFDto, identity: UserIdentity) {
    const id = checkId(req?.id);
    try {
      const medicalOrder = await this.medicalRepository.findOne({
        where: {
          id,
          user: {
            organizationId: identity.org,
          },
        },
        relations: {
          user: true,
        },
      });

      const date_ordonnance = medicalOrder?.date;
      const format_papier = medicalOrder?.format;
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
      let format: string[];
      let orientation: string;
      const matches = format_papier.match(/^([0-9]+)x([0-9]+)$/);

      if (matches) {
        format = [matches[1], matches[2]];
        orientation = 'P';
      } else {
        format = [format_papier.substring(0, 2)];
        orientation = format_papier === 'A5p' ? 'L' : 'P';
      }

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

      const data = {
        ident_prat: br2nl(ident_prat),
        adresse: br2nl(adresse),
        complement_entete: br2nl(complement_entete),
        rppsNumber,
        finessNumber,
        headerEnable,
        versions,
        versionsLength: versions.length - 1,
        ident_patient,
        prescriptions: br2nl(cleanedHTML),
        numberOfPrescription,
        medicalOrderSignaturePraticien,
        hasMedicalOrderSignaturePraticien: medicalOrderSignaturePraticien
          ? true
          : false,
        comment: br2nl(comment),
        hasComment: comment ? true : false,
        date_ordonnance: checkDay(date_ordonnance, 'DD/MM/YYYY'),
        bodyMargin: 50,
      };
      data;
      const helpers = {
        generateBarcode: generateBarcode,
      };
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

      return customCreatePdf({ files, options, helpers });
    } catch (error) {
      throw new CBadRequestException(ErrorCode.ERROR_GET_PDF);
    }
  }
}
