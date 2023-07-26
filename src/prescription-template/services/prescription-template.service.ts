import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { PrescriptionTemplateEntity } from 'src/entities/prescription-template.entity';
import { DataSource, In, Repository } from 'typeorm';
import { CreatePrescriptionTemplateDto } from '../dto/prescription-template.dto';
import { MedicamentEntity } from 'src/entities/medicament.entity';
import { ErrorCode } from 'src/constants/error';
import { SuccessCode } from 'src/constants/success';

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
    if (organizationId) {
      const organization = await this.organizationRepo.findOneOrFail({
        where: { id: organizationId },
        relations: {
          prescriptionTemplates: {
            medicaments: true,
          },
        },
      });
      return organization.prescriptionTemplates;
    }
  }

  async create(organizationId: number, payload: CreatePrescriptionTemplateDto) {
    if (organizationId) {
      const { name, observation, medicaments } = payload;
      let listMedicaments;
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
    return ErrorCode.PERMISSION_DENIED;
  }

  async upadte(
    organizationId: number,
    payload: CreatePrescriptionTemplateDto,
    id: number,
  ) {
    const { name, observation, medicaments } = payload;
    let listMedicaments;
    if (medicaments) {
      listMedicaments = await this.medicamentRepo.find({
        where: { id: In(medicaments) },
      });
    }
    if (id && organizationId) {
      const currentPrescriptionTemplate =
        await this.prescriptionTemplateRepo.findOneOrFail({
          where: { id },
          relations: { medicaments: true },
        });

      return await this.prescriptionTemplateRepo.save({
        ...currentPrescriptionTemplate,
        name,
        observation,
        medicaments: listMedicaments,
      });
    }
    return ErrorCode.FORBIDDEN;
  }

  async delete(id: number) {
    if (id) {
      const currentPrescriptionTemplate =
        await this.prescriptionTemplateRepo.findOneOrFail({ where: { id } });

      await this.prescriptionTemplateRepo.remove(currentPrescriptionTemplate);
      return SuccessCode.DELETE_SUCCESS;
    }
  }
}
