import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { Repository } from 'typeorm';
import { DevisRequestAjaxDto } from '../dto/devisHN.dto';
import * as dayjs from 'dayjs';
import { DEFAULT_LOCALE } from 'src/constants/locale';
import { id } from 'date-fns/locale';
@Injectable()
export class DevisHNServices {
  constructor(
    @InjectRepository(DentalQuotationEntity)
    private dentalQuotationRepository: Repository<DentalQuotationEntity>,
  ) {}

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
      .format('d/m/Y');
    const acceptedAt = dayjs(payload.date_acceptation)
      .locale(DEFAULT_LOCALE)
      .format('d/m/Y');
    const dentalQuotation = await this.dentalQuotationRepository.find({
      where: {
        id: id_devisHN,
      },
    });
    return dentalQuotation;
  }
}
