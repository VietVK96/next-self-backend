import { Injectable } from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionService } from 'src/user/services/permission.service';
import { CashingEntity } from 'src/entities/cashing.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { CashingContactEntity } from 'src/entities/cashing-contact.entity';
import { PerCode } from 'src/constants/permissions';
import { SuccessResponse } from 'src/common/response/success.res';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(CashingContactEntity)
    private cashingContactRepository: Repository<CashingContactEntity>,
    @InjectRepository(CashingEntity)
    private readonly cashingRepository: Repository<CashingEntity>,
    private readonly permissionService: PermissionService,
  ) {}

  // delete payment in table 'T_CASHING_CSG' and table 'T_CASHING_CONTACT_CSC'
  async remove(id: number, user: UserIdentity): Promise<SuccessResponse> {
    const userId = user.id;
    let payment: CashingEntity;
    try {
      payment = await this.cashingRepository.findOne({
        where: { id: id },
      });
    } catch (error) {
      throw new CBadRequestException(ErrorCode.QUERY_REPOSITORY_ERROR);
    }
    if (!payment) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }

    // check quyền
    const hasPermissionDelete = await this.permissionService.hasPermission(
      PerCode.PERMISSION_DELETE,
      8,
      userId,
    );
    const hasPermissionPaiement = await this.permissionService.hasPermission(
      PerCode.PERMISSION_PAIEMENT,
      8,
      userId,
      payment.usrId,
    );
    if (!hasPermissionDelete || !hasPermissionPaiement) {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }

    const queryRunner =
      this.cashingRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // delete in database
    try {
      const contacts = await this.cashingContactRepository.find({
        where: {
          cashing: { id: id },
        },
      });

      await this.cashingContactRepository.remove(contacts);

      await this.cashingRepository.remove(payment);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new CBadRequestException(ErrorCode.QUERY_REPOSITORY_ERROR);
    } finally {
      await queryRunner.release();
    }
    return { success: true };
  }
}
