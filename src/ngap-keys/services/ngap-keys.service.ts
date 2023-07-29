import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { NgapKeyEntity } from 'src/entities/ngapKey.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { UpdateNgapKeyDto } from '../dto/ngap-keys.dto';
import { PermissionService } from 'src/user/services/permission.service';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';

@Injectable()
export class NgapKeysService {
  constructor(
    @InjectRepository(NgapKeyEntity)
    private ngapKeysRepo: Repository<NgapKeyEntity>,
    private readonly permissionService: PermissionService,
  ) {}

  async findAll(used: string, identity: UserIdentity) {
    let usedCondition = 1;
    if (used && used.toLowerCase?.() !== 'true' && used.toLowerCase?.() !== '1')
      usedCondition = 0;

    const ngapKeys: NgapKeyEntity[] = await this.ngapKeysRepo.find({
      where: {
        used: usedCondition,
        organizationId: identity.org,
      },
      order: {
        name: 'ASC',
      },
    });

    return ngapKeys;
  }

  async findByCondition(
    condition: FindOneOptions<NgapKeyEntity>,
    identity: UserIdentity,
  ) {
    return await this.ngapKeysRepo.findOneBy({
      ...condition,
      organizationId: identity.org,
    });
  }

  async update(id: number, body: UpdateNgapKeyDto, userId: number) {
    try {
      const hasPermission = await this.permissionService.hasPermission(
        'PERMISSION_LIBRARY',
        4,
        userId,
      );
      if (!hasPermission)
        throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);

      if (!id) throw new CBadRequestException(ErrorCode.FORBIDDEN);
      const currentNgapKey = await this.ngapKeysRepo.findOne({ where: { id } });
      if (!currentNgapKey) throw new CBadRequestException(ErrorCode.NOT_FOUND);
      return await this.ngapKeysRepo.save({
        ...currentNgapKey,
        ...body,
      });
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }
}
