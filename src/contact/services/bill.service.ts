import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { BillLineEntity } from 'src/entities/bill-line.entity';
import { BillEntity } from 'src/entities/bill.entity';
import { PlanEntity } from 'src/entities/plan.entity';
import { PermissionService } from 'src/user/services/permission.service';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class BillService {
  constructor(
    private dataSource: DataSource,
    private readonly permissionService: PermissionService,
    @InjectRepository(BillEntity) private billRepo: Repository<BillEntity>,
  ) {}

  async deleteBill(id: number, identity: UserIdentity) {
    // Récupération de l'état de vérouillage de la facture ainsi que l'identifiant du praticien.
    // Une facture est vérouillée lorsque celle-ci a été imprimée.
    const billRepository = this.dataSource.getRepository(BillEntity);
    const billLockAndUserId = await billRepository
      .createQueryBuilder('bil')
      .select('bil.lock', 'lock')
      .addSelect('usr.id', 'id')
      .innerJoin('bil.user', 'usr')
      .where('bil.id = :billId', { billId: id })
      .andWhere('usr.group = :groupId', { groupId: identity.org })
      .getRawOne();

    // Vérification de la permission de suppression.
    if (
      !this.permissionService.hasPermission(
        'PERMISSION_BILLING',
        8,
        identity.id,
        billLockAndUserId.id,
      ) ||
      !this.permissionService.hasPermission('PERMISSION_DELETE', 8, identity.id)
    ) {
      throw new CBadRequestException('Permission denied');
    }

    // Traitement différent en fonction de l'état de vérouillage.
    if (billLockAndUserId.lock) {
      // Mise en corbeille de la facture lorsque celle-ci a été imprimée.
      await this.billRepo.delete(id);
    } else {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await queryRunner.manager
          .createQueryBuilder()
          .update(PlanEntity)
          .set({ bill: null })
          .where('bill = :billId', { billId: id })
          .execute();

        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(BillLineEntity)
          .where('bill = :billId', { billId: id })
          .execute();

        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(BillEntity)
          .where('id = :billId', { billId: id })
          .execute();
        await queryRunner.commitTransaction();
        return;
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw new CBadRequestException('query failed');
      } finally {
        await queryRunner.release();
      }
    }
  }
}
