import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { PrescriptionTemplateEntity } from 'src/entities/prescription-template.entity';
import { DataSource, In, Repository } from 'typeorm';
import { CreatePrescriptionTemplateDto } from '../dto/prescription-template.dto';
import { MedicamentEntity } from 'src/entities/medicament.entity';
import { ErrorCode } from 'src/constants/error';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';

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
    const organization = await this.organizationRepo.findOne({
      where: { id: organizationId },
      relations: {
        prescriptionTemplates: {
          medicaments: true,
        },
      },
    });
    if (!organization) throw new CBadRequestException(ErrorCode.NOT_FOUND);
    return organization.prescriptionTemplates;
  }

  async create(organizationId: number, payload: CreatePrescriptionTemplateDto) {
    if (!organizationId) {
      throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
    }
    const { name, observation, medicaments } = payload;
    let listMedicaments = [];
    if (medicaments) {
      listMedicaments = await this.medicamentRepo.find({
        where: { id: In(medicaments) },
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
    if (medicaments) {
      listMedicaments = await this.medicamentRepo.find({
        where: { id: In(medicaments) },
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

  async delete(id: number) {
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
}
