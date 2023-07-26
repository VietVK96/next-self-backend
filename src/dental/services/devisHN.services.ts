import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalHeaderEntity } from 'src/entities/medical-header.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { UserIdentity } from 'src/common/decorator/auth.decorator';

import { UserEntity } from 'src/entities/user.entity';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { DevisRequestAjaxDto } from '../dto/devis_request_ajax.dto';
import { LettersEntity } from 'src/entities/letters.entity';
import { MailService } from 'src/mail/services/mail.service';
import { UserPreferenceQuotationEntity } from 'src/entities/user-preference-quotation.entity';
import { format } from 'date-fns';
import { validateEmail } from 'src/common/util/string';

@Injectable()
export class DevisServices {
  constructor(
    private mailService: MailService,
    @InjectRepository(DentalQuotationEntity)
    private dentalQuotationEntity: Repository<DentalQuotationEntity>,

    private dataSource: DataSource,
  ) {}

  // dental/devisHN/devisHN_email.php (line 1 - 91)
  async devisHNEmail(req: any) {
    const qb = this.dataSource
      .getRepository(DentalQuotationEntity)
      .createQueryBuilder('dqo');
    const result = await qb
      .select('dqo.date', 'quotationDate')
      .addSelect('dqo.reference', 'quotationReference')
      .addSelect('dqo.email', 'userEmail')
      .addSelect('dqo.lastnamne', 'userLastname')
      .addSelect('dqo.firstname', 'userFirstname')
      .innerJoin('dqo.user', 'usr')
      .innerJoin('dqo.contact', 'con')
      .where('dqo.id = :id', { id: req?.no_devis })
      .getRawOne();

    const quotationDate = result?.quotationDate;
    const quotationDateAsString = format(quotationDate, 'dd/MM/yyyy');
    const quotationReference = result?.quotationReference;
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
    const filename = `Devis_${quotationReference}.pdf`;
    const sendByEmail = true;
  }
}
