import { Injectable } from '@nestjs/common';
import { DataSource, In, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EnregistrerFactureDto,
  FactureEmailDto,
  PrintPDFDto,
} from '../dto/facture.dto';
import { BillEntity } from 'src/entities/bill.entity';
import { BillLineEntity } from 'src/entities/bill-line.entity';
import { MedicalHeaderEntity } from 'src/entities/medical-header.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
import { EventEntity } from 'src/entities/event.entity';
import { NgapKeyEntity } from 'src/entities/ngapKey.entity';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import {
  EnumPrivilegeTypeType,
  PrivilegeEntity,
} from 'src/entities/privilege.entity';
import { UserEntity } from 'src/entities/user.entity';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { StringHelper } from 'src/common/util/string-helper';
import { ContactEntity } from 'src/entities/contact.entity';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { AddressEntity } from 'src/entities/address.entity';
import { createPdf } from '@saemhco/nestjs-html-pdf';
import * as path from 'path';
import { checkDay } from 'src/common/util/day';
import { checkId } from 'src/common/util/number';
import { DetailsRes, InitFactureRes } from '../res/facture.res';
import { customCreatePdf } from 'src/common/util/pdf';
import { facturePdfFooter } from '../constant/htmlTemplate';
import { br2nl } from 'src/common/util/string';
import { validateEmail } from 'src/common/util/string';
import { MailService } from 'src/mail/services/mail.service';
import { format } from 'date-fns';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';

@Injectable()
export class FactureServices {
  constructor(
    private mailService: MailService,
    @InjectRepository(BillEntity)
    private billRepository: Repository<BillEntity>,
    @InjectRepository(BillLineEntity)
    private billLineRepository: Repository<BillLineEntity>,
    @InjectRepository(MedicalHeaderEntity)
    private medicalHeaderRepository: Repository<MedicalHeaderEntity>,
    @InjectRepository(EventTaskEntity)
    private eventTaskRepository: Repository<EventTaskEntity>,
    @InjectRepository(DentalEventTaskEntity)
    private dentalEventTaskRepository: Repository<DentalEventTaskEntity>, //dental
    @InjectRepository(EventEntity)
    private eventRepository: Repository<EventEntity>, //event
    @InjectRepository(NgapKeyEntity)
    private ngapKeyRepository: Repository<NgapKeyEntity>, //ngap_key
    @InjectRepository(PrivilegeEntity)
    private privilegeRepository: Repository<PrivilegeEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserPreferenceEntity)
    private userPreferenceRepository: Repository<UserPreferenceEntity>,
    @InjectRepository(ContactEntity)
    private contactRepository: Repository<ContactEntity>,
    @InjectRepository(DentalQuotationEntity)
    private dentalQuotationRepository: Repository<DentalQuotationEntity>,
    @InjectRepository(AddressEntity)
    private addressRepository: Repository<AddressEntity>,
    @InjectRepository(ContactNoteEntity)
    private contactNoteRepository: Repository<ContactNoteEntity>,
    private dataSource: DataSource,
  ) {}
  async update(payload: EnregistrerFactureDto) {
    switch (payload.operation) {
      case 'enregistrer': {
        try {
          const idBill = await this.billRepository.findOne({
            where: { id: payload?.id_facture },
          });
          if (idBill) {
            await this.billRepository.save({
              id: payload?.id_facture,
              date: payload?.dateFacture,
              name: payload?.titreFacture,
              identPrat: payload?.identPrat,
              identPat: payload?.identPat,
              modePaiement: payload?.modePaiement,
              infosCompl: payload?.infosCompl,
              amount: payload?.amount,
              secuAmount: payload?.secuAmount,
              signatureDoctor: payload?.signatureDoctor,
              template: payload?.template,
            });
            return 'Facture enregistrée correctement';
          } else {
            return 'Bill does not exist';
          }
        } catch {
          return 'Erreur -3 : Problème durant la sauvegarde de la facture ... ';
        }
      }

      case 'supprimerLigne': {
        try {
          const billlines = await this.billLineRepository.find({
            where: { id: payload?.id_facture_ligne },
          });
          if (billlines) {
            return await this.billLineRepository.delete(
              payload?.id_facture_ligne,
            );
          }
        } catch {
          return "Erreur -5 : Problème durant la suppression d'une ligne de la facture ... ";
        }
      }

      case 'enregistrerEnteteParDefaut': {
        try {
          const medicalHeader = await this.medicalHeaderRepository.findOne({
            where: { userId: payload?.user_id },
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
              where: { id: payload?.id_facture_ligne },
            });
            if (!billLine) {
              const dataBillLine = this.billLineRepository.create({
                amount: payload?.prixLigne,
                teeth: payload?.dentsLigne,
                cotation: payload?.cotation,
                secuAmount: payload?.secuAmount,
                materials: payload?.materials,
                bilId: payload?.id_facture,
                date: payload?.dateLigne,
                msg: payload?.descriptionLigne,
                pos: payload?.noSequence,
                type: payload?.typeLigne,
              });
              const data = await this.billLineRepository.save(dataBillLine);
              return data.id;
            }
            await this.billLineRepository.update(payload?.id_facture_ligne, {
              amount: payload?.prixLigne,
              teeth: payload?.dentsLigne,
              cotation: payload?.cotation,
              secuAmount: payload?.secuAmount,
              materials: payload?.materials,
              bilId: payload?.id_facture,
              date: payload?.dateLigne,
              msg: payload?.descriptionLigne,
              pos: payload?.noSequence,
              type: payload?.typeLigne,
            });
            return payload?.id_facture_ligne;
          } else {
            const billLine = await this.billLineRepository.findOne({
              where: { id: payload?.id_facture },
            });
            if (!billLine) {
              const billLineData = this.billLineRepository.create({
                bilId: payload?.id_facture_ligne,
                pos: payload?.noSequence,
                type: payload?.typeLigne,
              });
              const data = await this.billLineRepository.save(billLineData);
              return data.id;
            }
            await this.billLineRepository.update(payload?.id_facture_ligne, {
              bilId: payload?.id_facture_ligne,
              pos: payload?.noSequence,
              type: payload?.typeLigne,
            });
            return payload?.id_facture_ligne;
          }
        } catch {
          throw new CBadRequestException(ErrorCode.STATUS_NOT_FOUND);
        }
      }

      case 'seances':
        {
          if (payload?.displayOnlyActsRealized === 'on') {
            const dataEventTasks = await this.eventTaskRepository.find({
              where: {
                usrId: payload?.user_id,
                conId: payload?.patient_id,
                status: 0,
                amountSaved: null,
              },
              relations: ['event', 'dental'],
            });
            const dataFilDate = dataEventTasks?.filter((dataEventTask) => {
              return (
                new Date(dataEventTask?.date)?.getTime() >=
                  new Date(payload?.dateDeb).getTime() &&
                new Date(dataEventTask?.date)?.getTime() <=
                  new Date(payload?.dateFin).getTime()
              );
            });
            const ngap_keys = await this.ngapKeyRepository.find();
            const res: { date: string; data: any[] }[] = [];
            for (const data of dataFilDate) {
              const current_ngap_key = ngap_keys?.find((key) => {
                return key?.id === data?.dental?.ngapKeyId;
              });
              const exist = res.find((r) => r.date === data.date);
              const newData = {
                date: data?.date,
                name: data?.name,
                amount: data?.amount,
                ccamFamily: data?.ccamFamily,
                teeth: data?.dental?.teeth,
                secuAmount: data?.dental?.secuAmount,
                exceeding: data?.dental?.exceeding,
                type: data?.dental?.type,
                ccamCode: data?.dental?.ccamCode,
                coef: data?.dental?.coef,
                ngapKeyName: current_ngap_key?.name,
              };
              if (exist) {
                exist.data.push(newData);
              } else {
                res.push({
                  date: data.date,
                  data: [newData],
                });
              }
            }
            return res;
          }
          if (payload?.displayOnlyActsListed) {
            const dataEventTasks = await this.eventTaskRepository.find({
              where: {
                usrId: payload?.user_id,
                conId: payload?.patient_id,
                amountSaved: null,
              },
              relations: ['event', 'dental'],
            });
            const dataFilDate = dataEventTasks?.filter((dataEventTask) => {
              return (
                new Date(dataEventTask?.date)?.getTime() >=
                  new Date(payload?.dateDeb).getTime() &&
                new Date(dataEventTask?.date)?.getTime() <=
                  new Date(payload?.dateFin).getTime()
              );
            });
            const ngap_keys = await this.ngapKeyRepository.find();
            const res: { date: string; data: any[] }[] = [];
            for (const data of dataFilDate) {
              const current_ngap_key = ngap_keys?.find((key) => {
                return key?.id === data?.dental?.ngapKeyId;
              });
              const exist = res.find((r) => r.date === data.date);
              const newData = {
                date: data?.date,
                name: data?.name,
                amount: data?.amount,
                ccamFamily: data?.ccamFamily,
                teeth: data?.dental?.teeth,
                secuAmount: data?.dental?.secuAmount,
                exceeding: data?.dental?.exceeding,
                type: data?.dental?.type,
                ccamCode: data?.dental?.ccamCode,
                coef: data?.dental?.coef,
                ngapKeyName: current_ngap_key?.name,
              };
              if (exist) {
                exist.data.push(newData);
              } else {
                res.push({
                  date: data.date,
                  data: [newData],
                });
              }
            }
            return res;
          }

          if (payload?.displayOnlyProsthesis) {
            const dataEventTasks = await this.eventTaskRepository.find({
              where: {
                usrId: payload?.user_id,
                conId: payload?.patient_id,
                amountSaved: null,
              },
              relations: ['event', 'dental'],
            });
            const dataFilDate = dataEventTasks?.filter((dataEventTask) => {
              return (
                new Date(dataEventTask?.date)?.getTime() >=
                  new Date(payload?.dateDeb).getTime() &&
                new Date(dataEventTask?.date)?.getTime() <=
                  new Date(payload?.dateFin).getTime()
              );
            });
            // const ngap_keys = await this.ngapKeyRepository.find();
            return dataFilDate?.map((data) => {
              // const current_ngap_key = ngap_keys?.find((key) => {
              //   return key?.id === data?.dental?.ngapKeyId;
              // });
              return {
                ccamFamily: data?.ccamFamily,
              };
            });
          }
        }
        break;
    }
  }

  async getInitChamps(
    userId: number[],
    contactId: number,
    identity: UserIdentity,
  ) {
    const withs = userId;
    const userID = identity?.id as number;
    const groupID = identity?.org;
    // const disableColumnByGroup = [158, 181];
    // const colonneDate = true;
    let userIds: number[];

    const id_facture = 0;
    const id_societe = 0;
    const id_user = userID;
    // const medical_entete_id = 0;
    const id_devis = 0;
    const id_contact = 0;
    const dateFacture = new Date().toISOString().split('T')[0];
    // const noFacture: string;
    // const details: string[];
    const infosCompl = '';
    const modePaiement = 'Non Payee';

    // let billSignatureDoctor = '';
    // let billAmount = 0;
    // let billSecuAmount = 0;
    // let billTemplate = 1;
    // let contactFullname = '';
    // let contactBirthday = '';
    // let contactInsee = '';

    if (withs !== null) {
      const type = EnumPrivilegeTypeType.NONE;
      const privilege = await this.privilegeRepository.find({
        where: {
          usrId: userID,
          usrWithId: In(withs),
          type: Not(type),
        },
      });
      if (privilege === null) {
        console.error(
          "Vous n'avez pas assez de privilège pour accéder aux factures",
        );
      } else {
        userIds = withs;
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

    const userSignature = user?.signature;
    const userPreferenceEntity = await this.userPreferenceRepository.findOne({
      where: { usrId: userID },
    });
    const userPreferenceBillDisplayTooltip =
      userPreferenceEntity?.billDisplayTooltip;
    const userPreferenceBillTemplate = userPreferenceEntity?.billTemplate;
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
      const medicalEnteteId = medicalHeader?.id;
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
        identPat = contact?.lastname + '' + contact?.firstname;
        const address = await this.addressRepository.findOne({
          where: { id: addressEntity },
        });
        if (address) {
          identPat =
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
          id_contact,
          id_devis,
          dateFacture,
          titreFacture,
          identPrat,
          adressePrat,
          identPat,
          infosCompl,
          modePaiement,
        });
      } catch {}
    }
  }

  async newFacture({
    id_facture,
    id_user,
    id_societe,
    id_contact,
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
    id_contact: number;
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
    const dateFormat = '%Y%j';
    const currentDate = new Date();
    const formattedDate =
      currentDate.getFullYear().toString() +
      (currentDate.getMonth() + 1).toString().padStart(2, '0') +
      currentDate.getDate().toString().padStart(2, '0');

    try {
      const stm = await this.dataSource.query(
        `
      SELECT
      MAX(T_BILL_BIL.BIL_NBR) AS noFacture
      FROM T_BILL_BIL
      WHERE T_BILL_BIL.USR_ID = ?
      AND T_BILL_BIL.BIL_NBR LIKE CONCAT('u', ?, '-', DATE_FORMAT(NOW(), ?), '-', '%')`,
        [id_user, id_user, dateFormat],
      );

      noFacture = stm[0].noFacture;
      if (noFacture) {
        noFacture = id_user + '-' + formattedDate + '-00005';
      } else {
        noFacture =
          'u' +
          id_user +
          '-' +
          new Date().toISOString().slice(0, 10).replace(/-/g, '') +
          '-' +
          String(
            Number(noFacture.substring(noFacture.lastIndexOf('-') + 1)) + 1,
          ).padStart(5, '0');
      }

      const bill = await this.billRepository.save({
        nbr: noFacture,
        creationDate: dateFacture,
        identPrat: identPrat,
        adressePrat: adressePrat,
        name: titreFacture,
        identContact: identPat,
        payload: modePaiement,
        infosCompl: infosCompl,
        id_user: id_user,
        conId: id_contact,
        id_devis: id_devis,
      });
      return bill;
    } catch (err) {
      console.error(
        '-1002 : Probl&egrave;me durant la création de la facture. Merci de réessayer plus tard.',
      );
    }
  }

  async initFacture(id: number): Promise<InitFactureRes> {
    id = checkId(id);
    try {
      const bill = await this.billRepository.findOne({
        where: { id, delete: 0 },
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
            bill?.contact?.lastname + ' ' + bill?.contact?.firstname,
          contactBirthday: checkDay(bill?.contact?.birthday),
          contactInsee: bill?.contact?.insee + '' + bill?.contact?.inseeKey,
        };

        // if (!pdf && bill.lock) {
        //   window.location.href = 'facture_pdf.php?id_facture=' + id_facture;
        //   return;
        // }
        const billLines = await this.billLineRepository.find({
          where: { id },
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
            name: billLine?.msg.replace(/^[^-]*-\s?/, ''),
            cotation: billLine?.cotation,
            secuAmount: billLine?.secuAmount,
            materials: billLine?.materials,
          };
          res.details.push(dentail);
        }
        return res;
      } else {
        throw new CBadRequestException(
          '-3003 : Problème durant le rapatriement des informations de la facture ...',
        );
      }
    } catch {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
  }

  // dental/facture/facture_pdf.php
  async generatePdf(req: PrintPDFDto, identity: UserIdentity) {
    try {
      const id = checkId(req?.id);
      const duplicata = Boolean(req?.duplicate);
      const invoice = await this.billRepository.findOne({
        where: { id },
        relations: {
          user: true,
        },
      });
      const disableColumnByGroup = [158, 181];
      const modesPaiements = {
        non_payee: 'Non Payée',
        carte: 'Carte',
        espece: 'Espèce',
        cheque: 'Chèque',
        virement: 'Virement',
        prelevement: 'Prélèvement',
        autre: 'Autre',
      };
      if (checkId) {
        await this.billRepository.update(id, { lock: 1 } as BillEntity);
      }

      const facture = await this.initFacture(id);
      if (facture.billTemplate === 1) {
        const checkModePaiement =
          ['virement', 'prelevement', 'autre']?.findIndex(
            (e) => e === facture?.modePaiement,
          ) != -1;
        const data = {
          duplicata,
          date: facture?.dateFacture,
          nbr: facture?.noFacture,
          identPrat: facture?.identPrat,
          adressePrat: facture?.adressePrat,
          identPat: facture?.identPat,
          billAmount: facture?.billAmount,
          billSecuAmount: facture?.billSecuAmount,
          userNumeroFacturant: facture?.userNumeroFacturant,
          contactFullname: facture?.contactFullname,
          contactBirthday: facture?.contactBirthday,
          contactInsee: facture?.contactInsee,
          prestations: facture.details,
          modePaiement: facture.modePaiement,
          signature: facture.billSignatureDoctor,
          checkModePaiement,
        };
        const filePath = path.join(
          process.cwd(),
          'templates/invoice',
          'convention.hbs',
        );
        const options = {
          format: 'A4',
          displayHeaderFooter: true,
          margin: {
            left: '5mm',
            top: '5mm',
            right: '5mm',
            bottom: '5mm',
          },
        };
        const pdf = await createPdf(filePath, options, data);
        return pdf;
      } else {
        const helpers = {
          toUpperCase: function (str: string) {
            return str.toUpperCase();
          },
          nl2br: br2nl,
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
          formatNumber: (n: number) => n.toFixed(2),
        };

        const filePath = path.join(
          process.cwd(),
          'templates/invoice',
          'conventionDuplicate.hbs',
        );
        const detailsAmount = facture?.details
          ? facture?.details.reduce(
              (accumulator, item) => accumulator + item?.secuAmount,
              0,
            )
          : 0;
        const detailsPrixLigne = facture?.details
          ? facture?.details.reduce(
              (prixLigne, item) => prixLigne + item?.prixLigne,
              0,
            )
          : 0;
        const data = {
          isGroup: disableColumnByGroup.some((e) => e === identity.org),
          duplicata,
          date: facture?.dateFacture,
          nbr: facture?.noFacture,
          identPrat: facture?.identPrat,
          adressePrat: facture?.adressePrat,
          identPat: facture?.identPat,
          contactInsee: facture?.contactInsee,
          details: facture?.details,
          infosCompl: facture?.infosCompl,
          detailsLength: facture.details?.length - 1,
          detailsAmount: detailsAmount.toFixed(2),
          detailsPrixLigne: detailsPrixLigne.toFixed(2),
          billSignatureDoctor: facture.billSignatureDoctor,
          modesPaiements,
        };
        const options = {
          format: 'A4',
          displayHeaderFooter: true,
          footerTemplate: facturePdfFooter(Boolean(invoice.user.agaMember)),
          margin: {
            left: '5mm',
            top: '5mm',
            right: '5mm',
            bottom: '5mm',
          },
        };
        const pdfBuffer = await customCreatePdf(
          filePath,
          options,
          data,
          helpers,
        );
        return pdfBuffer;
      }
    } catch (error) {
      throw new CBadRequestException(ErrorCode.ERROR_GET_PDF);
    }
  }

  async factureEmail({ id_facture }: FactureEmailDto, identity: UserIdentity) {
    try {
      const qb = this.dataSource
        .getRepository(BillEntity)
        .createQueryBuilder('bill');
      const result = await qb
        .select('bill.date', 'billDate')
        .addSelect('usr.email', 'userEmail')
        .addSelect('usr.lastnamne', 'userLastname')
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
        throw new CBadRequestException(
          'Veuillez renseigner une adresse email valide dans la fiche patient',
        );
      }

      const filename = `Facture_${format(
        new Date(billDate),
        'dd_MM_yyyy',
      )}.pdf`;
      const invoice = await this.billRepository.findOneOrFail({
        relations: ['user', 'user.address', 'user.setting', 'patient'],
        where: { id: id_facture },
      });

      const homePhoneNumber = invoice?.user?.phoneNumber ?? null;
      await this.mailService.sendFactureEmail({
        from: invoice?.user?.email,
        to: invoice?.patient?.email,
        subject: `Facture du ${format(
          new Date(invoice?.date),
          'dd/MM/yyyy',
        )} de Dr ${[invoice?.user?.lastname, invoice?.user?.firstname].join(
          ' ',
        )} pour ${[
          invoice?.patient?.lastname,
          invoice?.patient?.firstname,
        ].join(' ')}`,
        template: 'mail/facture/invoice.hbs',
        context: {
          ...invoice,
          creationDate: format(new Date(invoice?.date), 'MMMM dd, yyyy'),
          homePhoneNumber: `(${homePhoneNumber.slice(
            0,
            2,
          )}) ${homePhoneNumber.slice(2, 4)} ${homePhoneNumber.slice(
            4,
            6,
          )} ${homePhoneNumber.slice(6, 8)} ${homePhoneNumber.slice(8)}`,
        },
        attachments: [
          {
            filename: filename,
            context: null,
          },
        ],
      });

      await this.contactNoteRepository.save({
        conId: contactId,
        message: `Envoi par email de la facture du ${billDateAsString} de ${userLastname} ${userFirstname}`,
      });
      return { message: true };
    } catch (err) {
      throw new CBadRequestException(`${err?.message}`);
    }
  }
}
