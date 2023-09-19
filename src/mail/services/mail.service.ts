import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as dayjs from 'dayjs';
import { DataSource, Repository } from 'typeorm';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { EnumLettersType, LettersEntity } from '../../entities/letters.entity';
import { ErrorCode } from 'src/constants/error';
import { UpdateMailDto } from '../dto/mail.dto';
import { FindVariableDto } from '../dto/findVariable.dto';
import { mailVariable } from 'src/constants/mailVariable';
import { FactureEmailDataDto } from 'src/dental/dto/facture.dto';
import { sanitizeFilename } from 'src/common/util/file';
import * as path from 'path';
import { SendMailDto } from '../dto/sendMail.dto';
import { validateEmail } from 'src/common/util/string';
import { MailTransportService } from './mailTransport.service';
import { SuccessResponse } from 'src/common/response/success.res';
import { FindHeaderFooterRes } from '../response/findHeaderFooter.res';
import puppeteer from 'puppeteer';
import { TemplateMailService } from './template.mail.service';
import { DataMailService } from './data.mail.service';
import { PreviewMailService } from './preview.mail.service';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private mailTransportService: MailTransportService,
    private dataSource: DataSource,
    private templateMailService: TemplateMailService,
    private dataMailService: DataMailService,
    private previewMailService: PreviewMailService,
    @InjectRepository(LettersEntity)
    private lettersRepo: Repository<LettersEntity>,
  ) {}

  MAX_FILESIZE = 10 * 1024 * 1024;

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
      const context = await this.templateMailService.contextMail(
        payload,
        doctorId,
      );
      respon = await this.templateMailService.render(respon, context);
    }
    return respon;
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
      await queryRunner.query(
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
      return this.dataMailService.find(inputs?.id);
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
    docId: number,
  ) {
    const mail = await this.dataMailService.findById(payload.id);
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

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
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

      const context = await this.templateMailService.contextMail(
        {
          patient_id: mail?.patient?.id ? mail.patient.id : null,
          correspondent_id: mail?.conrrespondent?.id
            ? mail.conrrespondent.id
            : null,
        },
        docId,
      );
      const mailConverted = await this.previewMailService.transform(
        mail,
        context,
        mailFilename,
      );
      const htmlContent = mailConverted?.body
        ? mailConverted?.body
        : '<div></div>';
      await page.setContent(`<div style="padding: 30px;">${htmlContent}</div>`);

      const pdfBuffer = await page.pdf();
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
        html: mailBody,
        // context: mail,
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
        const context = await this.templateMailService.contextMail(
          {
            patient_id,
            correspondent_id,
          },
          doctor_id,
        );

        res.forEach(async (item) => {
          if (item?.body) {
            item.body = await this.templateMailService.render(
              item?.body,
              context,
            );
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
        const context = await this.templateMailService.contextMail(
          {
            patient_id,
            correspondent_id,
          },
          doctor_id,
        );

        res.forEach(async (item) => {
          if (item?.body) {
            item.body = await this.templateMailService.render(
              item?.body,
              context,
            );
          }
        });
      }

      return res;
    } catch (err) {
      throw new CBadRequestException(err?.message);
    }
  }
}
