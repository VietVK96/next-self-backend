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
import { id } from 'date-fns/locale';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import {
  DentalQuotationActEntity,
  EnumDentalQuotationActType,
} from 'src/entities/dental-quotation-act.entity';
import { LettersEntity } from 'src/entities/letters.entity';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/services/mail.service';
@Injectable()
export class DevisHNServices {
  constructor(
    private configService: ConfigService,
    private mailService: MailService,
    private readonly dataSource: DataSource,
    @InjectRepository(DentalQuotationEntity)
    private readonly dentalQuotationRepository: Repository<DentalQuotationEntity>,
    @InjectRepository(LettersEntity)
    private readonly lettersRepository: Repository<LettersEntity>,
    @InjectRepository(DentalQuotationActEntity)
    private readonly dentalQuotationActRepository: Repository<DentalQuotationActEntity>,
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
        const dentalQuotation = await this.dentalQuotationRepository.find({
          where: {
            id: id_devisHN,
          },
        });
        if (!dentalQuotation || dentalQuotation.length < 1) {
          throw new CNotFoundRequestException('not found quotation');
        }
        if (acceptedAt) {
          await this.updateTimePlan(acceptedAt, id_devisHN);
        }
        const dentalQ: DentalQuotationEntity = {
          date: date,
          dateAccept: acceptedAt ? acceptedAt : null,
          duration: duration,
          identContact: identPat,
          msg: infosCompl,
          identPrat: identPrat,
          addrPrat: addrPrat,
          title: name,
          type: 1,
          color: couleur,
          schemes:
            EnumDentalQuotationSchemes[
              schemas as keyof typeof EnumDentalQuotationSchemes
            ],
          amount: amount,
          personRepayment: personRepayment,
          signaturePatient: signaturePatient,
          signaturePraticien: signaturePraticien,
        };
        // update dentalQuotation
        const detalQResutl = await this.dentalQuotationRepository.save(dentalQ);
        let prestationIds: string[];
        if (prestations && prestations.length > 0) {
          for (let i = 0; i < prestations.length; i++) {
            let prestationId = prestations[i].id_devisHN_ligne;
            const prestationTypeLine = prestations[i].typeLigne;
            const prestationName = prestations[i].descriptionLigne;
            const descriptiveText = prestations[i]?.descriptive_text;
            const prestationCotation = prestations[i].cotation;
            const prestationSecuRepayment = prestations[i]?.secuRepayment || 0;
            const prestationAmount = prestations[i]?.prixLigne || 0;
            const estimatedMonthTreatment = prestations[i]
              ?.estimatedMonthTreatment
              ? dayjs(prestations[i].estimatedMonthTreatment).format(
                  'YYYY-MM-DD',
                )
              : null;
            if (!prestationId) {
              const dentalQAct: DentalQuotationActEntity = {
                DQOId: detalQResutl.id,
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
                  pos: id,
                  name: prestationName,
                  descriptiveText: descriptiveText,
                  estimatedMonthTreatment: estimatedMonthTreatment,
                })
                .where('DQO_ID = :DQOId AND DQA_ID = :id', {
                  DQOId: detalQResutl.id,
                  id: prestationId,
                })
                .execute();
            }
            prestationIds.push(prestationId);
          }

          if (prestationIds.length < 1) {
            const conditions: FindOptionsWhere<DentalQuotationActEntity> = {
              DQOId: detalQResutl.id,
              id: In(prestationIds),
            };
            this.dentalQuotationActRepository.delete(conditions);
          }

          const quote = await this.dentalQuotationRepository.findOne({
            where: { id: detalQResutl.id },
          });
          quote.treatmentTimeline = Number(payload.treatment_timeline);

          // Save quote attachments.
          if (quote.attachments.length > 1) {
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

          if (payload.attachments && payload.attachments.length > 1) {
            for (let i = 0; i < payload.attachments.length; i++) {
              const mail = await this.lettersRepository.findOne({
                where: { id: payload.attachments[i] },
              });
              const context = await this.mailService.context({
                doctor_id: quote.user.id,
                patient_id: quote.patient.id,
              });
              const signature: { practitioner?: string; patient?: string } = {};
              if (quote.practitionerSignature) {
                signature.practitioner = quote.practitionerSignature;
              }
              if (quote.patientSignature) {
                signature.patient = quote.patientSignature;
              }
            }
          }
        }
        return dentalQuotation;
    }
  }
}
