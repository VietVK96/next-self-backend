import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { ErrorCode } from 'src/constants/error';
import { CcamEntity } from 'src/entities/ccam.entity';
import { LibraryActAssociationEntity } from 'src/entities/library-act-association.entity';
import { LibraryActFamilyEntity } from 'src/entities/library-act-family.entity';
import { LibraryActQuantityTariffEntity } from 'src/entities/library-act-quantity-tariff.entity';
import { LibraryActQuantityEntity } from 'src/entities/library-act-quantity.entity';
import {
  EnumLibraryActNomenclature,
  LibraryActEntity,
} from 'src/entities/library-act.entity';
import { LibraryOdontogramEntity } from 'src/entities/library-odontogram.entity';
import { MedicalDeviceEntity } from 'src/entities/medical-device.entity';
import { NgapKeyEntity } from 'src/entities/ngapKey.entity';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { TariffTypeEntity } from 'src/entities/tariff-type.entity';
import { TraceabilityEntity } from 'src/entities/traceability.entity';
import { DataSource, FindOptionsWhere, In, Like, Repository } from 'typeorm';
import {
  ActFamiliesDto,
  ActFamiliesSearchDto,
  ActFamiliesStoreDto,
  ActFamiliesUpdateDto,
} from '../dto/act-families.dto';
import { ActsStoreDto } from '../dto/library-act.store.dto';
import { ActsShowDto } from '../dto/library-act.show.dto';
import { LettersEntity } from 'src/entities/letters.entity';
import { LibraryActAttachmentPivotEntity } from 'src/entities/library-act-attachment-pivot.entity';
import { SuccessResponse } from 'src/common/response/success.res';
import { format, intervalToDuration } from 'date-fns';
import { LibraryActOdontogramPivotEntity } from 'src/entities/library-act-odontogram-pivot.entity';
import { checkId } from 'src/common/util/number';

@Injectable()
export class LibrariesService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(OrganizationEntity)
    private organizationRepo: Repository<OrganizationEntity>,
    @InjectRepository(CcamEntity)
    private ccamRepo: Repository<CcamEntity>,
    @InjectRepository(NgapKeyEntity)
    private ngapKeyRepo: Repository<NgapKeyEntity>,
    @InjectRepository(LibraryOdontogramEntity)
    private libraryOdontogramRepo: Repository<LibraryOdontogramEntity>,
    @InjectRepository(MedicalDeviceEntity)
    private medicalDeviceRepo: Repository<MedicalDeviceEntity>,
    @InjectRepository(LibraryActFamilyEntity)
    private libraryActFamilyRepo: Repository<LibraryActFamilyEntity>,
    @InjectRepository(LibraryActEntity)
    private libraryActRepo: Repository<LibraryActEntity>,
    @InjectRepository(TariffTypeEntity)
    private tariffTypeRepo: Repository<TariffTypeEntity>,
    @InjectRepository(LettersEntity)
    private lettersRepo: Repository<LettersEntity>,
    @InjectRepository(LibraryActQuantityEntity)
    private libraryActQuantityRepo: Repository<LibraryActQuantityEntity>,
    @InjectRepository(TraceabilityEntity)
    private libraryActTraceabilityRepo: Repository<TraceabilityEntity>,
    @InjectRepository(LibraryActAssociationEntity)
    private libraryActAssociationRepo: Repository<LibraryActAssociationEntity>,
    @InjectRepository(LibraryActAttachmentPivotEntity)
    private libraryActAttachmentPivotRepo: Repository<LibraryActAttachmentPivotEntity>,
    @InjectRepository(LibraryActOdontogramPivotEntity)
    private libraryActOdontogramPivotRepo: Repository<LibraryActOdontogramPivotEntity>,
  ) {}

  /**
   * php/libraries/act-families/index.php done
   *
   */
  async indexActFamily(
    request: ActFamiliesDto,
    identity: UserIdentity,
  ): Promise<LibraryActFamilyEntity[]> {
    const where: FindOptionsWhere<LibraryActFamilyEntity> = {
      organizationId: identity.org,
    };
    if (request.used_only) {
      where.used = 1;
    }
    return await this.libraryActFamilyRepo.find({
      where,
      order: {
        position: 'ASC',
      },
    });
  }

  /**
   * php/libraries/act-families/store.php done
   *
   */
  async storeActFamily(
    request: ActFamiliesStoreDto,
    identity: UserIdentity,
  ): Promise<any> {
    const libraryActFamily = {} as LibraryActFamilyEntity;
    libraryActFamily.label = request?.label;
    libraryActFamily.color = request?.color;
    libraryActFamily.used = +request?.used;
    const nextPosition = await this.dataSource
      .createQueryBuilder(LibraryActEntity, 'la')
      .select('la.position')
      .where('la.libraryActFamilyId = :id', { id: libraryActFamily?.id })
      .orderBy({
        'la.position': 'DESC',
      })
      .getRawOne();
    libraryActFamily.position = nextPosition?.la_position
      ? nextPosition?.la_position + 1
      : 0;

    return await this.libraryActFamilyRepo.save(libraryActFamily);
  }

  /**
   * php/libraries/act-families/update.php done
   *
   */
  async updateActFamily(id: number, req: ActFamiliesUpdateDto): Promise<any> {
    try {
      const libraryActFamily = await this.libraryActFamilyRepo.findOne({
        where: { id },
        relations: ['acts'],
      });
      libraryActFamily.label = req?.label;
      libraryActFamily.color = req?.color;
      libraryActFamily.used = +req?.used;
      libraryActFamily.position = req?.position;
      return await this.libraryActFamilyRepo.save({ id, ...libraryActFamily });
    } catch (err) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND_LIBRARY_ACT_FAMILY);
    }
  }

  /**
   * php/libraries/act-families/copy.php done
   *
   */
  async copyActFamily(id: number, identity: UserIdentity): Promise<any> {
    try {
      const libraryActFamily = await this.libraryActFamilyRepo.findOne({
        where: { id },
        relations: ['acts'],
      });
      if (libraryActFamily) {
        libraryActFamily.label = `(Copie) ${libraryActFamily?.label}`;
        if (libraryActFamily?.acts && libraryActFamily?.acts.length > 0) {
          const acts = [] as LibraryActEntity[];
          for (const act of libraryActFamily?.acts) {
            const libraryAct = await this.libraryActRepo.findOne({
              where: { id: act?.id },
              relations: ['family'],
            });
            delete act?.id;
            delete act?.family?.id;
            acts.push(libraryAct);
          }
          libraryActFamily.acts = acts;
        }
        return await this.libraryActFamilyRepo.save(libraryActFamily);
      }
    } catch (err) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND_LIBRARY_ACT_FAMILY);
    }
  }

  /**
   * php/libraries/act-families/acts/index.php 100%
   */
  async showActFamily(
    id: number,
    identity: UserIdentity,
  ): Promise<LibraryActFamilyEntity> {
    return await this.libraryActFamilyRepo.findOne({ where: { id } });
  }

  async searchActFamilies(
    identity: UserIdentity,
    params: ActFamiliesSearchDto,
  ) {
    if (!params?.serializer_groups) params.serializer_groups = [];

    return await this.libraryActRepo?.find({
      where: {
        organizationId: identity?.org,
        label: Like(`${params?.search_term}%`),
      },
      relations: params.serializer_groups,
    });
  }

  async deleteActFamily(id: number): Promise<SuccessResponse> {
    try {
      await this.libraryActFamilyRepo.softDelete(id);
      return { success: true };
    } catch (err) {
      throw new CBadRequestException(
        ErrorCode.CAN_NOT_DELETE_LIBRARY_ACT_FAMILIES,
      );
    }
  }

  async actsStore(identity: UserIdentity, params: ActsStoreDto) {
    const organization = await this.organizationRepo.findOne({
      relations: ['users'],
      where: {
        id: identity?.org,
      },
    });

    let libraryActFamily: LibraryActFamilyEntity = {};
    if (params && params?.family && params?.family?.id) {
      libraryActFamily = await this.libraryActFamilyRepo.findOne({
        where: {
          id: params?.family?.id,
        },
      });
    }
    if (!libraryActFamily) {
      throw new CNotFoundRequestException(
        ErrorCode.NOT_FOUND_LIBRARY_ACT_FAMILY,
      );
    }
    delete libraryActFamily?.organizationId;
    const libraryAct = {} as LibraryActEntity;
    libraryAct.organizationId = organization?.id;
    libraryAct.family = libraryActFamily;
    libraryAct.label = params?.label;
    libraryAct.observation = params?.observation;
    libraryAct.descriptiveText = params?.descriptive_text;
    const nextPosition = await this.dataSource
      .createQueryBuilder(LibraryActEntity, 'la')
      .select('la.position')
      .where('la.libraryActFamilyId = :id', { id: libraryActFamily?.id })
      .orderBy({
        'la.position': 'DESC',
      })
      .getRawOne();
    libraryAct.position = nextPosition?.la_position
      ? nextPosition?.la_position + 1
      : 0;
    const valueOf = Object.values(EnumLibraryActNomenclature) as string[];
    if (params?.nomenclature && valueOf.includes(params?.nomenclature)) {
      libraryAct.nomenclature =
        params.nomenclature as EnumLibraryActNomenclature;
    } else {
      libraryAct.nomenclature = EnumLibraryActNomenclature.CCAM;
    }
    libraryAct.materials = JSON.stringify(params?.materials ?? []);
    libraryAct.traceabilityActivated = +params?.traceability_activated;
    libraryAct.transmitted = +params?.transmitted;
    libraryAct.used = +params?.used;
    libraryAct.odontograms = [] as LibraryOdontogramEntity[];
    const odontograms = params?.odontograms ?? [];
    if (odontograms && odontograms.length > 0) {
      for (const odontogram of odontograms) {
        const libraryOdontogram = {} as LibraryOdontogramEntity;
        libraryOdontogram.organizationId = organization?.id;
        libraryOdontogram.color = odontogram?.color;
        libraryOdontogram.visibleCrown = +odontogram?.visible_crown;
        libraryOdontogram.visibleRoot = +odontogram?.visible_root;
        libraryOdontogram.visibleImplant = +odontogram?.visible_implant;
        libraryOdontogram.visibleAreas = JSON.stringify(
          odontogram?.visible_areas,
        );
        libraryOdontogram.invisibleAreas = JSON.stringify(
          odontogram?.invisible_areas,
        );
        libraryOdontogram.rankOfTooth = odontogram?.rank_of_tooth ?? 0;
        libraryOdontogram.internalReferenceId =
          odontogram?.internal_reference_id ?? null;
        libraryAct.odontograms.push(libraryOdontogram);
      }
    }

    const quantities = params?.quantities ?? [];
    if (quantities && quantities?.length > 0) {
      libraryAct.quantities = [];
      for (const quantity of quantities) {
        let ccam = null;
        const ccamId = quantity?.ccam?.id ?? null;
        if (ccamId) {
          ccam = await this.ccamRepo.findOne({ where: { id: ccamId } });
          if (!ccam) throw new CBadRequestException(ErrorCode.NOT_FOUND_CCAM);
        }

        let ngapKey = null;
        const ngapKeyId = quantity?.ngapKey?.id;
        if (ngapKeyId) {
          ngapKey = await this.ngapKeyRepo.findOne({
            where: { id: ngapKeyId },
          });
          if (!ngapKey)
            throw new CBadRequestException(ErrorCode.NOT_FOUND_CCAM);
        }

        const libraryActQuantity: LibraryActQuantityEntity = {};
        libraryActQuantity.organizationId = organization?.id;
        libraryActQuantity.ccam = ccam;
        libraryActQuantity.ngapKey = ngapKey;
        libraryActQuantity.label = quantity?.label;
        libraryActQuantity.observation = quantity?.observation;
        libraryActQuantity.descriptiveText = quantity?.descriptive_text;
        libraryActQuantity.numberOfTeeth = quantity?.number_of_teeth;
        libraryActQuantity.amount = quantity?.amount;
        libraryActQuantity.coefficient = quantity?.coefficient;
        libraryActQuantity.exceeding = quantity?.exceeding;
        libraryActQuantity.duration = quantity?.duration
          ? quantity?.duration.toString()
          : '00:00:00';
        libraryActQuantity.buyingPrice = quantity?.buying_price;
        libraryActQuantity.materials = quantity?.materials;
        libraryActQuantity.traceabilityActivated =
          quantity?.traceability_activated;
        libraryActQuantity.traceabilityMerged = quantity?.traceability_merged;
        libraryActQuantity.transmitted = quantity?.transmitted;
        libraryActQuantity.used = quantity?.used;
        libraryActQuantity.odontograms = [];
        const odontograms = quantity?.odontograms;
        if (odontograms && odontograms?.length > 0) {
          for (const odontogram of odontograms) {
            const libraryOdontogram = {} as LibraryOdontogramEntity;
            libraryOdontogram.organizationId = organization?.id;
            libraryOdontogram.color = odontogram?.color;
            libraryOdontogram.visibleCrown = +odontogram?.visible_crown;
            libraryOdontogram.visibleRoot = +odontogram?.visible_root;
            libraryOdontogram.visibleImplant = +odontogram?.visible_implant;
            libraryOdontogram.visibleAreas = JSON.stringify(
              odontogram?.visible_areas,
            );
            libraryOdontogram.invisibleAreas = JSON.stringify(
              odontogram?.invisible_areas,
            );
            libraryOdontogram.rankOfTooth = odontogram?.rank_of_tooth ?? 0;
            libraryOdontogram.internalReferenceId =
              odontogram?.internal_reference_id ?? null;
            libraryActQuantity.odontograms.push(libraryOdontogram);
          }
        }

        const traceabilities = quantity?.traceabilities.filter(
          (traceability) =>
            traceability?.medical_device_id ||
            traceability?.reference ||
            traceability?.observation,
        );
        if (traceabilities && traceabilities?.length > 0) {
          libraryActQuantity.traceabilities = [];
          for (const traceability of traceabilities) {
            let medicalDevice = null;
            const medicalDeviceId = traceability?.medical_device_id ?? null;
            if (medicalDeviceId) {
              medicalDevice = await this.medicalDeviceRepo.findOne({
                where: { id: medicalDeviceId },
              });
            }
            const libraryActQuantityTraceability = {} as TraceabilityEntity;
            libraryActQuantityTraceability.libraryActQuantityId =
              libraryActQuantity?.id;
            libraryActQuantityTraceability.organizationId = organization?.id;
            libraryActQuantityTraceability.medicalDevice = medicalDevice;
            libraryActQuantityTraceability.reference = traceability?.reference;
            libraryActQuantityTraceability.observation =
              traceability?.observation;
            libraryActQuantity.traceabilities.push(
              libraryActQuantityTraceability,
            );
          }
        }

        const tariffs = quantity?.tariffs ?? [];
        if (tariffs && tariffs?.length > 0) {
          for (const tariff of tariffs) {
            if (tariff?.tariff) {
              const libraryActQuantityTariff =
                {} as LibraryActQuantityTariffEntity;
              libraryActQuantityTariff.tariffType = tariff?.tariff_type;
              libraryActQuantityTariff.tariff = tariff?.tariff;
              libraryActQuantity.tariffs.push(libraryActQuantityTariff);
            }
          }
        }
        libraryAct.quantities.push(libraryActQuantity);
      }
    }

    const associations = params?.associations ?? [];
    if (associations && associations?.length > 0) {
      libraryAct.associations = [];
      for (const association of associations) {
        const id = association?.child?.id;
        const child = await this.libraryActRepo.findOne({ where: { id } });
        if (!id || !child) {
          throw new CBadRequestException(ErrorCode.NOT_FOUND_LIBRARY_ACT);
        }
        const libraryActAssociation = {} as LibraryActAssociationEntity;
        libraryActAssociation.libraryActParentId = libraryAct?.id;
        libraryActAssociation.libraryActChildId = child?.id;
        libraryActAssociation.position = association?.position;
        libraryActAssociation.automatic = association?.automatic;
        libraryAct.associations.push(libraryActAssociation);
      }
    }
    let traceabilities = params?.traceabilities ?? [];
    traceabilities = traceabilities.filter(
      (traceability) =>
        traceability?.medical_device_id ||
        traceability?.reference ||
        traceability?.observation,
    );
    for (const traceability of traceabilities) {
      libraryAct.traceabilities = [];
      let medicalDevice: MedicalDeviceEntity = null;
      const medicalDeviceId = params?.medical_device_id;
      if (medicalDeviceId) {
        medicalDevice = await this.medicalDeviceRepo.findOne({
          where: { id: medicalDeviceId },
        });
      }
      const libraryActTraceability = {} as TraceabilityEntity;
      libraryActTraceability.organizationId = organization?.id;
      libraryActTraceability.medicalDeviceId = medicalDevice?.id;
      libraryActTraceability.reference = traceability?.reference;
      libraryActTraceability.observation = traceability?.observation;
      libraryAct.traceabilities.push(libraryActTraceability);
    }

    const attachments = params?.attachments ?? [];
    if (attachments && attachments?.length > 0) {
      const mails = await this.lettersRepo.find({
        where: {
          id: In(params?.attachments.map((attachment) => attachment?.id)),
        },
      });
      libraryAct.attachments = mails;
    }
    return await this.libraryActRepo.save(libraryAct);
  }

  //ecoophp/php/libraries/acts/update.php
  async actsUpdate(id: number, identity: UserIdentity, params: ActsStoreDto) {
    try {
      {
        const libraryAct: LibraryActEntity = await this.libraryActRepo.findOne({
          where: { id: checkId(id) || 0 },
          relations: {
            odontograms: true,
            quantities: true,
          },
        });
        if (!libraryAct) {
          throw new CBadRequestException(ErrorCode.NOT_FOUND_LIBRARY_ACT);
        }
        const libraryActFamily = await this.libraryActFamilyRepo.findOne({
          where: { id: params?.family?.id },
        });
        if (!libraryActFamily) {
          throw new CBadRequestException(
            ErrorCode.NOT_FOUND_LIBRARY_ACT_FAMILY,
          );
        }
        libraryAct.family = libraryActFamily;
        libraryAct.label = params?.label;
        libraryAct.observation = params?.observation;
        libraryAct.descriptiveText = params?.descriptive_text;
        libraryAct.position = params?.position;
        libraryAct.nomenclature = params?.nomenclature;
        libraryAct.materials = JSON.stringify(params?.materials);
        libraryAct.traceabilityActivated = +params?.traceability_activated;
        libraryAct.used = +params?.used;
        const laoPromises = libraryAct?.odontograms?.map((odontogram) =>
          this.libraryOdontogramRepo.delete(odontogram?.id),
        );
        await Promise.all(laoPromises);
        libraryAct.odontograms = [];

        const organization = await this.organizationRepo.findOne({
          relations: ['users'],
          where: {
            id: identity?.org,
          },
        });

        const odontograms = params?.odontograms ?? [];
        if (odontograms && odontograms.length > 0) {
          for (const odontogram of odontograms) {
            const libraryOdontogram = {} as LibraryOdontogramEntity;
            libraryOdontogram.organizationId = organization?.id;
            libraryOdontogram.color = JSON.stringify(odontogram?.color);
            libraryOdontogram.visibleCrown = +odontogram?.visible_crown;
            libraryOdontogram.visibleRoot = +odontogram?.visible_root;
            libraryOdontogram.visibleImplant = +odontogram?.visible_implant;
            libraryOdontogram.visibleAreas = JSON.stringify(
              odontogram?.visible_areas,
            );
            libraryOdontogram.invisibleAreas = JSON.stringify(
              odontogram?.invisible_areas,
            );
            libraryOdontogram.rankOfTooth = odontogram?.rank_of_tooth ?? 0;
            libraryOdontogram.internalReferenceId =
              odontogram?.internal_reference_id ?? null;
            libraryAct.odontograms.push(libraryOdontogram);
          }
        }

        const laqIds = libraryAct?.quantities?.map((quantity) => quantity?.id);
        await this.libraryActQuantityRepo.softDelete({ id: In(laqIds) });
        libraryAct.quantities = [];

        const quantities = params?.quantities ?? [];
        if (quantities && quantities?.length > 0) {
          for (const quantity of quantities) {
            const quantityById = await this.libraryActQuantityRepo.findOne({
              where: { id },
            });
            const libraryActQuantity = {} as LibraryActQuantityEntity;
            if (!id || !quantityById) {
              libraryActQuantity.organizationId = organization?.id;
              libraryActQuantity.organization = organization;
            }

            const ccam = null;
            const ccamId = quantity?.ccam?.id ?? null;
            if (ccamId) {
              const ccam = await this.ccamRepo.findOne({
                where: { id: ccamId },
              });
              if (!ccam)
                throw new CBadRequestException(ErrorCode.NOT_FOUND_CCAM);
            }

            const ngapKey = null;
            const ngapKeyId = quantity?.ngapKey?.id;
            if (ngapKeyId) {
              const ngapKey = await this.ngapKeyRepo.findOne({
                where: { id: ngapKeyId },
              });
              if (!ngapKey)
                throw new CBadRequestException(ErrorCode.NOT_FOUND_NGAP_KEY);
            }
            function convertMaterial(materials: any) {
              if (Array.isArray(materials)) {
                return materials.length ? materials.join(',') : null;
              }
              return materials?.length ? materials : null;
            }

            libraryActQuantity.organization = organization;
            libraryActQuantity.ccam = ccam;
            libraryActQuantity.ngapKey = ngapKey;
            libraryActQuantity.label = quantity?.label;
            libraryActQuantity.observation = quantity?.observation;
            libraryActQuantity.descriptiveText = quantity?.descriptive_text;
            libraryActQuantity.numberOfTeeth = quantity?.number_of_teeth;
            libraryActQuantity.amount = quantity?.amount;
            libraryActQuantity.coefficient = quantity?.coefficient;
            libraryActQuantity.exceeding = quantity?.exceeding;
            libraryActQuantity.duration = quantity?.duration;
            libraryActQuantity.buyingPrice = quantity?.buying_price;
            libraryActQuantity.materials = convertMaterial(quantity?.materials);
            libraryActQuantity.traceabilityActivated =
              +quantity?.traceability_activated;
            libraryActQuantity.traceabilityMerged =
              +quantity?.traceability_merged;
            libraryActQuantity.transmitted = +quantity?.transmitted;
            libraryActQuantity.used = +quantity?.used;
            const odontograms = quantity?.odontograms;
            const odontogramIds = odontograms.map((e) => e.id);
            if (odontogramIds?.length) {
              await this.libraryOdontogramRepo.softDelete({
                id: In(odontogramIds),
              });
            }

            libraryActQuantity.odontograms = [];
            if (odontograms && odontograms?.length > 0) {
              for (const odontogram of odontograms) {
                const libraryOdontogram = {} as LibraryOdontogramEntity;
                const odontogramById = await this.libraryOdontogramRepo.findOne(
                  {
                    where: { id: odontogram?.id },
                  },
                );
                if (!odontogramById || !odontogram?.id) {
                  libraryOdontogram.organizationId = organization?.id;
                  libraryOdontogram.organization = organization;
                }
                libraryOdontogram.color = odontogram?.color;
                libraryOdontogram.visibleCrown = odontogram?.visible_crown;
                libraryOdontogram.visibleRoot = odontogram?.visible_root;
                libraryOdontogram.visibleImplant = odontogram?.visible_implant;
                libraryOdontogram.visibleAreas = odontogram?.visible_areas;
                libraryOdontogram.invisibleAreas = odontogram?.invisible_areas;
                libraryOdontogram.rankOfTooth = odontogram?.rank_of_tooth;
                libraryActQuantity.odontograms.push(libraryOdontogram);
              }
            }

            const latIds = libraryActQuantity.traceabilities?.map(
              (quantity) => quantity?.id,
            );
            if (latIds?.length) {
              await this.libraryActTraceabilityRepo.softDelete({
                id: In(latIds),
              });
            }
            libraryAct.traceabilities = [];
            const traceabilities = quantity?.traceabilities.filter(
              (traceability) =>
                traceability?.medical_device_id ||
                traceability?.reference ||
                traceability?.observation,
            );
            if (traceabilities && traceabilities?.length > 0) {
              for (const traceability of traceabilities) {
                let medicalDevice = null;
                const medicalDeviceId = traceability?.medical_device_id ?? null;
                if (medicalDeviceId) {
                  medicalDevice = await this.medicalDeviceRepo.findOne({
                    where: { id: medicalDeviceId },
                  });
                }
                const libraryActQuantityTraceability: TraceabilityEntity = {};
                libraryActQuantityTraceability.organizationId =
                  organization?.id;
                libraryActQuantityTraceability.organization = organization;
                libraryActQuantityTraceability.medicalDevice = medicalDevice;
                libraryActQuantityTraceability.reference =
                  traceability?.reference;
                libraryActQuantityTraceability.observation =
                  traceability?.observation;
                libraryActQuantity.traceabilities.push(
                  libraryActQuantityTraceability,
                );
              }
            }

            const tariffs =
              quantity?.tariffs.filter((tariff) => tariff?.tariff) ?? [];
            if (quantity?.tariffs && quantity?.tariffs.length > 0) {
              libraryActQuantity.tariffs.forEach(
                (libraryActQuantityTariff, index) => {
                  if (
                    tariffs.filter(
                      (tariff) =>
                        tariff?.tariffType?.id ===
                        libraryActQuantityTariff?.tariffType?.id,
                    ).length === 0
                  ) {
                    delete libraryActQuantity.tariffs[index];
                  }
                },
              );
              for (const tariff of tariffs) {
                const tariffType = await this.tariffTypeRepo.findOne({
                  where: { id: tariff?.tariff_type?.id },
                });
                if (
                  !libraryActQuantity.tariffs.find(
                    (libraryActQuantityTariff) => {
                      libraryActQuantityTariff.tariffType === tariffType;
                    },
                  )
                ) {
                  const libraryActQuantityTariff: LibraryActQuantityTariffEntity =
                    {};
                  libraryActQuantityTariff.tariffType = tariff?.tariff_type;
                  libraryActQuantityTariff.tariff = tariff?.tariff;
                  libraryActQuantity.tariffs.push(tariff?.tariff);
                }
              }
            }
            libraryAct.quantities.push(libraryActQuantity);
          }
        }
        const libraryActParentIds =
          libraryAct.associations?.map((e) => e.libraryActParentId) || [];
        const libraryActChildIds =
          libraryAct.associations?.map((e) => e.libraryActChildId) || [];
        if (libraryActChildIds.length || libraryActParentIds.length) {
          await this.libraryActAssociationRepo.softDelete({
            libraryActParentId: In(libraryActParentIds),
            libraryActChildId: In(libraryActChildIds),
          });
        }
        libraryAct.associations = [];
        const associations = params?.associations ?? [];
        if (associations && associations?.length > 0) {
          for (const association of associations) {
            const id = association?.child?.id;
            const child = await this.libraryActRepo.findOne({ where: { id } });
            if (!id || !child) {
              throw new CBadRequestException(
                ErrorCode.NOT_FOUND_LIBRARY_ACT_ASSOCIATION,
              );
            }
            const libraryActAssociation: LibraryActAssociationEntity =
              await this.libraryActAssociationRepo.findOne({
                where: {
                  libraryActParentId: libraryAct?.id,
                  libraryActChildId: child?.id,
                },
              });
            if (libraryActAssociation) {
              libraryActAssociation.child = child;
            }
            libraryActAssociation.position = association?.position;
            libraryActAssociation.automatic = association?.automatic;
            libraryActAssociation.deletedAt = null;
            libraryAct.associations.push(libraryActAssociation);
          }
        }

        const latIds =
          libraryAct.traceabilities?.map((traceability) => traceability?.id) ||
          [];
        if (laqIds.length) {
          await this.libraryActTraceabilityRepo.delete({ id: In(latIds) });
        }
        const traceabilities =
          params?.traceabilities.filter(
            (traceability) =>
              traceability?.medical_device_id ||
              traceability?.reference ||
              traceability?.observation,
          ) ?? [];
        for (const traceability of traceabilities) {
          let medicalDevice: MedicalDeviceEntity = null;
          const medicalDeviceId = params?.medical_device_id;
          if (medicalDeviceId) {
            medicalDevice = await this.medicalDeviceRepo.findOne({
              where: { id: medicalDeviceId },
            });
          }
          const libraryActTraceability: TraceabilityEntity = {};
          libraryActTraceability.organizationId = organization?.id;
          libraryActTraceability.organization = organization;
          libraryActTraceability.medicalDevice = medicalDevice;
          libraryActTraceability.reference = traceability?.reference;
          libraryActTraceability.observation = traceability?.observation;
          libraryAct.traceabilities.push(libraryActTraceability);
        }

        const mailIds =
          libraryAct.attachments?.map((attachment) => attachment?.id) || [];
        await this.libraryActAttachmentPivotRepo.delete({
          mailId: In(mailIds),
        });
        libraryAct.attachments = [];

        const attachments = params?.attachments ?? [];
        if (attachments && attachments?.length > 0) {
          const mails = await this.lettersRepo.find({
            where: {
              id: In(params?.attachments.map((attachment) => attachment?.id)),
            },
          });
          libraryAct.attachments = mails;
        }
        return await this.libraryActRepo.save({ id, ...libraryAct });
      }
    } catch (error) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
  }

  async actsDelete(id: number): Promise<SuccessResponse> {
    try {
      await this.libraryActRepo.softDelete(id);
      return { success: true };
    } catch (err) {
      throw new CBadRequestException(ErrorCode.CAN_NOT_DELETE_LIBRARY_ACT);
    }
  }

  async actsCopy(id: number, identity: UserIdentity): Promise<any> {
    try {
      const queryBuilder = this.dataSource
        .createQueryBuilder(LibraryActEntity, 'la')
        .leftJoinAndSelect('la.quantities', 'laq')
        .leftJoinAndSelect('laq.ccam', 'laqccam')
        .leftJoinAndSelect('laqccam.unitPrices', 'laqccamup')
        .leftJoinAndSelect('laqccam.family', 'laqccamf')
        .leftJoinAndSelect('la.family', 'laf')
        .leftJoinAndSelect('la.odontograms', 'lao')
        .leftJoinAndSelect('la.associations', 'laa')
        .leftJoinAndSelect('laa.child', 'laac')
        .leftJoinAndSelect('la.complementaries', 'lac')
        .leftJoinAndSelect('la.attachments', 'laat')
        .leftJoinAndSelect('la.traceabilities', 'lat')
        .leftJoinAndSelect('lat.medicalDevice', 'latm')
        .where('la.id = :id', { id });

      const organization = await this.organizationRepo.findOne({
        where: {
          id: identity?.org,
        },
      });

      const libraryActCurrent = await queryBuilder.getOne();
      let libraryActFamily: LibraryActFamilyEntity = {};
      if (
        libraryActCurrent &&
        libraryActCurrent?.family &&
        libraryActCurrent?.family?.id
      ) {
        libraryActFamily = await this.libraryActFamilyRepo.findOne({
          where: {
            id: libraryActCurrent?.family?.id,
          },
        });
      }
      if (!libraryActFamily) {
        throw new CNotFoundRequestException(
          ErrorCode.NOT_FOUND_LIBRARY_ACT_FAMILY,
        );
      }
      const libraryAct = {} as LibraryActEntity;
      libraryAct.organizationId = organization?.id;
      libraryAct.family = libraryActCurrent?.family;
      libraryAct.label = `(Copie) ${libraryActCurrent?.label ?? ''}`;
      libraryAct.observation = libraryActCurrent?.observation;
      libraryAct.descriptiveText = libraryActCurrent?.descriptiveText;
      const nextPosition = await this.dataSource
        .createQueryBuilder(LibraryActEntity, 'la')
        .select('la.position')
        .where('la.libraryActFamilyId = :id', { id: libraryActFamily?.id })
        .orderBy({
          'la.position': 'DESC',
        })
        .getRawOne();
      libraryAct.position = nextPosition?.la_position
        ? nextPosition?.la_position + 1
        : 0;
      const valueOf = Object.values(EnumLibraryActNomenclature) as string[];
      if (
        libraryActCurrent?.nomenclature &&
        valueOf.includes(libraryActCurrent?.nomenclature)
      ) {
        libraryAct.nomenclature =
          libraryActCurrent.nomenclature as EnumLibraryActNomenclature;
      } else {
        libraryAct.nomenclature = EnumLibraryActNomenclature.CCAM;
      }
      libraryAct.materials = JSON.stringify(libraryActCurrent?.materials ?? []);
      libraryAct.traceabilityActivated =
        +libraryActCurrent?.traceabilityActivated;
      libraryAct.transmitted = +libraryActCurrent?.transmitted;
      libraryAct.used = +libraryActCurrent?.used;
      libraryAct.odontograms = [] as LibraryOdontogramEntity[];

      const odontograms = libraryActCurrent?.odontograms ?? [];
      if (odontograms && odontograms.length > 0) {
        for (const odontogram of odontograms) {
          const libraryOdontogram = {} as LibraryOdontogramEntity;
          libraryOdontogram.organizationId = organization?.id;
          libraryOdontogram.color = odontogram?.color;
          libraryOdontogram.visibleCrown = +odontogram?.visibleCrown;
          libraryOdontogram.visibleRoot = +odontogram?.visibleRoot;
          libraryOdontogram.visibleImplant = +odontogram?.visibleImplant;
          libraryOdontogram.visibleAreas = JSON.stringify(
            odontogram?.visibleAreas,
          );
          libraryOdontogram.invisibleAreas = JSON.stringify(
            odontogram?.invisibleAreas,
          );
          libraryOdontogram.rankOfTooth = odontogram?.rankOfTooth ?? 0;
          // libraryOdontogram.internalReferenceId = odontogram?.internalReferenceId ?? null;
          libraryAct.odontograms.push(libraryOdontogram);
        }
      }
      const quantities = libraryActCurrent?.quantities ?? [];
      if (quantities && quantities?.length > 0) {
        libraryAct.quantities = [];
        for (const quantity of quantities) {
          let ccam = null;
          const ccamId = quantity?.ccam?.id ?? null;
          if (ccamId) {
            ccam = await this.ccamRepo.findOne({ where: { id: ccamId } });
            if (!ccam) throw new CBadRequestException(ErrorCode.NOT_FOUND_CCAM);
          }

          let ngapKey = null;
          const ngapKeyId = quantity?.ngapKey?.id;
          if (ngapKeyId) {
            ngapKey = await this.ngapKeyRepo.findOne({
              where: { id: ngapKeyId },
            });
            if (!ngapKey)
              throw new CBadRequestException(ErrorCode.NOT_FOUND_CCAM);
          }
          const libraryActQuantity: LibraryActQuantityEntity = {};
          libraryActQuantity.organizationId = organization?.id;
          libraryActQuantity.ccam = ccam;
          libraryActQuantity.ngapKey = ngapKey;
          libraryActQuantity.label = quantity?.label;
          libraryActQuantity.observation = quantity?.observation;
          libraryActQuantity.descriptiveText = quantity?.descriptiveText;
          libraryActQuantity.numberOfTeeth = quantity?.numberOfTeeth;
          libraryActQuantity.amount = quantity?.amount;
          libraryActQuantity.coefficient = quantity?.coefficient;
          libraryActQuantity.exceeding = quantity?.exceeding;
          libraryActQuantity.duration = quantity?.duration
            ? quantity?.duration.toString()
            : '00:00:00';
          libraryActQuantity.buyingPrice = quantity?.buyingPrice;
          libraryActQuantity.materials = quantity?.materials;
          libraryActQuantity.traceabilityActivated =
            quantity?.traceabilityActivated;
          libraryActQuantity.traceabilityMerged = quantity?.traceabilityMerged;
          libraryActQuantity.transmitted = quantity?.transmitted;
          libraryActQuantity.used = quantity?.used;
          libraryActQuantity.odontograms = [];
          const odontograms = quantity?.odontograms ?? [];
          if (odontograms && odontograms?.length > 0) {
            for (const odontogram of odontograms) {
              const libraryOdontogram = {} as LibraryOdontogramEntity;
              libraryOdontogram.organizationId = organization?.id;
              libraryOdontogram.color = odontogram?.color;
              libraryOdontogram.visibleCrown = +odontogram?.visibleCrown;
              libraryOdontogram.visibleRoot = +odontogram?.visibleRoot;
              libraryOdontogram.visibleImplant = +odontogram?.visibleImplant;
              libraryOdontogram.visibleAreas = JSON.stringify(
                odontogram?.visibleAreas,
              );
              libraryOdontogram.invisibleAreas = JSON.stringify(
                odontogram?.invisibleAreas,
              );
              libraryOdontogram.rankOfTooth = odontogram?.rankOfTooth ?? 0;
              // libraryOdontogram.internalReferenceId = odontogram?.internalReferenceId ?? null;
              libraryActQuantity.odontograms.push(libraryOdontogram);
            }
          }

          if (
            quantity?.traceabilities &&
            quantity?.traceabilities?.length > 0
          ) {
            const traceabilities = quantity?.traceabilities.filter(
              (traceability) =>
                traceability?.medicalDeviceId ||
                traceability?.reference ||
                traceability?.observation,
            );
            libraryActQuantity.traceabilities = [];
            for (const traceability of traceabilities) {
              let medicalDevice = null;
              const medicalDeviceId = traceability?.medicalDeviceId ?? null;
              if (medicalDeviceId) {
                medicalDevice = await this.medicalDeviceRepo.findOne({
                  where: { id: medicalDeviceId },
                });
              }
              const libraryActQuantityTraceability = {} as TraceabilityEntity;
              libraryActQuantityTraceability.libraryActQuantityId =
                libraryActQuantity?.id;
              libraryActQuantityTraceability.organizationId = organization?.id;
              libraryActQuantityTraceability.medicalDevice = medicalDevice;
              libraryActQuantityTraceability.reference =
                traceability?.reference;
              libraryActQuantityTraceability.observation =
                traceability?.observation;
              libraryActQuantity.traceabilities.push(
                libraryActQuantityTraceability,
              );
            }
          }

          const tariffs = quantity?.tariffs ?? [];
          if (tariffs && tariffs?.length > 0) {
            for (const tariff of tariffs) {
              if (tariff?.tariff) {
                const libraryActQuantityTariff =
                  {} as LibraryActQuantityTariffEntity;
                libraryActQuantityTariff.tariffType = tariff?.tariffType;
                libraryActQuantityTariff.tariff = tariff?.tariff;
                libraryActQuantity.tariffs.push(libraryActQuantityTariff);
              }
            }
          }
          libraryAct.quantities.push(libraryActQuantity);
        }
      }
      const associations = libraryActCurrent?.associations ?? [];
      if (associations && associations?.length > 0) {
        libraryAct.associations = [];
        for (const association of associations) {
          const id = association?.child?.id;
          const child = await this.libraryActRepo.findOne({ where: { id } });
          if (!id || !child) {
            throw new CBadRequestException(ErrorCode.NOT_FOUND_LIBRARY_ACT);
          }
          const libraryActAssociation = {} as LibraryActAssociationEntity;
          libraryActAssociation.libraryActParentId = libraryAct?.id;
          libraryActAssociation.libraryActChildId = child?.id;
          libraryActAssociation.position = association?.position;
          libraryActAssociation.automatic = association?.automatic;
          libraryAct.associations.push(libraryActAssociation);
        }
      }
      let traceabilities = libraryActCurrent?.traceabilities ?? [];
      if (traceabilities && traceabilities.length > 0) {
        traceabilities = traceabilities.filter(
          (traceability) =>
            traceability?.medicalDeviceId ||
            traceability?.reference ||
            traceability?.observation,
        );
        for (const traceability of traceabilities) {
          libraryAct.traceabilities = [];
          let medicalDevice: MedicalDeviceEntity = null;
          const medicalDeviceId = traceability?.medicalDeviceId;
          if (medicalDeviceId) {
            medicalDevice = await this.medicalDeviceRepo.findOne({
              where: { id: medicalDeviceId },
            });
          }
          const libraryActTraceability = {} as TraceabilityEntity;
          libraryActTraceability.organizationId = organization?.id;
          libraryActTraceability.medicalDeviceId = medicalDevice?.id;
          libraryActTraceability.reference = traceability?.reference;
          libraryActTraceability.observation = traceability?.observation;
          libraryAct.traceabilities.push(libraryActTraceability);
        }
      }
      const attachments = libraryActCurrent?.attachments ?? [];
      if (attachments && attachments?.length > 0) {
        const mails = await this.lettersRepo.find({
          where: {
            id: In(
              libraryActCurrent?.attachments.map(
                (attachment) => attachment?.id,
              ),
            ),
          },
        });
        libraryAct.attachments = mails;
      }
      return await this.libraryActRepo.save(libraryAct);
    } catch (err) {
      throw new CBadRequestException(ErrorCode.CAN_NOT_COPY_LIBRARY_ACT);
    }
  }

  async actsShow(params: ActsShowDto): Promise<any> {
    try {
      const id = params?.id;
      const queryBuilder = this.dataSource
        .createQueryBuilder(LibraryActEntity, 'la')
        .leftJoinAndSelect('la.quantities', 'laq')
        .leftJoinAndSelect('laq.ccam', 'laqccam')
        .leftJoinAndSelect('laqccam.unitPrices', 'laqccamup')
        .leftJoinAndSelect('laqccam.family', 'laqccamf')
        .leftJoinAndSelect('la.family', 'laf')
        .leftJoinAndSelect('la.odontograms', 'lao')
        .leftJoinAndSelect('la.associations', 'laa')
        .leftJoinAndSelect('laa.child', 'laac')
        .leftJoinAndSelect('la.complementaries', 'lac')
        .leftJoinAndSelect('la.attachments', 'laat')
        .leftJoinAndSelect('la.traceabilities', 'lat')
        .leftJoinAndSelect('lat.medicalDevice', 'latm')
        .where('la.id = :id', { id });
      if (params?.used_only) {
        queryBuilder.andWhere('laq.used = :used', { used: true });
      }
      const libraryAct = await queryBuilder.getOne();
      return libraryAct;
    } catch (err) {
      console.log(err?.message);
      throw new CBadRequestException(ErrorCode.NOT_FOUND_LIBRARY_ACT);
    }
  }
}
