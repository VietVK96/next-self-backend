import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { DataSource, Repository } from 'typeorm';
import {
  SortableContraindicationsDto,
  CreateContraindicationsDto,
} from '../dto/contraindications.dto';
import { PermissionService } from 'src/user/services/permission.service';
import { ErrorCode } from 'src/constants/error';
import { ContraindicationEntity } from 'src/entities/contraindication.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { SuccessResponse } from 'src/common/response/success.res';

@Injectable()
export class ContraindicationsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(OrganizationEntity)
    private organizationRepo: Repository<OrganizationEntity>,
    private readonly permissionService: PermissionService,
    @InjectRepository(ContraindicationEntity)
    private contraindicationRepo: Repository<ContraindicationEntity>,
  ) {}

  async findAll(identity: UserIdentity) {
    const organization: OrganizationEntity =
      await this.organizationRepo.findOne({
        relations: {
          contraindications: true,
        },
        where: {
          id: identity.org,
        },
      });

    return organization?.contraindications.sort(
      (a, b) => a.position - b.position,
    );
  }

  async create(
    userId: number,
    body: CreateContraindicationsDto,
    organizationId: number,
  ) {
    const hasPermission = await this.permissionService.hasPermission(
      'PERMISSION_LIBRARY',
      2,
      userId,
    );
    if (!hasPermission) {
      throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
    }
    return await this.contraindicationRepo.save({
      ...body,
      organizationId,
    });
  }

  async update(userId: number, body: CreateContraindicationsDto, id: number) {
    const hasPermission = await this.permissionService.hasPermission(
      'PERMISSION_LIBRARY',
      4,
      userId,
    );
    if (!hasPermission) {
      throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
    }
    if (!id) {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }
    const currentContraindication = await this.contraindicationRepo.findOne({
      where: { id },
    });
    if (!currentContraindication) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
    return await this.contraindicationRepo.save({
      ...currentContraindication,
      ...body,
    });
  }

  async delete(userId: number, id: number): Promise<SuccessResponse> {
    const hasPermission = await this.permissionService.hasPermission(
      'PERMISSION_LIBRARY',
      8,
      userId,
    );
    if (!hasPermission) {
      throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
    }
    if (!id) {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }
    const currentContraindication = await this.contraindicationRepo.findOne({
      where: { id },
    });
    if (!currentContraindication) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
    await this.contraindicationRepo.softRemove(currentContraindication);
    return {
      success: true,
    };
  }

  async sortable(payload: SortableContraindicationsDto[]) {
    const ids = payload.map((item) => item.id);
    let i = 0;
    for (const id of ids) {
      try {
        await this.dataSource
          .createQueryBuilder()
          .update(ContraindicationEntity)
          .set({ position: i })
          .where({ id })
          .execute();
        i++;
      } catch (error) {}
    }
    return;
  }
}
