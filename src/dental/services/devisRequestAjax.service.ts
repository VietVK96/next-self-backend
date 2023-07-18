import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { DataSource, Repository } from 'typeorm';
import { DevisRequestAjaxDto } from '../dto/devisHN.dto';
import * as dayjs from 'dayjs';
import { DEFAULT_LOCALE } from 'src/constants/locale';
import { id } from 'date-fns/locale';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
@Injectable()
export class DevisHNServices {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(DentalQuotationEntity)
    private dentalQuotationRepository: Repository<DentalQuotationEntity>,
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
  async requestAjax(payload: DevisRequestAjaxDto) {
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
    return dentalQuotation;
  }
}
