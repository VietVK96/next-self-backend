import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DentalQuotationEntity,
  EnumDentalQuotationSchemes,
} from 'src/entities/dental-quotation.entity';
import { DataSource, FindOptionsWhere, In, Repository } from 'typeorm';
import { DevisRequestAjaxDto } from '../dto/devisHN.dto';
import * as dayjs from 'dayjs';
import { DEFAULT_LOCALE } from 'src/constants/locale';

import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import {
  DentalQuotationActEntity,
  EnumDentalQuotationActType,
} from 'src/entities/dental-quotation-act.entity';
import { LettersEntity } from 'src/entities/letters.entity';
import { MailService } from 'src/mail/services/mail.service';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { MedicalHeaderEntity } from 'src/entities/medical-header.entity';
import { UserEntity } from 'src/entities/user.entity';
@Injectable()
export class DevisHNServices {
  constructor(
    private mailService: MailService,
    private readonly dataSource: DataSource,
    @InjectRepository(DentalQuotationEntity)
    private readonly dentalQuotationRepository: Repository<DentalQuotationEntity>,
    @InjectRepository(LettersEntity)
    private readonly lettersRepository: Repository<LettersEntity>,
    @InjectRepository(DentalQuotationActEntity)
    private readonly dentalQuotationActRepository: Repository<DentalQuotationActEntity>,
    @InjectRepository(MedicalHeaderEntity)
    private medicalHeaderRepository: Repository<MedicalHeaderEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async updateTimePlan(acceptedAt: string, id_devisHN: number) {
    return await this.dataSource.query(
      ` UPDATE T_PLAN_PLF
      JOIN T_DENTAL_QUOTATION_DQO
      SET PLF_ACCEPTED_ON = ?
      WHERE T_PLAN_PLF.PLF_ACCEPTED_ON IS NULL
          AND T_PLAN_PLF.PLF_ID = T_DENTAL_QUOTATION_DQO.PLF_ID
          AND T_DENTAL_QUOTATION_DQO.DQO_ID = ?`,
      [dayjs(acceptedAt).locale(DEFAULT_LOCALE).format('d/m/Y'), id_devisHN],
    );
  }

  // async update
  async requestAjax(payload: DevisRequestAjaxDto) {
    switch (payload.operation) {
      case 'enregistrer':
        try {
          const {
            id_devisHN,
            duration,
            identPrat,
            addrPrat,
            identPat,
            infosCompl,
            couleur,
            schemas,
            amount,
            personRepayment,
            signaturePatient,
            signaturePraticien,
            prestations,
          } = payload;
          const name = payload.titreDevisHN;
          const date = dayjs(payload.datedevisHN)
            .locale(DEFAULT_LOCALE)
            .format('DD/MM/YYYY');
          const acceptedAt = dayjs(payload.date_acceptation)
            .locale(DEFAULT_LOCALE)
            .format('DD/MM/YYYY');
          const dentalQuotation = await this.dentalQuotationRepository.findOne({
            where: {
              id: id_devisHN,
            },
          });
          if (!dentalQuotation) {
            throw new CNotFoundRequestException('not found quotation');
          }
          if (acceptedAt) {
            await this.updateTimePlan(acceptedAt, id_devisHN);
          }
          dentalQuotation.date = date;
          (dentalQuotation.dateAccept = acceptedAt ? acceptedAt : null),
            (dentalQuotation.duration = duration);
          dentalQuotation.identContact = identPat;
          dentalQuotation.msg = infosCompl;
          dentalQuotation.identPrat = identPrat;
          dentalQuotation.addrPrat = addrPrat;
          dentalQuotation.title = name;
          dentalQuotation.type = 1;
          dentalQuotation.color = couleur;
          dentalQuotation.schemes =
            EnumDentalQuotationSchemes[
              schemas as keyof typeof EnumDentalQuotationSchemes
            ];
          dentalQuotation.amount = amount;
          dentalQuotation.personRepayment = personRepayment;
          dentalQuotation.signaturePatient = signaturePatient;
          dentalQuotation.signaturePraticien = signaturePraticien;
          // update dentalQuotation
          await this.dentalQuotationRepository.update(
            { id: dentalQuotation.id },
            dentalQuotation,
          );
          const prestationIds: string[] = [];
          if (prestations && prestations.length > 0) {
            for (let i = 0; i < prestations.length; i++) {
              let prestationId = prestations[i].id_devisHN_ligne;
              const prestationTypeLine = prestations[i].typeLigne;
              const prestationName = prestations[i].descriptionLigne;
              const descriptiveText = prestations[i]?.descriptive_text;
              const prestationCotation = prestations[i].cotation;
              const prestationSecuRepayment =
                prestations[i]?.secuRepayment || 0;
              const prestationAmount = prestations[i]?.prixLigne || 0;
              const estimatedMonthTreatment = prestations[i]
                ?.estimatedMonthTreatment
                ? dayjs(prestations[i].estimatedMonthTreatment).format(
                    'YYYY-MM-DD',
                  )
                : null;
              if (!prestationId) {
                const dentalQAct: DentalQuotationActEntity = {
                  DQOId: dentalQuotation.id,
                  type: EnumDentalQuotationActType[
                    prestationTypeLine as keyof typeof EnumDentalQuotationActType
                  ],
                  pos: i,
                  name: prestationName,
                  descriptiveText: descriptiveText,
                  ngapCode: prestationCotation,
                  secuRepayment: prestationSecuRepayment,
                  amount: prestationAmount,
                  estimatedMonthTreatment: estimatedMonthTreatment,
                };
                const inserResult =
                  await this.dentalQuotationActRepository.insert(dentalQAct);
                prestationId = inserResult.raw.insertId;
              } else {
                await this.dataSource
                  .createQueryBuilder()
                  .update(DentalQuotationActEntity)
                  .set({
                    pos: i,
                    name: prestationName,
                    descriptiveText: descriptiveText,
                    estimatedMonthTreatment: estimatedMonthTreatment,
                  })
                  .where('DQO_ID = :DQOId AND DQA_ID = :id', {
                    DQOId: dentalQuotation.id,
                    id: prestationId,
                  })
                  .execute();
              }
              prestationIds.push(prestationId);
            }

            if (prestationIds.length < 1) {
              const conditions: FindOptionsWhere<DentalQuotationActEntity> = {
                DQOId: dentalQuotation.id,
                id: In(prestationIds),
              };
              this.dentalQuotationActRepository.delete(conditions);
            }

            const quote = await this.dentalQuotationRepository.findOne({
              where: { id: dentalQuotation.id },
            });
            quote.treatmentTimeline = Number(payload.treatment_timeline);

            // Save quote attachments.
            if (quote.attachments && quote.attachments.length > 1) {
              for (let i = quote.attachments.length - 1; i >= 0; i--) {
                await this.lettersRepository.update(
                  { id: quote.attachments[i].id },
                  {
                    quoteId: null,
                  },
                );
                quote.attachments.splice(i, 1);
              }
            }
            if (payload.attachments && payload.attachments.length > 0) {
              for (let i = 0; i < payload.attachments.length; i++) {
                const mail = await this.lettersRepository.findOne({
                  where: { id: payload.attachments[i] },
                });
                const context = await this.mailService.context({
                  doctor_id: quote.user.id,
                  patient_id: quote.patient.id,
                });
                const signature: { practitioner?: string; patient?: string } =
                  {};
                if (quote.signaturePraticien) {
                  signature.practitioner = quote.signaturePraticien;
                }
                if (quote.signaturePatient) {
                  signature.patient = quote.signaturePatient;
                }

                const mailConverted = await this.mailService.transform(
                  mail,
                  context,
                  signature,
                );
                mailConverted.doctor.id = quote?.user?.id;
                mailConverted.patient.id = quote?.patient?.id;
                if (mailConverted?.header) {
                  mailConverted.body = `<div class="page_header"> . ${mailConverted?.header?.body} . </div>${mailConverted?.body}`;
                }
                delete mailConverted?.header;
                delete mailConverted?.footer;
                const mailResult = await this.mailService.store(mailConverted);
                const newMail = await this.lettersRepository.findOne({
                  where: { id: mailResult?.id },
                });
                this.lettersRepository.save({
                  id: newMail?.id,
                  quoteId: quote?.id,
                });
              }
            }
            await this.dentalQuotationRepository.update(
              { id: quote.id },
              quote,
            );
          }
        } catch (err) {
          throw new CBadRequestException(
            `error with type enregistrer ... ${err?.message}`,
          );
        }
      case 'enregistrerEnteteParDefaut':
        try {
          const medicalHeader = await this.medicalHeaderRepository.findOne({
            where: { userId: payload.id_user },
          });
          if (!medicalHeader) {
            const user = await this.userRepository.findOne({
              where: { id: payload.id_user },
            });
            await this.medicalHeaderRepository.insert({
              userId: user.id,
              nameQuotHN: payload.titreDevisHN,
              address: payload.addrPrat,
              identPrat: payload.identPrat,
              dentalQuotationMessage: payload.infosCompl,
            });
          } else {
            await this.medicalHeaderRepository.update(
              { id: medicalHeader.id },
              {
                nameQuotHN: payload.titreDevisHN,
                address: payload.addrPrat,
                identPrat: payload.identPrat,
                dentalQuotationMessage: payload.infosCompl,
              },
            );
          }
        } catch (err) {
          throw new CBadRequestException(
            `error with type enregistrerEnteteParDefaut ... ${err?.message}`,
          );
        }
    }
  }
}
