import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { MedicalOrderEntity } from 'src/entities/medical-order.entity';
import { PermissionService } from 'src/user/services/permission.service';
import { Repository } from 'typeorm';
@Injectable()
export class MedicalOrderService {
  constructor(
    @InjectRepository(MedicalOrderEntity)
    private readonly medicalOrderRepo: Repository<MedicalOrderEntity>,
    private permissionService: PermissionService,
  ) {}
  async deleteById(id: number, identity: UserIdentity) {
    try {
      // Vérification de la permission de suppression.
      if (
        !this.permissionService.hasPermission(
          'PERMISSION_DELETE',
          8,
          identity.id,
        )
      ) {
        throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
      }

      // Suppression définitive de l'ordonnance en prenant soin de vérifier
      // qu'elle fait bien parti du groupe de l'utilisateur connecté.
      const medicalOrder = await this.medicalOrderRepo.findOne({
        where: {
          id,
          usrId: identity.id,
        },
        relations: {
          user: true,
        },
      });
      if (medicalOrder && medicalOrder.user.organizationId === identity.org) {
        await this.medicalOrderRepo.delete(id);
      }
      return;
    } catch (error) {
      throw new CBadRequestException(ErrorCode.DELETE_UNSUCCESSFUL);
    }
  }
}
