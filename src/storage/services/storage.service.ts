import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { StorageSpacePackEntity } from 'src/entities/storage-space-pack.entity';
import { UserService } from 'src/user/services/user.service';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { UpdateStoragePackDto } from '../dto/storage-pack.dto';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { SuccessResponse } from 'src/common/response/success.res';
import * as dayjs from 'dayjs';

@Injectable()
export class StorageService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(StorageSpacePackEntity)
    private storageSpacePackRepo: Repository<StorageSpacePackEntity>,
    private userService: UserService,
    private mailerService: MailerService,
  ) {}

  async getListByGroup(groupId: number) {
    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select()
      .from('T_STORAGE_SPACE_PACK_STK', 'stk')
      .select('stk.id as storageSpacePackId')
      .addSelect('sts.id as storageSpaceId')
      .addSelect('grp.id as groupId')
      .addSelect('stk.size as sizeBytes')
      .addSelect('stk.sizeReadable as sizeReadable')
      .addSelect('stk.price as price')
      .addSelect('IF(stk.price = 0, 1, 0) as free')
      .addSelect('IFNULL(sts.quantity, 0) as quantity')
      .leftJoin('stk.storageSpace', 'sts', 'sts.grpId = :grId', {
        grId: groupId,
      })
      .leftJoin('sts.group', 'grp');

    return queryBuilder.getRawMany();
  }

  async updateStoragePack(
    userId: number,
    organizationId: number,
    body: UpdateStoragePackDto,
  ): Promise<SuccessResponse> {
    if (!userId || !organizationId) {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }
    const user = await this.userService.find(userId);
    const groupEntity = await this.dataSource
      .getRepository(OrganizationEntity)
      .findOne({ where: { id: organizationId } });

    if (!user || !user?.admin) {
      throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
    }
    if (!groupEntity) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }

    let storageSpacePackCollection = await this.getListByGroup(organizationId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const storageSpaces = body?.storageSpaces;
    for (const [index, storageSpace] of storageSpaces.entries()) {
      const quantity = storageSpace?.quantity;
      let storageSpacePack = null;
      for (const storageSpacePackEntity of storageSpacePackCollection) {
        if (storageSpacePackEntity?.storageSpacePackId === index + 1) {
          storageSpacePack = storageSpacePackEntity;
        }
      }

      if (storageSpacePack && !Number(storageSpacePack?.free)) {
        await this.dataSource.query(
          `
        INSERT INTO T_STORAGE_SPACE_STS (STS_ID, GRP_ID, STK_ID, STS_QUANTITY)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE STS_QUANTITY = ?`,
          [
            storageSpacePack?.storageSpaceId,
            organizationId,
            storageSpacePack?.storageSpacePackId,
            quantity,
            quantity,
          ],
        );
      }
    }

    const storageSpaceUsed = groupEntity?.storageSpaceUsed;
    const totalStorageSpace = groupEntity?.totalStorageSpace;

    if (Number(storageSpaceUsed) > Number(totalStorageSpace)) {
      await queryRunner.rollbackTransaction();
      throw new CBadRequestException(ErrorCode.FULLY_STORAGE_SPACE);
    } else {
      await queryRunner.commitTransaction();
      storageSpacePackCollection = await this.getListByGroup(organizationId);
      const context = {
        fullname: user?.lastname + ' ' + user?.firstname,
        total: 0,
        now: dayjs().format('MM-DD-YYYY HH:mm:ss'),
        email: user?.email,
      };

      storageSpacePackCollection.forEach((storageSpacePackEntity) => {
        const sousTotal =
          storageSpacePackEntity?.quantity * storageSpacePackEntity?.price;
        context['item'] = {
          name: storageSpacePackEntity?.sizeReadable,
          sousTotal: sousTotal,
        };
        context['total'] += sousTotal;
      });

      await this.mailerService.sendMail({
        from: 'noreply@weclever.com',
        to: 'admin@dentalviamedilor.com',
        bcc: user?.email,
        subject: 'Votre facture - Espace de stockage',
        template: 'mail/storage/storage-space.hbs',
        context: context,
      });
    }

    return {
      success: true,
    };
  }

  async getStoragePack(organizationId: number) {
    if (!organizationId) {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }
    const groupEntity = await this.dataSource
      .getRepository(OrganizationEntity)
      .findOne({ where: { id: organizationId } });
    const storageSpacePackCollection = await this.getListByGroup(
      organizationId,
    );
    if (!groupEntity || !storageSpacePackCollection) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
    return {
      group: groupEntity,
      packs: storageSpacePackCollection,
    };
  }
}
