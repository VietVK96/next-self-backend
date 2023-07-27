import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MedicamentFamilyEntity } from 'src/entities/medicament-family.entity';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { ErrorCode } from 'src/constants/error';
import { CreateMedicamentFamilyDto } from '../dto/medicament-family.dto';
import { PermissionService } from 'src/user/services/permission.service';
import { SuccessCode } from 'src/constants/success';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';

@Injectable()
export class MedicamentFamilyService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(MedicamentFamilyEntity)
    private medicamentFamilyRepo: Repository<MedicamentFamilyEntity>,
    @InjectRepository(OrganizationEntity)
    private organizationRepo: Repository<OrganizationEntity>,
    private readonly permissionService: PermissionService,
  ) {}

  async findAll(organizationId: number) {
    if (organizationId) {
      const organization = await this.organizationRepo.findOneOrFail({
        where: { id: organizationId },
        relations: { medicamentFamilies: { medicaments: true } },
      });
      return organization.medicamentFamilies;
    } else {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }
  }

  async create(
    organizationId: number,
    userId: number,
    body: CreateMedicamentFamilyDto,
  ) {
    const hasPermissionCreate = await this.permissionService.hasPermission(
      'PERMISSION_LIBRARY',
      2,
      userId,
    );
    if (!hasPermissionCreate) {
      throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
    }
    return await this.medicamentFamilyRepo.save({
      ...body,
      organizationId,
    });
  }

  async update(userId: number, body: CreateMedicamentFamilyDto, id: number) {
    const hasPermissionUpdate = await this.permissionService.hasPermission(
      'PERMISSION_LIBRARY',
      4,
      userId,
    );
    if (!hasPermissionUpdate) {
      throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
    }
    if (id) {
      const currentMedicamentFamily =
        await this.medicamentFamilyRepo.findOneOrFail({ where: { id } });
      return await this.medicamentFamilyRepo.save({
        ...currentMedicamentFamily,
        ...body,
      });
    } else {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }
  }

  async delete(userId: number, id: number) {
    const hasPermissionDelete = await this.permissionService.hasPermission(
      'PERMISSION_LIBRARY',
      8,
      userId,
    );
    if (!hasPermissionDelete) {
      throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
    }
    if (id) {
      const currentMedicamentFamily =
        await this.medicamentFamilyRepo.findOneOrFail({ where: { id } });
      await this.medicamentFamilyRepo.remove(currentMedicamentFamily);
      return SuccessCode.DELETE_SUCCESS;
    } else {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }
  }
}
