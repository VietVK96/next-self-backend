import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';
import { FseEntity } from 'src/entities/fse.entity';
import { TeletransmissionEntity } from 'src/entities/teletransmission.entity';
import { Repository } from 'typeorm';
import { IFileRecevoirDetailListeRsp } from 'src/caresheets/interface/caresheet.interface';
import { NoemieEntity } from 'src/entities/noemie.entity';
import { NoemioCaresheetEntity } from 'src/entities/noemie-caresheet.entity';
import {
  CashingEntity,
  EnumCashingPayment,
  EnumCashingType,
} from 'src/entities/cashing.entity';
import { LibraryBankEntity } from 'src/entities/library-bank.entity';
import { CaresheetRejectionEntity } from 'src/entities/caresheet-rejection.entity';
import {
  EnumThirdPartyStatus,
  ThirdPartyAmcEntity,
} from 'src/entities/third-party-amc.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { CashingContactEntity } from 'src/entities/cashing-contact.entity';
import { SesamvitaleTeletranmistionService } from 'src/caresheets/service/sesamvitale-teletranmistion.service';

@Injectable()
export class NomieService {
  private logger: Logger = new Logger(NomieService.name);
  private contentOfFiles: Record<string, string>;
  constructor(
    @InjectRepository(TeletransmissionEntity)
    @InjectRepository(FseEntity)
    private fseRepo: Repository<FseEntity>,
    @InjectRepository(NoemieEntity)
    private noemieRepo: Repository<NoemieEntity>,
    @InjectRepository(NoemioCaresheetEntity)
    private noemieCaresheetRepo: Repository<NoemioCaresheetEntity>,
    @InjectRepository(CashingEntity)
    private cashingRepo: Repository<CashingEntity>,
    @InjectRepository(LibraryBankEntity)
    private libraryBankRepo: Repository<LibraryBankEntity>,
    @InjectRepository(CaresheetRejectionEntity)
    private caresheetRejectionRepo: Repository<CaresheetRejectionEntity>,
    @InjectRepository(ThirdPartyAmoEntity)
    private thirdPartyAmoRepo: Repository<ThirdPartyAmoEntity>,
    @InjectRepository(ThirdPartyAmcEntity)
    private thirdPartyAmcRepo: Repository<ThirdPartyAmcEntity>,
    @InjectRepository(CashingContactEntity)
    private cashingContactRepo: Repository<CashingContactEntity>,
    private sesamvitaleTeletranmistionService: SesamvitaleTeletranmistionService,
  ) {
    this.contentOfFiles = {};
  }
  async process(organizationId: number, finessNumber: string) {
    const files: any =
      await this.sesamvitaleTeletranmistionService.recevoirDetailListeRsp(
        finessNumber,
      );

    if (files?.fichier && files.fichier.length > 0) {
      for (const fichier of files.fichier) {
        if (fichier?.erreur?.libelleErreur?.[0]) {
          await this.markFileAsDone(fichier);
          continue;
        }
        const isAlreadyProcessed = await this.isAlreadyProcessed(
          finessNumber,
          fichier,
        );
        if (!isAlreadyProcessed) {
          await this.processFile(organizationId, finessNumber, fichier);
        }
        await this.markFileAsDone(fichier);
      }
    }
  }

  async markFileAsDone(file: IFileRecevoirDetailListeRsp) {
    await this.sesamvitaleTeletranmistionService.marquerRsp(file.idtRsp);
  }

  async isAlreadyProcessed(
    finessNumber: string,
    file: IFileRecevoirDetailListeRsp,
  ): Promise<boolean> {
    const idtRsp = parseInt(file?.idtRsp?.[0] ?? '');
    if (isNaN(idtRsp)) {
      return false;
    }
    let noemie = await this.noemieRepo.findOne({
      where: {
        externalReferenceId: idtRsp,
      },
    });
    if (!noemie) {
      const fileContent = await this.getFileContent(finessNumber, file);
      noemie = await this.noemieRepo.findOne({
        where: {
          finessNumber,
          fileContentHash: fileContent,
        },
      });
    }
    return false;
  }

  async getFileContent(
    finessNumber: string,
    file: IFileRecevoirDetailListeRsp,
  ) {
    if (!this.contentOfFiles || Object.keys(this.contentOfFiles).length === 0) {
      const data = await this.sesamvitaleTeletranmistionService.recevoirRsp(
        finessNumber,
      );
      if (data.listeRspNonTraites && data.listeRspNonTraites.length > 0) {
        for (const noemie of data.listeRspNonTraites) {
          if (noemie.rsp && noemie.rsp.length > 0) {
            for (const rsp of noemie.rsp) {
              if (
                rsp.idRsp &&
                rsp.idRsp.length > 0 &&
                rsp.fichier &&
                rsp.fichier.length > 0
              ) {
                this.contentOfFiles[rsp.idRsp[0]] = rsp.fichier[0];
              }
            }
          }
        }
      }
    }
    return this.contentOfFiles?.[file?.idtRsp?.[0]] ?? '';
  }

  async processFile(
    organizationId: number,
    finessNumber: string,
    file: IFileRecevoirDetailListeRsp,
  ) {
    const fileContent = await this.getFileContent(finessNumber, file);
    const noemieSave = this.noemieRepo.create({
      organizationId,
      finessNumber,
      creationDate: this.getCreationDate(fileContent),
      reference: file?.rsp?.nReference?.[0] ?? '',
      fileContent,
      externalReferenceId: parseInt(file?.idtRsp?.[0] ?? ''),
    });
    const noemie = await this.noemieRepo.save(noemieSave);

    if (file?.rsp?.virements && file?.rsp?.virements.length > 0) {
      for (const virement of file.rsp.virements) {
        const userListPayment: Record<number, CashingEntity> = {};

        const label1 = virement?.sVirement1?.[0] ?? '';
        const label2 = virement?.sVirement2?.[0] ?? '';
        let label = `${label1} ${label2}`;
        if (label1 === '' && label2 === '') {
          label = `VIREMENT ${file?.rsp?.sRegime?.[0] ?? ''}`;
        }

        if (virement?.factures && virement?.factures.length > 0) {
          for (const facture of virement?.factures) {
            let dDateComptable = dayjs();
            if (virement?.dDateComptable?.[0]) {
              const dDateCom = dayjs(virement.dDateComptable[0], 'YYYY/MM/DD');
              if (dDateCom.isValid()) {
                dDateComptable = dDateCom;
              }
            }
            const numberFac = facture?.nNoFacture?.[0] ?? '';
            const caresheet = await this.fseRepo.findOne({
              where: {
                numeroFacturation: finessNumber,
                nbr: numberFac,
              },
              relations: {
                thirdPartyAmo: true,
                thirdPartyAmc: true,
              },
            });

            if (!caresheet) {
              continue;
            }

            try {
              await this.noemieCaresheetRepo.save({
                caresheetId: caresheet.id,
                noemieId: noemie.id,
              });
            } catch (e) {
              this.logger.error(e);
            }

            let payment = userListPayment[caresheet.usrId];
            if (!payment) {
              const bank = await this.libraryBankRepo.findOne({
                where: {
                  usrId: caresheet.usrId,
                },
              });

              const paymentSave = this.cashingRepo.create({
                usrId: caresheet.usrId,
                lbkId: bank?.id,
                debtor: label,
                date: dDateComptable.format('YYYY-MM-DD'),
                paymentDate: dDateComptable.format('YYYY-MM-DD'),
                payment: EnumCashingPayment.VIREMENT,
                type: EnumCashingType.SOLDE,
              });
              payment = await this.cashingRepo.save(paymentSave);
              userListPayment[caresheet.usrId] = payment;
            }
            if (facture?.rejets && facture.rejets.length > 0) {
              for (const rejet of facture.rejets) {
                await this.caresheetRejectionRepo.save(
                  this.caresheetRejectionRepo.create({
                    rejectedOn: dDateComptable.format('YYYY-MM-DD'),
                    errorCode: rejet?.sCode?.[0] ?? '',
                    errorText: rejet?.sLibelle?.[0] ?? '',
                    extra: JSON.stringify(rejet),
                    caresheetId: caresheet.id,
                  }),
                );
              }
            }

            const thirdPartyAmo = caresheet.thirdPartyAmo;
            if (thirdPartyAmo) {
              const amoStatus = facture?.partAmo?.sEtatPaiement?.[0];
              const amoAmount = parseFloat(
                facture?.partAmo?.xMttpaye?.[0] ?? '0',
              );
              if (amoStatus === EnumThirdPartyStatus.REJECTED) {
                thirdPartyAmo.status = EnumThirdPartyStatus.REJECTED;
                await this.thirdPartyAmoRepo.update(thirdPartyAmo.id, {
                  status: EnumThirdPartyStatus.REJECTED,
                });
              } else if (
                (!amoStatus || amoStatus === EnumThirdPartyStatus.PAID) &&
                amoAmount &&
                thirdPartyAmo.status !== EnumThirdPartyStatus.PAID
              ) {
                await this.processThirdParty(
                  'amo',
                  thirdPartyAmo,
                  payment,
                  amoAmount,
                );
              }
            }

            const thirdPartyAmc = caresheet.thirdPartyAmc;
            if (thirdPartyAmc) {
              const amcStatus = facture?.partAmc?.sEtatPaiement?.[0];
              const amcAmount = parseFloat(
                facture?.partAmc?.xMttpaye?.[0] ?? '0',
              );
              if (amcStatus === EnumThirdPartyStatus.REJECTED) {
                thirdPartyAmc.status = EnumThirdPartyStatus.REJECTED;
                await this.thirdPartyAmcRepo.update(thirdPartyAmc.id, {
                  status: EnumThirdPartyStatus.REJECTED,
                });
              } else if (
                (!amcStatus || amcStatus === EnumThirdPartyStatus.PAID) &&
                amcAmount &&
                thirdPartyAmc.status !== EnumThirdPartyStatus.PAID
              ) {
                await this.processThirdParty(
                  'amc',
                  thirdPartyAmc,
                  payment,
                  amcAmount,
                );
              }
            }

            // On modifie l'état global du tiers-payant de la feuille de soins.
            //     AMC NIL WTN INK PYD RJT
            // AMO
            // NIL     NIL WTN WTN PYD RJT
            // WTN     WTN WTN WTN WTN RJT
            // INK     WTN WTN WTN WTN RJT
            // PYD     PYD WTN WTN PYD RJT
            // RJT     RJT RJT RJT RJT RJT
            const thirdPartyAmoStatus = thirdPartyAmo?.status;
            const thirdPartyAmcStatus = thirdPartyAmc?.status;
            let tiersPayantStatus = EnumThirdPartyStatus.WAITING;
            if (
              thirdPartyAmoStatus === EnumThirdPartyStatus.REJECTED ||
              thirdPartyAmcStatus === EnumThirdPartyStatus.REJECTED
            ) {
              tiersPayantStatus = EnumThirdPartyStatus.REJECTED;
            } else if (
              (!thirdPartyAmoStatus ||
                thirdPartyAmoStatus === EnumThirdPartyStatus.PAID) &&
              (!thirdPartyAmcStatus ||
                thirdPartyAmcStatus === EnumThirdPartyStatus.PAID)
            ) {
              tiersPayantStatus = EnumThirdPartyStatus.PAID;
            }
            await this.fseRepo.update(caresheet.id, {
              tiersPayantStatus,
            });
          }
          // end for
        }
        // end if
      }
    }
  }

  getCreationDate(fileContent: string) {
    if (fileContent && fileContent !== '') {
      const fileContentBase = new Buffer(fileContent, 'base64');
      const fileContentDe = fileContentBase.toString('utf8');
      if (fileContentDe && fileContentDe !== '') {
        const dateOfFileContent = fileContentDe.substring(55, 61);
        const dateOfFileContentDay = dayjs(dateOfFileContent, 'YYYYMMDD');
        if (dateOfFileContentDay.isValid()) {
          return dateOfFileContentDay.format('YYYY-MM-DD');
        }
      }
    }
    return dayjs().format('YYYY-MM-DD');
  }

  async processThirdParty(
    type: string,
    thirdParty: ThirdPartyAmoEntity | ThirdPartyAmcEntity,
    payment: CashingEntity,
    amount: number,
  ) {
    const amountPaid = Math.min(
      thirdParty.amount - thirdParty.amountPaid,
      amount,
    );
    const amountCarePaid = Math.min(
      thirdParty.amountCare - thirdParty.amountCarePaid,
      amountPaid,
    );
    const amountProsthesisPaid = amountPaid - amountCarePaid;
    thirdParty.amountPaid = thirdParty.amountPaid + amountPaid;
    thirdParty.amountPaidNoemie = thirdParty.amountPaidNoemie + amountPaid;
    thirdParty.amountCarePaid = thirdParty.amountCarePaid + amountCarePaid;
    thirdParty.amountProsthesisPaid =
      thirdParty.amountProsthesisPaid + amountProsthesisPaid;
    let status = EnumThirdPartyStatus.INCOMPLETE;
    if (thirdParty.amount - thirdParty.amountPaid) {
      status = EnumThirdPartyStatus.PAID;
    } else if (thirdParty.amountPaid) {
      status = EnumThirdPartyStatus.WAITING;
    }
    thirdParty.status = status;
    await this.fseRepo.update(thirdParty.caresheetId, {
      thirdPartyAmountPaid: () => `thirdPartyAmountPaid + ${amountPaid}`,
    });

    const paymentPayee = await this.cashingContactRepo.save(
      this.cashingContactRepo.create({
        conId: thirdParty.patientId,
        amount: amountPaid,
        amountCare: amountCarePaid,
        amountProsthesis: amountProsthesisPaid,
      }),
    );
    if (type === 'amo') {
      await this.thirdPartyAmoRepo.update(thirdParty.id, thirdParty);
    } else {
      await this.thirdPartyAmcRepo.update(thirdParty.id, thirdParty);
    }

    await this.mergePaymentPayee(payment, paymentPayee);
  }

  async mergePaymentPayee(
    payment: CashingEntity,
    paymentPayee: CashingContactEntity,
  ) {
    const payee = await this.cashingContactRepo.findOne({
      where: {
        conId: paymentPayee.conId,
      },
    });

    if (!payee || payee === null) {
      await this.cashingContactRepo.update(paymentPayee.id, {
        csgId: payment.id,
      });
    } else {
      await this.cashingContactRepo.update(payee.id, {
        amount: payee.amount + paymentPayee.amount,
        amountCare: payee.amountCare + paymentPayee.amountCare,
        amountProsthesis:
          payee.amountProsthesis + paymentPayee.amountProsthesis,
      });
    }
    await this.cashingRepo.update(payment.id, {
      amount: payment.amount + paymentPayee.amount,
      amountCare: payment.amountCare + paymentPayee.amountCare,
      amountProsthesis:
        payment.amountProsthesis + paymentPayee.amountProsthesis,
    });
  }
}
