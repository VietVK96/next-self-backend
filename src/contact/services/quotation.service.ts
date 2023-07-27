import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { SuccessResponse } from 'src/common/response/success.res';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { PermissionService } from 'src/user/services/permission.service';
import { PerCode } from 'src/constants/permissions';
import { CForbiddenRequestException } from 'src/common/exceptions/forbidden-request.exception';
import { DataSource } from 'typeorm';
import { UserEntity } from 'src/entities/user.entity';
import {
  UserPreferenceQuotationDisplayAnnexeType,
  UserPreferenceQuotationDisplayOdontogramType,
  UserPreferenceQuotationEntity,
} from 'src/entities/user-preference-quotation.entity';
import { PreferenceQuotationDto } from '../dto/quotation.dto';

@Injectable()
export class QuotationService {
  constructor(
    private dataSource: DataSource,
    private permissionService: PermissionService,
    @InjectRepository(DentalQuotationEntity)
    private readonly repo: Repository<DentalQuotationEntity>,
    @InjectRepository(UserPreferenceQuotationEntity)
    private readonly userPreferenceQuotation: Repository<UserPreferenceQuotationEntity>,
  ) {}

  async findQuotationByID(id: number) {
    return await this.repo.find({
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
      !this.permissionService.hasPermission(
        PerCode.PERMISSION_DELETE,
        8,
        identity.id,
      )
    ) {
      throw new CForbiddenRequestException(ErrorCode.FORBIDDEN);
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

  async patchPreferenceQuotation(
    identity: UserIdentity,
    payload: PreferenceQuotationDto,
  ): Promise<SuccessResponse> {
    try {
      const queryBuilder = this.dataSource
        .getRepository(UserEntity)
        .createQueryBuilder('usr');
      const user: UserEntity = await queryBuilder
        .leftJoinAndSelect('usr.userPreferenceQuotation', 'upq')
        .where('usr.id = :id', { id: identity.id })
        .andWhere('usr.group = :groupId', { groupId: identity.org })
        .getRawOne();
      let userPreferenceQuotation = await this.userPreferenceQuotation.findOne({
        where: {
          usrId: user.id,
        },
      });

      if (!userPreferenceQuotation) {
        const userPreferenceQuotationNew: UserPreferenceQuotationEntity = {
          usrId: identity.id,
        };
        userPreferenceQuotation = await this.userPreferenceQuotation.save(
          userPreferenceQuotationNew,
        );
      }
      // Assuming payload.value is a number
      const valuePayload = `${payload.value}`;

      switch (payload.name) {
        case 'color':
          userPreferenceQuotation.color = `${payload.value}`;
        case 'placeOfManufacture':
          userPreferenceQuotation.placeOfManufacture = Number(payload.value);
        case 'placeOfManufactureLabel':
          userPreferenceQuotation.placeOfManufactureLabel = `${payload.value}`;
        case 'withSubcontracting':
          userPreferenceQuotation.withSubcontracting = Number(payload.value);
        case 'placeOfSubcontracting':
          userPreferenceQuotation.placeOfSubcontracting = Number(payload.value);
        case 'placeOfSubcontractingLabel':
          userPreferenceQuotation.placeOfSubcontractingLabel = `${payload.value}`;
        case 'displayOdontogram':
          let displayOdontogram: UserPreferenceQuotationDisplayOdontogramType;
          if (valuePayload === 'none') {
            displayOdontogram =
              UserPreferenceQuotationDisplayOdontogramType.NONE;
          } else if (valuePayload === 'both') {
            displayOdontogram =
              UserPreferenceQuotationDisplayOdontogramType.BOTH;
          } else if (valuePayload === 'three') {
            displayOdontogram =
              UserPreferenceQuotationDisplayOdontogramType.THREEE;
          } else {
            throw new CBadRequestException(
              'value not value: none, both or three',
            );
          }
          userPreferenceQuotation.displayOdontogram = displayOdontogram;
        case 'displayAnnexe':
          let displayAnnexe: UserPreferenceQuotationDisplayAnnexeType;
          if (valuePayload === 'none') {
            displayAnnexe = UserPreferenceQuotationDisplayAnnexeType.NONE;
          } else if (valuePayload === 'both') {
            displayAnnexe = UserPreferenceQuotationDisplayAnnexeType.BOTH;
          } else if (valuePayload === 'only') {
            displayAnnexe = UserPreferenceQuotationDisplayAnnexeType.ONLY;
          } else {
            throw new CBadRequestException(
              'value not value: none, both or only',
            );
          }
          userPreferenceQuotation.displayAnnexe = displayAnnexe;
        case 'displayNotice':
          userPreferenceQuotation.displayNotice = Number(payload.value);
        case 'displayTooltip':
          userPreferenceQuotation.displayTooltip = Number(payload.value);
        case 'displayDuplicata':
          userPreferenceQuotation.displayDuplicata = Number(payload.value);
        case 'treatment_timeline':
          userPreferenceQuotation.treatmentTimeline = Number(payload.value);
      }

      await this.userPreferenceQuotation.update(
        { id: userPreferenceQuotation.id },
        userPreferenceQuotation,
      );

      return {
        success: true,
      };
    } catch (error) {
      throw new CBadRequestException(error?.response?.msg || error?.sqlMessage);
    }
  }
}
