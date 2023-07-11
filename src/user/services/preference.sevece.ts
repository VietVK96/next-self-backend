import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UpdatePreferenceDto } from '../dto/therapeutic.dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { UserEntity } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { UserPreferenceQuotationDisplayOdontogramType } from 'src/entities/user-preference-quotation.entity';

@Injectable()
export class PreferenceService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserPreferenceEntity)
    private userPreferenceRepository: Repository<UserPreferenceEntity>,
  ) {}

  async pacth(payload: UpdatePreferenceDto) {
    const dsad = payload?.value;
    try {
      switch (payload?.name) {
        case 'quotationDisplayOdontogram': {
          await this.userPreferenceRepository.save({
            usrId: payload.user,
            quotationDisplayOdontogram: payload.value,
          } as UserPreferenceEntity);
          break;
        }
        case 'quotationDisplayDetails': {
          await this.userPreferenceRepository.save({
            usrId: payload.user,
            quotationDisplayDetails: payload.value,
          } as UserPreferenceEntity);
          break;
        }
        case 'quotationDisplayTooltip': {
          await this.userPreferenceRepository.save({
            usrId: payload.user,
            quotationDisplayTooltip: payload.value,
          } as UserPreferenceEntity);
          break;
        }
        case 'quotationDisplayDuplicata': {
          await this.userPreferenceRepository.save({
            usrId: payload.user,
            quotationDisplayDuplicata: payload.value,
          } as UserPreferenceEntity);
          break;
        }
        case 'quotationColor': {
          await this.userPreferenceRepository.save({
            usrId: payload.user,
            quotationColor: payload.value,
          } as UserPreferenceEntity);
          break;
        }
        case 'billDisplayTooltip': {
          await this.userPreferenceRepository.save({
            usrId: payload.user,
            billDisplayTooltip: payload.value,
          } as UserPreferenceEntity);
          break;
        }
        case 'billTemplate': {
          await this.userPreferenceRepository.save({
            usrId: payload.user,
            billTemplate: payload.value,
          } as UserPreferenceEntity);
          break;
        }
        case 'orderDisplayTooltip': {
          await this.userPreferenceRepository.save({
            usrId: payload.user,
            orderDisplayTooltip: payload.value,
          } as UserPreferenceEntity);
          break;
        }
        case 'orderDuplicata': {
          return await this.userPreferenceRepository.save({
            usrId: payload.user,
            orderDuplicata: payload.value,
          } as UserPreferenceEntity);
          break;
        }
        case 'orderPreprintedHeader': {
          await this.userPreferenceRepository.save({
            usrId: payload.user,
            orderPreprintedHeader: payload.value,
          } as UserPreferenceEntity);
          break;
        }
        case 'orderPreprintedHeaderSize': {
          let size;
          if (payload?.value === null) {
            size = 35;
          }
          size = payload?.value;
          await this.userPreferenceRepository.save({
            usrId: payload.user,
            orderPreprintedHeaderSize: size,
          } as UserPreferenceEntity);
          break;
        }
        case 'orderFormat': {
          await this.userPreferenceRepository.save({
            usrId: payload.user,
            orderFormat: payload.value,
          } as UserPreferenceEntity);
          break;
        }
        case 'orderBcbCheck': {
          await this.userPreferenceRepository.save({
            usrId: payload.user,
            orderBcbCheck: payload.value,
          } as UserPreferenceEntity);
          break;
        }
        case 'ccamBridgeQuickentry': {
          await this.userPreferenceRepository.save({
            usrId: payload.user,
            ccamBridgeQuickentry: payload.value,
          } as UserPreferenceEntity);
          break;
        }
      }
    } catch {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }
}
