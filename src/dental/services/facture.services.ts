import { Injectable } from '@nestjs/common';
import {
  And,
  DataSource,
  FindOptionsWhere,
  In,
  IsNull,
  LessThanOrEqual,
  Like,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EnregistrerFactureDto,
  FactureEmailDto,
  FactureFindEventTasksDto,
  PrintPDFDto,
} from '../dto/facture.dto';
import { BillEntity } from 'src/entities/bill.entity';
import { BillLineEntity } from 'src/entities/bill-line.entity';
import { MedicalHeaderEntity } from 'src/entities/medical-header.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import {
  EnumPrivilegeTypeType,
  PrivilegeEntity,
} from 'src/entities/privilege.entity';
import { UserEntity } from 'src/entities/user.entity';
import { StringHelper } from 'src/common/util/string-helper';
import { ContactEntity } from 'src/entities/contact.entity';
import { AddressEntity } from 'src/entities/address.entity';
import * as path from 'path';
import { checkDay } from 'src/common/util/day';
import { checkBoolean, checkId, checkNumber } from 'src/common/util/number';
import {
  AjaxEventTaskRes,
  AjaxSeancesCaseRes,
  DetailsRes,
  InitFactureRes,
} from '../res/facture.res';
import { PdfTemplateFile, customCreatePdf } from 'src/common/util/pdf';
import { facturePdfFooter, facturePdfFooter1 } from '../constant/htmlTemplate';
import { br2nl, nl2br } from 'src/common/util/string';
import { validateEmail } from 'src/common/util/string';
import { format, getDayOfYear } from 'date-fns';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { MailTransportService } from 'src/mail/services/mailTransport.service';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as dayjs from 'dayjs';
import { DEFAULT_LOCALE } from 'src/constants/default';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class FactureServices {
  constructor(
    private mailTransportService: MailTransportService,
    @InjectRepository(BillEntity)
    private billRepository: Repository<BillEntity>,
    @InjectRepository(BillLineEntity)
    private billLineRepository: Repository<BillLineEntity>,
    @InjectRepository(MedicalHeaderEntity)
    private medicalHeaderRepository: Repository<MedicalHeaderEntity>,
    @InjectRepository(EventTaskEntity)
    private eventTaskRepository: Repository<EventTaskEntity>,
    @InjectRepository(PrivilegeEntity)
    private privilegeRepository: Repository<PrivilegeEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(ContactEntity)
    private contactRepository: Repository<ContactEntity>,
    @InjectRepository(AddressEntity)
    private addressRepository: Repository<AddressEntity>,
    @InjectRepository(ContactNoteEntity)
    private contactNoteRepository: Repository<ContactNoteEntity>,
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  async requestAjax(payload: EnregistrerFactureDto) {
    const id_facture = checkId(payload?.id_facture);
    const id_facture_ligne = checkId(payload?.id_facture_ligne);
    const user_id = checkId(payload?.user_id);
    switch (payload.operation) {
      case 'enregistrer': {
        try {
          const idBill = await this.billRepository.findOne({
            where: { id: id_facture || 0 },
          });

          if (idBill) {
            await this.billRepository.save({
              id: id_facture,
              date: payload?.dateFacture,
              name: payload?.titreFacture,
              identPrat: payload?.identPrat,
              identPat: payload?.identPat,
              modePaiement: payload?.modePaiement,
              infosCompl: payload?.infosCompl,
              amount: payload?.amount || 0,
              secuAmount: payload?.secuAmount || 0,
              signatureDoctor: payload?.signatureDoctor,
              template: payload?.template || 1,
              delete: 0,
            });
            return 'Facture enregistrée correctement';
          } else {
            throw new CBadRequestException('Bill does not exist');
          }
        } catch {
          throw new CBadRequestException(
            'Erreur -3 : Problème durant la sauvegarde de la facture ... ',
          );
        }
      }

      case 'supprimerLigne': {
        try {
          const billlines = await this.billLineRepository.find({
            where: { id: id_facture_ligne || 0 },
          });
          if (billlines) {
            return await this.billLineRepository.delete(id_facture_ligne);
          }
        } catch {
          return "Erreur -5 : Problème durant la suppression d'une ligne de la facture ... ";
        }
      }

      case 'enregistrerEnteteParDefaut': {
        try {
          const medicalHeader = await this.medicalHeaderRepository.findOne({
            where: { userId: user_id || 0 },
          });
          if (!medicalHeader) {
            const medicalHeaderData = this.medicalHeaderRepository.create({
              userId: payload?.user_id,
              name: payload?.titreFacture,
              address: payload?.addrPrat,
              identPrat: payload?.identPrat,
            });
            await this.medicalHeaderRepository.save(medicalHeaderData);
          }
          await this.medicalHeaderRepository.update(medicalHeader.id, {
            userId: payload?.user_id,
            name: payload?.titreFacture,
            address: payload?.addrPrat,
            identPrat: payload?.identPrat,
          });
        } catch {
          throw new CBadRequestException(ErrorCode.STATUS_NOT_FOUND);
        }
        break;
      }

      case 'enregistrerLigne': {
        try {
          if (payload?.typeLigne === 'operation') {
            const billLine = await this.billLineRepository.findOne({
              where: { id: id_facture_ligne || 0 },
            });
            if (!billLine) {
              const dataBillLine = this.billLineRepository.create({
                amount: payload?.prixLigne,
                teeth: payload?.dentsLigne,
                cotation: payload?.cotation,
                secuAmount: payload?.secuAmount,
                materials: payload?.materials,
                bilId: id_facture,
                date: payload?.dateLigne,
                msg: payload?.descriptionLigne,
                pos: payload?.noSequence,
                type: payload?.typeLigne,
              });
              const data = await this.billLineRepository.save(dataBillLine);
              return data.id;
            }
            await this.billLineRepository.update(id_facture_ligne, {
              amount: payload?.prixLigne,
              teeth: payload?.dentsLigne,
              cotation: payload?.cotation,
              secuAmount: payload?.secuAmount,
              materials: payload?.materials,
              bilId: id_facture,
              date: payload?.dateLigne,
              msg: payload?.descriptionLigne,
              pos: payload?.noSequence,
              type: payload?.typeLigne,
            });
            return id_facture_ligne;
          } else {
            const billLine = await this.billLineRepository.findOne({
              where: { id: id_facture || 0 },
            });
            if (!billLine) {
              const billLineData = this.billLineRepository.create({
                bilId: id_facture_ligne,
                pos: payload?.noSequence,
                type: payload?.typeLigne,
              });
              const data = await this.billLineRepository.save(billLineData);
              return data.id;
            }
            await this.billLineRepository.update(id_facture_ligne, {
              bilId: id_facture_ligne,
              pos: payload?.noSequence,
              type: payload?.typeLigne,
            });
            return id_facture_ligne;
          }
        } catch {
          throw new CBadRequestException(ErrorCode.STATUS_NOT_FOUND);
        }
      }

      case 'seances':
        {
          try {
            let eventTasks = await this.findEventTasks(payload);

            if (checkBoolean(payload?.displayOnlyProsthesis)) {
              eventTasks = eventTasks.filter((eventTask) => {
                return this.isProsthesis(eventTask?.ccamFamily);
              });
            }

            let date = '';
            let i = 0;
            const result = eventTasks.reduce((result, eventTask) => {
              let cotation = '';

              switch (eventTask?.dental?.type) {
                case 'CCAM':
                  cotation = eventTask?.dental?.ccamCode;
                  break;

                case 'NGAP':
                  cotation =
                    ('   ' + (eventTask?.dental?.ngapKey?.name || ''))?.slice(
                      -3,
                    ) +
                    ' ' +
                    eventTask.dental.coef;
                  break;

                default:
                  cotation = 'NPC';
                  break;
              }

              const eTask: AjaxEventTaskRes = {
                ...eventTask,
                cotation,
                date: eventTask?.date,
                name: eventTask?.name,
                amount: eventTask?.amount,
                ccamFamily: eventTask?.ccamFamily,
                teeth: eventTask?.dental?.teeth,
                secuAmount: eventTask?.dental?.secuAmount,
                exceeding: eventTask?.dental?.exceeding,
                type: eventTask?.dental?.type,
                ccamCode: eventTask?.dental?.ccamCode,
                coef: eventTask?.dental?.coef,
                ngapKeyName: eventTask?.dental?.ngapKey?.name,
              };

              if (date && eventTask.date === date) {
                result[i].data.push(eTask);
              } else {
                if (date === '') {
                  result[0] = {
                    date: eventTask.date,
                    data: [eTask],
                  };
                } else {
                  result[i + 1] = {
                    date: eventTask.date,
                    data: [eTask],
                  };
                  i++;
                }
              }
              date = eventTask.date;
              return result;
            }, [] as AjaxSeancesCaseRes[]);

            return result;
          } catch (error) {
            throw new CBadRequestException(ErrorCode.NOT_FOUND);
          }
        }
        break;
    }
  }

  /**
   * ecoophp/dental/facture/facture_requetes_ajax.php 34 -72
   * @param payload : FactureFindEventTasksDto
   * @returns EventTaskEntity[]
   */
  async findEventTasks(
    payload: FactureFindEventTasksDto,
  ): Promise<EventTaskEntity[]> {
    const user_id = checkId(payload?.user_id);
    const patient_id = checkId(payload?.patient_id);
    const where: FindOptionsWhere<EventTaskEntity> = {
      usrId: user_id,
      conId: patient_id,
      date: And(
        MoreThanOrEqual(payload?.dateDeb),
        LessThanOrEqual(payload?.dateFin),
      ),
      amountBackup: IsNull(),
    };
    if (checkBoolean(payload?.displayOnlyActsRealized)) {
      where.status = MoreThan(0);
    }
    if (checkBoolean(payload?.displayOnlyActsListed)) {
      where.dental = [
        { ccamCode: Not(IsNull()) },
        {
          ngapKey: {
            name: Not(IsNull()),
          },
        },
      ];
    }
    return await this.eventTaskRepository.find({
      select: {
        id: true,
        date: true,
        name: true,
        amount: true,
        dental: {
          teeth: true,
          secuAmount: true,
          exceeding: true,
          type: true,
          ccamCode: true,
          coef: true,
          ngapKey: {
            name: true,
          },
        },
      },
      relations: {
        dental: {
          ngapKey: true,
        },
      },
      where,
      order: {
        date: 'ASC',
      },
    });
  }

  async getInitChamps(
    userId: number,
    contactId: number,
    identity: UserIdentity,
  ) {
    const withs = userId;
    const userID = identity?.id as number;
    const groupID = identity?.org;
    let userIds: number[];

    const id_facture = 0;
    const id_societe = 0;
    const id_user = userID;
    const id_devis = 0;
    const dateFacture = new Date().toISOString().split('T')[0];
    const infosCompl = '';
    const modePaiement = 'Non Payee';

    if (withs !== null) {
      const type = EnumPrivilegeTypeType.NONE;
      const privilege = await this.privilegeRepository.find({
        where: {
          usrId: userID,
          usrWithId: In([withs]),
          type: Not(type),
        },
      });
      if (privilege === null) {
        console.error(
          "Vous n'avez pas assez de privilège pour accéder aux factures",
        );
      } else {
        userIds = [withs];
      }
    }

    const user = await this.userRepository.findOne({
      where: { id: In(userIds) },
    });
    if (!user) {
      console.error(
        "Vous n'avez pas assez de privilège pour accéder aux factures",
      );
    }

    let identPrat = user?.lastname + user?.firstname + '\nChirurgien Dentiste';
    let adressePrat = '';
    let titreFacture = encodeURIComponent(
      "Note d'honoraires pour traitement bucco-dentaire",
    );
    let identPat: string;
    const adressePratEntity = user?.address;
    if (adressePratEntity) {
      adressePrat =
        adressePratEntity?.street +
        '\n' +
        adressePratEntity?.zipCode +
        '' +
        adressePratEntity?.city +
        '\n\n';
    }
    const userNumeroFacturant = user?.numeroFacturant;
    if (userNumeroFacturant) {
      adressePrat = 'N° ADELI : ' + userNumeroFacturant;
    }

    const medicalHeader = await this.medicalHeaderRepository.findOneBy({
      userId: userID,
    });
    if (medicalHeader) {
      identPrat =
        medicalHeader?.identPrat !== null
          ? StringHelper.br2nl(medicalHeader?.identPrat, '')
          : identPrat;
      adressePrat =
        medicalHeader?.address !== null
          ? StringHelper.br2nl(medicalHeader?.address, '')
          : adressePrat;
      titreFacture = medicalHeader?.name || titreFacture;
    }
    if (
      user?.freelance &&
      !/("Entrepreneur Individuel"|"EI")/.test(identPrat)
    ) {
      identPrat = identPrat.replace(
        new RegExp('(' + user.lastname + user?.firstname + ')'),
        '$1 "EI"',
      );
    } else if (
      !user?.freelance &&
      /("Entrepreneur Individuel"|"EI")/.test(identPrat)
    ) {
      identPrat = identPrat.replace(/("Entrepreneur Individuel"|"EI")/, '');
    }

    // ==== vérification si il y a un identifiant de contact ====
    if (contactId) {
      try {
        const contact = await this.contactRepository.findOne({
          where: { id: contactId, organizationId: groupID },
        });
        const addressEntity = contact?.adrId;
        identPat = contact?.lastname + ' ' + contact?.firstname;
        const address = await this.addressRepository.findOne({
          where: { id: addressEntity || 0 },
        });
        if (address) {
          identPat +=
            '\n' +
            address?.street +
            '\n' +
            address?.zipCode +
            ' ' +
            address?.city;
        }
        let personInsee = contact?.insee;
        let personInseeKey = contact?.inseeKey;
        if (personInsee || personInseeKey) {
          personInsee = personInsee.replace(/\s/g, '');
          personInseeKey = personInseeKey.replace(
            /^(\w{1})(\w{2})(\w{2})(\w{2})(\w{3})(\w{3})$/i,
            '$1 $2 $3 $4 $5 $6',
          );
          identPat += '\n\n' + [personInsee, personInseeKey].join(' ');
        }
        return this.newFacture({
          id_facture,
          id_user,
          id_societe,
          contactId,
          id_devis,
          dateFacture,
          titreFacture,
          identPrat,
          adressePrat,
          identPat,
          infosCompl,
          modePaiement,
        });
      } catch (err) {
        throw new CBadRequestException(err);
      }
    }
  }

  async newFacture({
    // id_facture,
    id_user,
    // id_societe,
    contactId,
    id_devis,
    dateFacture,
    titreFacture,
    identPrat,
    adressePrat,
    identPat,
    infosCompl,
    modePaiement,
  }: {
    id_facture: number;
    id_user: number;
    id_societe: number;
    contactId: number;
    id_devis: number;
    dateFacture: string;
    titreFacture: string;
    identPrat: string;
    adressePrat: string;
    identPat: string;
    infosCompl: string;
    modePaiement: string;
  }) {
    let noFacture: string;
    const currentDate = new Date();
    const formattedDate =
      currentDate.getFullYear().toString() + getDayOfYear(currentDate);

    try {
      const stm = await this.billRepository.findOne({
        where: {
          usrId: id_user,
          nbr: Like(`u${id_user}-${formattedDate}%`),
        },
        order: { nbr: 'DESC' },
      });
      noFacture = stm?.nbr;
      if (!noFacture) {
        noFacture = 'u' + id_user + '-' + formattedDate + '-00001';
      } else {
        noFacture =
          'u' +
          id_user +
          '-' +
          formattedDate +
          '-' +
          String(
            Number(noFacture.substring(noFacture.lastIndexOf('-') + 1)) + 1,
          ).padStart(5, '0');
      }
      const bill = await this.billRepository.save({
        nbr: noFacture,
        date: dateFacture,
        identPrat: identPrat,
        addrPrat: adressePrat,
        name: titreFacture,
        identContact: identPat,
        payment: modePaiement,
        info: infosCompl,
        usrId: id_user,
        conId: contactId,
        dqoId: id_devis !== 0 ? id_devis : null,
      } as BillEntity);
      return bill;
    } catch (err) {
      throw new CBadRequestException(
        '-1002 : Probl&egrave;me durant la création de la facture. Merci de réessayer plus tard.',
      );
    }
  }

  async initFacture(id: number): Promise<InitFactureRes> {
    id = checkId(id);
    try {
      const bill = await this.billRepository.findOne({
        where: { id: id || 0, delete: 0 },
        relations: ['user', 'patient'],
      });

      if (bill) {
        const res: InitFactureRes = {
          noFacture: bill?.nbr || '',
          dateFacture: checkDay(bill?.date),
          titreFacture: bill?.name || '',
          identPrat: bill?.identPrat || '',
          adressePrat: bill?.addrPrat || '',
          identPat: bill?.identContact || '',
          modePaiement: bill?.payment || 'Non Payee',
          infosCompl: bill?.info || '',
          billSignatureDoctor: bill?.signature_doctor || '',
          billAmount: bill?.amount || 0,
          billSecuAmount: bill?.secuAmount || 0,
          billTemplate: bill?.template || 1,
          userNumeroFacturant: bill?.user?.numeroFacturant || '',
          contactFullname:
            bill?.patient?.lastname ||
            '' + ' ' + bill?.patient?.firstname ||
            '',
          contactBirthday: checkDay(bill?.patient?.birthday),
          contactInsee:
            (bill?.patient?.insee || '') +
            ' ' +
            (bill?.patient?.inseeKey || ''),
          details: [],
        };

        const billLines = await this.billLineRepository.find({
          where: { bilId: id || 0 },
          order: { pos: 'ASC' },
        });

        for (const billLine of billLines) {
          const dentail: DetailsRes = {
            id_facture_line: billLine?.bilId,
            typeLigne: billLine?.type,
            dateLigne: billLine?.date || '',
            dentsLigne: billLine?.teeth || '',
            descriptionLigne: billLine?.msg,
            prixLigne: billLine?.amount || 0,
            name: billLine?.msg?.replace(/^[^-]*-\s?/, ''),
            cotation: billLine?.cotation,
            secuAmount: billLine?.secuAmount,
            materials: billLine?.materials,
          };
          res?.details?.push(dentail);
        }
        return res;
      } else {
        throw new CBadRequestException(
          '-3003 : Problème durant le rapatriement des informations de la facture ...',
        );
      }
    } catch (e) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
  }

  // dental/facture/facture_pdf.php
  async generatePdf(req: PrintPDFDto, identity: UserIdentity) {
    try {
      const id = checkId(req?.id);
      const duplicata = Boolean(req?.duplicate);
      const invoice = await this.billRepository.findOne({
        where: { id: id || 0 },
        relations: {
          user: true,
        },
      });
      const disableColumnByGroup = [158, 181];
      if (checkId) {
        await this.billRepository.update(id, { lock: 1 } as BillEntity);
      }
      const facture = await this.initFacture(id);

      if (facture.billTemplate === 2) {
        const checkModePaiement =
          ['virement', 'prelevement', 'autre']?.findIndex(
            (e) => e === facture?.modePaiement,
          ) != -1;
        function generateData(details: DetailsRes[]) {
          return {
            duplicata,
            date: checkDay(facture?.dateFacture, 'DD/MM/YYYY'),
            nbr: facture?.noFacture,
            identPrat: nl2br(facture?.identPrat),
            adressePrat: nl2br(facture?.adressePrat),
            identPat: facture?.identPat,
            billAmount: facture?.billAmount,
            billSecuAmount: facture?.billSecuAmount,
            userNumeroFacturant: facture?.userNumeroFacturant,
            contactFullname: facture?.contactFullname,
            contactBirthday: facture?.contactBirthday,
            contactInsee: facture.contactInsee,
            prestations: details,
            modePaiement: facture.modePaiement,
            signature: facture.billSignatureDoctor,
            checkModePaiement,
          };
        }

        const filePath = path.join(
          process.cwd(),
          'templates/pdf/invoice',
          'convention.hbs',
        );
        const options = {
          format: 'A4',
          displayHeaderFooter: true,
          footerTemplate: facturePdfFooter1(),
          margin: {
            left: '5mm',
            top: '5mm',
            right: '5mm',
            bottom: '5mm',
          },
        };
        let files: PdfTemplateFile[] = [];
        facture.details = facture?.details?.filter(
          (e) => e.typeLigne === 'operation',
        );
        const pageCount = Math.ceil(facture?.details?.length / 9);
        if (!pageCount) {
          files = [{ path: filePath, data: generateData(facture?.details) }];
        } else {
          for (let i = 0; i < pageCount; i++) {
            files.push({
              data: generateData(facture?.details.splice(0, 9)),
              path: filePath,
            });
          }
        }
        const helpers = {
          formatDate: (date: string) => checkDay(date, 'DD/MM/YYYY'),
        };
        const pdfBuffer = await customCreatePdf({
          files,
          options,
          helpers,
        });
        return pdfBuffer;
      } else {
        const helpers = {
          nl2br: nl2br,
          br2nl: br2nl,
          formatDentsLigne: function formatDentsLigne(
            dentsLigne: string | number,
          ) {
            if (typeof dentsLigne !== 'string') {
              return '';
            }
            const dentsLigneSplit = dentsLigne.split(/[^0-9]+/);
            const dentsLigneChunk = [];
            for (let i = 0; i < dentsLigneSplit.length; i += 3) {
              dentsLigneChunk.push(dentsLigneSplit.slice(i, i + 3).join(','));
            }
            return dentsLigneChunk.join('\n');
          },
          formatNumber: (n: number) => {
            return Number(n).toFixed(2);
          },
          formatDate: (date: string) => checkDay(date, 'DD/MM/YYYY'),
        };

        const filePath = path.join(
          process.cwd(),
          'templates/pdf/invoice',
          'conventionDuplicate.hbs',
        );
        const detailsAmount = facture?.details
          ? facture?.details.reduce(
              (accumulator, item) =>
                accumulator + checkNumber(item?.secuAmount),
              0,
            )
          : 0;
        const detailsPrixLigne = facture?.details
          ? facture?.details.reduce(
              (prixLigne, item) => prixLigne + checkNumber(item?.prixLigne),
              0,
            )
          : 0;
        facture.modePaiement;

        function generateData(details: DetailsRes[]) {
          return {
            isGroup: disableColumnByGroup.some((e) => e === identity.org),
            duplicata,
            date: checkDay(facture?.dateFacture, 'DD/MM/YYYY'),
            nbr: facture?.noFacture,
            identPrat: nl2br(facture?.identPrat),
            adressePrat: nl2br(facture?.adressePrat),
            identPat: facture?.identPat,
            contactInsee: facture?.contactInsee,
            details: details,
            infosCompl: facture?.infosCompl,
            detailsLength: facture.details?.length - 1,
            detailsAmount: detailsAmount.toFixed(2),
            detailsPrixLigne: detailsPrixLigne.toFixed(2),
            billSignatureDoctor: facture.billSignatureDoctor,
            modePaiement: facture.modePaiement,
          };
        }

        const options = {
          format: 'A4',
          displayHeaderFooter: true,
          footerTemplate: facturePdfFooter(Boolean(invoice.user.agaMember)),
          margin: {
            left: '5mm',
            top: '5mm',
            right: '5mm',
            bottom: '10mm',
          },
        };
        let files: PdfTemplateFile[] = [];
        const pageCount = Math.ceil(facture?.details?.length / 9);
        if (!pageCount) {
          files = [{ path: filePath, data: generateData(facture?.details) }];
        } else {
          for (let i = 0; i < pageCount; i++) {
            files.push({
              data: generateData(facture?.details.splice(0, 9)),
              path: filePath,
            });
          }
        }

        const pdfBuffer = await customCreatePdf({
          files,
          options,
          helpers,
        });
        return pdfBuffer;
      }
    } catch (error) {
      throw new CBadRequestException(ErrorCode.ERROR_GET_PDF);
    }
  }

  async factureEmail({ id_facture }: FactureEmailDto, identity: UserIdentity) {
    id_facture = checkId(id_facture);
    try {
      const qb = this.dataSource
        .getRepository(BillEntity)
        .createQueryBuilder('bill');
      const result = await qb
        .select('bill.date', 'billDate')
        .addSelect('usr.email', 'userEmail')
        .addSelect('usr.lastname', 'userLastname')
        .addSelect('usr.firstname', 'userFirstname')
        .addSelect('con.id', 'contactId')
        .addSelect('con.email', 'contactEmail')
        .addSelect('con.lastname', 'contactLastname')
        .addSelect('con.firstname', 'contactFirstname')
        .innerJoin('bill.user', 'usr')
        .innerJoin('bill.contact', 'con')
        .where('bill.id = :id', { id: id_facture })
        .getRawOne();

      const billDate = result?.billDate;
      const billDateAsString = format(billDate, 'dd/MM/yyyy');
      const userEmail = result?.userEmail;
      const userLastname = result?.userLastname;
      const userFirstname = result?.userFirstname;
      const contactId = result?.contactId;
      const contactEmail = result?.contactEmail;

      if (!validateEmail(userEmail) || !validateEmail(contactEmail)) {
        throw {
          message:
            'Veuillez renseigner une adresse email valide dans la fiche patient',
        };
      }

      const filename = `Facture_${format(
        new Date(billDate),
        'dd_MM_yyyy',
      )}.pdf`;
      const invoice = await this.billRepository.findOne({
        relations: ['user', 'user.address', 'user.setting', 'patient'],
        where: { id: id_facture || 0 },
      });
      const homePhoneNumber = invoice?.user?.phoneNumber ?? null;
      const tempFolder = this.configService.get<string>(
        'app.mail.folderTemplate',
      );
      const emailTemplate = fs.readFileSync(
        path.join(tempFolder, 'mail/facture/invoice.hbs'),
        'utf-8',
      );
      handlebars.registerHelper({
        isset: (v1: any) => {
          if (Number(v1)) return true;
          return v1 ? true : false;
        },
      });
      const template = handlebars.compile(emailTemplate);

      const fullName = [invoice?.user?.lastname, invoice?.user?.firstname].join(
        ' ',
      );
      const date = dayjs(invoice?.date)
        .locale(DEFAULT_LOCALE)
        .format('DD MMM YYYY');
      const mailBody = template({
        fullName,
        invoice,
        homePhoneNumber,
        date,
      });

      await this.mailTransportService.sendEmail(identity.id, {
        from: invoice?.user?.email,
        to: invoice?.patient?.email,
        subject: `Facture du ${date} de Dr ${[
          invoice?.user?.lastname,
          invoice?.user?.firstname,
        ].join(' ')} pour ${[
          invoice?.patient?.lastname,
          invoice?.patient?.firstname,
        ].join(' ')}`,
        html: mailBody,
        // context: {
        //   ...invoice,
        //   creationDate: format(new Date(invoice?.date), 'MMMM dd, yyyy'),
        //   homePhoneNumber: `(${homePhoneNumber.slice(
        //     0,
        //     2,
        //   )}) ${homePhoneNumber.slice(2, 4)} ${homePhoneNumber.slice(
        //     4,
        //     6,
        //   )} ${homePhoneNumber.slice(6, 8)} ${homePhoneNumber.slice(8)}`,
        // },
        attachments: [
          {
            filename: filename,
            content: await this.generatePdf({ id: id_facture }, identity),
          },
        ],
      });
      await this.contactNoteRepository.save({
        conId: contactId,
        message: `Envoi par email de la facture du ${billDateAsString} de ${userLastname} ${userFirstname}`,
      });
      return { message: true };
    } catch (err) {
      throw new CBadRequestException(err?.message);
    }
  }

  /**
   * ecoophp/application/Service/CcamFamilyService.php
   * Retourne si la variable donnée est un code de regroupement de prothèse.
   *
   * @param string $family code de regroupement ccam
   * @return bool
   */
  isProsthesis(family: string): boolean {
    /**
     * @var array liste des codes de regroupement de prothèses
     */
    const PROSTHESIS_FAMILIES = [
      'BR1',
      'CM0',
      'CT0',
      'CT1',
      'CZ0',
      'CZ1',
      'IC0',
      'IC1',
      'ICO',
      'IMP',
      'IN1',
      'INO',
      'PA0',
      'PA1',
      'PAM',
      'PAR',
      'PDT',
      'PF0',
      'PF1',
      'PFC',
      'PFM',
      'PT0',
      'RA0',
      'RE1',
      'RF0',
      'RPN',
      'RS0',
      'SU0',
      'SU1',
    ];
    return PROSTHESIS_FAMILIES.includes(family);
  }
}
