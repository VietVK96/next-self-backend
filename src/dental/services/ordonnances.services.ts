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
import { EnregistrerFactureDto } from '../dto/facture.dto';

@Injectable()
export class OrdonnancesServices {
  constructor(
    @InjectRepository(MedicalHeaderEntity)
    private medicalHeaderRepository: Repository<MedicalHeaderEntity>,
    @InjectRepository(MedicalOrderEntity)
    private medicalRepository: Repository<MedicalOrderEntity>,
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
}
