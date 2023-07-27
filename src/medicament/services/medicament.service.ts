import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, Repository } from 'typeorm';
import { MedicamentEntity } from 'src/entities/medicament.entity';
import { CreateMedicamentDto } from '../dto/medicament.dto';
import { PermissionService } from 'src/user/services/permission.service';
import { ErrorCode } from 'src/constants/error';
import { ContraindicationEntity } from 'src/entities/contraindication.entity';
import { SuccessCode } from 'src/constants/success';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';

@Injectable()
export class MedicamentService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(MedicamentEntity)
    private medicamentRepo: Repository<MedicamentEntity>,
    private readonly permissionService: PermissionService,
    @InjectRepository(ContraindicationEntity)
    private contraindicationRepo: Repository<ContraindicationEntity>,
  ) {}

  async findAllByName(organizationId: number, name: string) {
    const result = await this.medicamentRepo.find({
      where: { name: Like(`%${name}%`), organizationId },
      relations: { family: true },
      order: {
        family: {
          position: 'ASC',
          name: 'ASC',
        },
        position: 'ASC',
        name: 'ASC',
      },
    });

    return result;
  }

  async create(
    organizationId: number,
    userId: number,
    body: CreateMedicamentDto,
  ) {
    const hasPermissionCreate = await this.permissionService.hasPermission(
      'PERMISSION_LIBRARY',
      2,
      userId,
    );
    if (!hasPermissionCreate) {
      throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
    }

    const {
      bcbdextherId,
      family,
      abbreviation,
      name,
      format,
      dosage,
      posologie,
      contraindications,
    } = body;
    let listContraindications;
    if (contraindications)
      listContraindications = await this.contraindicationRepo.find({
        where: { id: In(contraindications) },
      });
    return await this.medicamentRepo.save({
      mdtId: family,
      name,
      abbreviation,
      format,
      dosage,
      posologie,
      bcbdextherId,
      contraindications: listContraindications,
      organizationId,
    });
  }

  async duplicate(id: number) {
    if (!id) {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }
    const currentMedicament = await this.medicamentRepo.findOneOrFail({
      where: { id },
      relations: { contraindications: true },
    });
    return await this.medicamentRepo.save({
      ...currentMedicament,
      id: null,
    });
  }

  async update(id: number, body: CreateMedicamentDto, userId: number) {
    const hasPermission = await this.permissionService.hasPermission(
      'PERMISSION_LIBRARY',
      2,
      userId,
    );
    if (!hasPermission) {
      throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
    }

    if (!id) {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }
    const currentMedicament = await this.medicamentRepo.findOneOrFail({
      where: { id },
      relations: { contraindications: true },
    });

    const {
      bcbdextherId,
      family,
      abbreviation,
      name,
      format,
      dosage,
      posologie,
      contraindications,
    } = body;
    let listContraindications;
    if (contraindications)
      listContraindications = await this.contraindicationRepo.find({
        where: { id: In(contraindications) },
      });
    return await this.medicamentRepo.save({
      ...currentMedicament,
      mdtId: family,
      name,
      abbreviation,
      format,
      dosage,
      posologie,
      bcbdextherId,
      contraindications: listContraindications,
    });
  }

  async delete(id: number, userId: number) {
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
    const currentMedicament = await this.medicamentRepo.findOneOrFail({
      where: { id },
    });
    await this.medicamentRepo.remove(currentMedicament);
    return SuccessCode.DELETE_SUCCESS;
  }
}
