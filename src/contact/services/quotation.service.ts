import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { SuccessResponse } from 'src/common/response/success.res';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { PermissionService } from 'src/user/services/permission.service';

@Injectable()
export class QuotationService {
  constructor(
    private permissionService: PermissionService,
    @InjectRepository(DentalQuotationEntity)
    private readonly repo: Repository<DentalQuotationEntity>,
    @InjectRepository(DentalQuotationEntity)
    private readonly detailQuotationRepo: Repository<DentalQuotationEntity>,
  ) {}

  async findQuotationByID(id: number) {
    return await this.detailQuotationRepo.find({
      where: { id: id },
      relations: {
        logo: true,
        user: true,
        contact: true,
        patient: true,
        planification: true,
        treatmentPlan: true,
        acts: true,
        paymentPlan: true,
        attachments: true,
      },
    });
  }

  async deleteQuotation(
    identity: UserIdentity,
    id: number,
  ): Promise<SuccessResponse> {
    if (
      !this.permissionService.hasPermission('PERMISSION_DELETE', 8, identity.id)
    ) {
      throw new NotAcceptableException();
    }
    const quotation = await this.findQuotationByID(id);

    if (
      !quotation ||
      !quotation[0] ||
      !quotation[0].user ||
      quotation[0].user.organizationId != identity.org
    ) {
      throw new CBadRequestException(ErrorCode.DELETE_UNSUCCESSFUL);
    }

    const deleteQuotation = await this.repo.delete(id);
    if (deleteQuotation.affected === 0) {
      throw new CBadRequestException(ErrorCode.DELETE_UNSUCCESSFUL);
    }

    return {
      success: true,
    };
  }
}
