import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm/repository/Repository';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { SuccessResponse } from 'src/common/response/success.res';
import { StoreNoteDto } from '../dto/noteStore.dto';
import { UserService } from 'src/user/services/user.service';
import { PatientService } from 'src/patient/service/patient.service';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { UserIdentity } from 'src/common/decorator/auth.decorator';

@Injectable()
export class QuotationService {
  constructor(
    @InjectRepository(DentalQuotationEntity)
    private readonly repo: Repository<DentalQuotationEntity>,
    private userService: UserService,
    private patientService: PatientService,
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
    // @TODO: Vérification de la permission de suppression.
    // if (!$entityManager->getRepository("\App\Entities\User")->hasPermission("PERMISSION_DELETE", 8, $userId)) :
    //     Response::sendJSONResponse(array("message" => trans("http_error_forbidden")), Response::STATUS_FORBIDDEN);
    //     exit;
    // endif;
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
