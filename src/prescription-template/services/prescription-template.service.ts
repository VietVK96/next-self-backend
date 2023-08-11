import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { PrescriptionTemplateEntity } from 'src/entities/prescription-template.entity';
import { DataSource, In, Repository } from 'typeorm';
import {
  CreatePrescriptionTemplateDto,
  SortablePrescriptionTemplateDto,
} from '../dto/prescription-template.dto';
import { MedicamentEntity } from 'src/entities/medicament.entity';
import { ErrorCode } from 'src/constants/error';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { SuccessResponse } from 'src/common/response/success.res';

@Injectable()
export class PrescriptionTemplateService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(PrescriptionTemplateEntity)
    private prescriptionTemplateRepo: Repository<PrescriptionTemplateEntity>,
    @InjectRepository(OrganizationEntity)
    private organizationRepo: Repository<OrganizationEntity>,
    @InjectRepository(MedicamentEntity)
    private medicamentRepo: Repository<MedicamentEntity>,
  ) {}

  async findAll(organizationId: number) {
    if (!organizationId) {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }
    const prescriptionTemplate = await this.prescriptionTemplateRepo.find({
      where: { organizationId: organizationId },
      relations: {
        medicaments: true,
      },
      order: {
        position: 'ASC',
        id: 'ASC',
      },
    });
    if (!prescriptionTemplate)
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    return prescriptionTemplate;
  }

  async create(organizationId: number, payload: CreatePrescriptionTemplateDto) {
    if (!organizationId) {
      throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
    }
    const { name, observation, medicaments } = payload;
    const medicamentIds =
      medicaments && medicaments.length > 0
        ? medicaments.map((medicament) => {
            return medicament.id;
          })
        : [];
    let listMedicaments = [];
    if (medicaments) {
      listMedicaments = await this.medicamentRepo.find({
        where: { id: In(medicamentIds) },
      });
    }
    const newPrescriptionTemplate = await this.prescriptionTemplateRepo.save({
      name,
      observation,
      organizationId,
      medicaments: listMedicaments,
    });

    return newPrescriptionTemplate;
  }

  async upadte(
    organizationId: number,
    payload: CreatePrescriptionTemplateDto,
    id: number,
  ) {
    const { name, observation, medicaments } = payload;
    let listMedicaments = [];
    const medicamentIds =
      medicaments && medicaments.length > 0
        ? medicaments.map((medicament) => {
            return medicament.id;
          })
        : [];
    if (medicaments) {
      listMedicaments = await this.medicamentRepo.find({
        where: { id: In(medicamentIds) },
      });
    }
    if (!(id && organizationId)) {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }
    const currentPrescriptionTemplate =
      await this.prescriptionTemplateRepo.findOne({
        where: { id },
        relations: { medicaments: true },
      });
    if (!currentPrescriptionTemplate)
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    return await this.prescriptionTemplateRepo.save({
      ...currentPrescriptionTemplate,
      name,
      observation,
      medicaments: listMedicaments,
    });
  }

  async delete(id: number): Promise<SuccessResponse> {
    if (!id) {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }
    const currentPrescriptionTemplate =
      await this.prescriptionTemplateRepo.findOne({ where: { id } });
    if (!currentPrescriptionTemplate)
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    await this.prescriptionTemplateRepo.remove(currentPrescriptionTemplate);
    return {
      success: true,
    };
  }

  async sortable(payload: SortablePrescriptionTemplateDto[]) {
    const ids = payload.map((item) => item.id);
    let i = 0;
    for (const id of ids) {
      try {
        await this.dataSource
          .createQueryBuilder()
          .update(PrescriptionTemplateEntity)
          .set({ position: i })
          .where({ id })
          .execute();
        i++;
      } catch (error) {}
    }
    return;
  }
}
