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
      if ((payload?.creationDate as string) && (payload?.endDate as string)) {
        await this.medicalRepository.save({
          usrId: payload?.userId,
          conId: payload?.patientId,
          title: payload?.title,
          date: payload?.creationDate,
          endDate: payload?.endDate,
        });
      }
      if (payload?.keepParams === 1) {
        const medicalHeader = this.medicalHeaderRepository.findOne({
          where: { userId: payload?.userId },
        });
        if (!medicalHeader) {
          await this.medicalHeaderRepository.create({
            userId: payload?.userId,
          });
        }
        await this.medicalHeaderRepository.save({
          userId: payload?.userId,
          msg: payload?.headerMsg,
          address: payload?.address,
          identPrat: payload?.identPrat,
          height: payload?.headerHeight,
          format: payload?.format,
          headerEnable: payload?.headerEnable,
        });
        return medicalHeader;
      }
      {
        throw new CBadRequestException(ErrorCode.STATUS_NOT_FOUND);
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
}
