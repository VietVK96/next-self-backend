import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TariffTypeEntity } from 'src/entities/tariff-type.entity';
import { Repository } from 'typeorm';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';

@Injectable()
export class TariffTypesService {
  constructor(
    @InjectRepository(TariffTypeEntity)
    private tariffTypesRepo: Repository<TariffTypeEntity>,
  ) {}

  async getAllTariffTypes(identity: UserIdentity) {
    return await this.tariffTypesRepo.findBy({
      organizationId: identity.org,
    });
  }

  async createTariffType(
    identity: UserIdentity,
    name: string,
  ): Promise<TariffTypeEntity> {
    const tariffType = await this.tariffTypesRepo.findBy({
      organizationId: identity.org,
      name: name,
    });

    const listTariff = await this.tariffTypesRepo.find({
      where: { organizationId: identity.org },
    });

    if (tariffType.length > 0 && listTariff.length >= 5) {
      throw new CBadRequestException(ErrorCode.TOTALERR);
    }

    if (tariffType.length > 0) {
      throw new CBadRequestException(ErrorCode.DUPLICATE);
    }

    //TODO: RESEARCH HOW TO EXTRACT MAX_ENTRIES FROM ENTITIES
    const MAX_ENTRIES = 5;
    if (listTariff.length >= MAX_ENTRIES) {
      throw new CBadRequestException(ErrorCode.MAXIMUM);
    }

    const newTariffType = this.tariffTypesRepo.create({
      name,
      organizationId: identity.org,
    });

    return this.tariffTypesRepo.save(newTariffType);
  }

  async editTariffType(
    identity: UserIdentity,
    id: number,
    attrs: Partial<TariffTypeEntity>,
  ): Promise<TariffTypeEntity> {
    const tariffType = await this.tariffTypesRepo.findOneBy({
      organizationId: identity.org,
      id,
    });

    if (!tariffType) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }

    const checkTariffType = await this.tariffTypesRepo.findBy({
      organizationId: identity.org,
      name: attrs?.name,
    });

    if (checkTariffType.length > 0) {
      throw new CBadRequestException(ErrorCode.DUPLICATE);
    }

    Object.assign(tariffType, attrs);
    return this.tariffTypesRepo.save(tariffType);
  }

  async deleteTariffType(
    identity: UserIdentity,
    id: number,
  ): Promise<TariffTypeEntity> {
    const tariffType = await this.tariffTypesRepo.findOneBy({
      organizationId: identity.org,
      id,
    });
    if (!tariffType) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }

    return await this.tariffTypesRepo.remove(tariffType);
  }
}
