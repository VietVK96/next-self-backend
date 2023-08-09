import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';
import * as parser from 'ua-parser-js';
import { SesamvitaleTeletranmistionService } from 'src/caresheets/service/sesamvitale-teletranmistion.service';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { AmcEntity } from 'src/entities/amc.entity';
import { AmoEntity } from 'src/entities/amo.entity';
import { CaresheetStatusEntity } from 'src/entities/caresheet-status.entity';
import { FseEntity } from 'src/entities/fse.entity';
import { LotCareSheetEntity } from 'src/entities/lot-caresheet.entity';
import { LotStatusEntity } from 'src/entities/lot-status.entity';
import { LotEntity } from 'src/entities/lot.entity';
import { TeletransmissionEntity } from 'src/entities/teletransmission.entity';
import { UserEntity } from 'src/entities/user.entity';
import { Repository, DataSource, Not } from 'typeorm';
import { SaveTeletranmistionDto } from '../dto/save-teletranmistion.dto';
import { NomieService } from './nomie.service';
import { ConsulterUtlDto } from 'src/teletranmistion/dto/user-teletransmission.dto';
import { AccountStatusEnum } from 'src/enum/account-status.enum';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';

@Injectable()
export class TeletranmistionService {
  constructor(
    @InjectRepository(UserEntity)
    private repo: Repository<UserEntity>,
    @InjectRepository(TeletransmissionEntity)
    private teleRepo: Repository<TeletransmissionEntity>,
    @InjectRepository(CaresheetStatusEntity)
    private caresheetStatusRepo: Repository<CaresheetStatusEntity>,
    @InjectRepository(FseEntity)
    private fseRepo: Repository<FseEntity>,
    @InjectRepository(LotEntity)
    private lotRepo: Repository<LotEntity>,
    @InjectRepository(AmcEntity)
    private amcRepo: Repository<AmcEntity>,
    @InjectRepository(AmoEntity)
    private amoRepo: Repository<AmoEntity>,
    @InjectRepository(LotStatusEntity)
    private lotStatusRepo: Repository<LotStatusEntity>,
    @InjectRepository(LotCareSheetEntity)
    private lotCareSheetRepo: Repository<LotCareSheetEntity>,
    private sesamvitaleTeletranmistionService: SesamvitaleTeletranmistionService,
    private noemieService: NomieService,
    private dataSource: DataSource,
  ) {}

  async save(
    identity: UserIdentity,
    id: number,
    payload: SaveTeletranmistionDto,
    agent: string,
  ) {
    const user = await this.repo.findOne({
      where: {
        id,
      },
      relations: {
        medical: true,
      },
    });

    if (!user || !user.medical) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND_DOCTOR);
    }
    const mostRecentTeletransmission = await this.teleRepo.findOne({
      where: {
        finessNumber: user.medical.finessNumber,
      },
    });
    let teletransmission: TeletransmissionEntity = await this.teleRepo.findOne({
      where: {
        organizationId: identity.org,
        finessNumber: user.medical.finessNumber,
        externalReferenceId: payload.external_reference_id,
      },
    });
    if (teletransmission) {
      throw new CBadRequestException(ErrorCode.IS_HAVE_TELE_TRANMISTION);
    }

    const ua = parser(agent);

    const teletransmissionNew = this.teleRepo.create({
      organizationId: identity.org,
      finessNumber: user.medical.finessNumber,
      operatingSystem: `${ua?.os?.name} ${ua?.os?.version ?? ''}`,
      externalReferenceId: payload.external_reference_id,
    });
    teletransmission = await this.teleRepo.save(teletransmissionNew);
    const caresheetStatuses = await this.caresheetStatusRepo.find();
    const listeChangementEtatRes =
      await this.sesamvitaleTeletranmistionService.listeChangementEtat(
        payload.external_reference_id,
      );
    if (
      listeChangementEtatRes.teletrans &&
      listeChangementEtatRes.teletrans.idFacture
    ) {
      for (const idFacture of listeChangementEtatRes.teletrans.idFacture) {
        const consulterTeleTransResponse =
          await this.sesamvitaleTeletranmistionService.consulterTeleTrans(
            idFacture,
          );
        const update: {
          fseStatus?: number;
          dreStatus?: number;
        } = {};
        if (consulterTeleTransResponse.etatLotFse) {
          const fseStatus = caresheetStatuses.find(
            (c) => c.value === parseInt(consulterTeleTransResponse.etatLotFse),
          );
          if (fseStatus) {
            update.fseStatus = fseStatus.value;
          }
        }
        if (consulterTeleTransResponse.etatLotDre) {
          const dreStatus = caresheetStatuses.find(
            (c) => c.value === parseInt(consulterTeleTransResponse.etatLotDre),
          );
          if (dreStatus) {
            update.fseStatus = dreStatus.value;
          }
        }
        if (update.fseStatus || update.dreStatus) {
          await this.fseRepo.update(
            {
              externalReferenceId: payload.external_reference_id,
            },
            update,
          );
        }
      }
    }

    let startDate = dayjs();
    const endDate = dayjs().format('YYYYMMDD');
    if (mostRecentTeletransmission) {
      startDate = dayjs(mostRecentTeletransmission.createdAt);
    } else {
      const oldestCaresheet = await this.fseRepo.findOne({
        where: {
          numeroFacturation: teletransmission.finessNumber,
        },
        order: {
          date: 'ASC',
        },
      });
      if (oldestCaresheet) {
        startDate = dayjs(oldestCaresheet.date);
      }
    }

    const listeDateChangementEtat =
      await this.sesamvitaleTeletranmistionService.listeDateChangementEtat(
        teletransmission.finessNumber,
        startDate.format('YYYYMMDD'),
        endDate,
      );

    if (
      listeDateChangementEtat?.lot &&
      listeDateChangementEtat.lot.length > 0
    ) {
      for (const details of listeDateChangementEtat.lot) {
        let lot = await this.lotRepo.findOne({
          where: {
            externalReferenceId: parseInt(details?.idLot[0] ?? ''),
            organizationId: identity.org,
          },
        });
        const lotStatus = await this.lotStatusRepo.findOne({
          where: {
            value: parseInt(details?.cstatut[0] ?? '0'),
          },
        });
        if (!lot) {
          const lotNew = this.lotRepo.create({
            organizationId: identity.org,
            finessNumber: teletransmission?.finessNumber[0],
            number: details?.numLot[0] ?? '',
            mode: details?.typeSecuLot[0] ?? '',
            creationDate: dayjs(details?.dateCrea[0]._ ?? '').format(
              'YYYY-MM-DD',
            ),
            amount: parseFloat(details?.montantTotal[0] ?? ''),
            amountAmo: parseFloat(details?.montantAmo[0] ?? ''),
            amountAmc: parseFloat(details?.montantAmc[0] ?? ''),
            externalReferenceId: parseInt(details?.idLot[0] ?? ''),
          });
          const rnm = details.rnm ?? null;
          if (rnm && rnm !== null && rnm.length > 0) {
            const amcData = await this.amcRepo.findOne({
              where: {
                numero: rnm[0],
              },
            });
            if (amcData) {
              lotNew.amcId = amcData.id;
            }
          } else {
            const amoData = await this.amoRepo.findOne({
              where: {
                codeNational: `${details?.codeGrandRegime ?? ''}${
                  details?.codeCaisse ?? ''
                }${details?.codeCentre ?? ''}`,
              },
            });
            if (amoData) {
              lotNew.amoId = amoData.id;
            }
          }
          if (lotStatus) {
            lotNew.lotStatusId = lotStatus.id;
          }

          const sendingDate = details?.dateEnvoi;
          if (sendingDate && sendingDate !== null && sendingDate.length > 0) {
            lotNew.sendingDate = dayjs(sendingDate[0]._).format('YYYY-MM-DD');
          }
          lot = await this.lotRepo.save(lotNew);
          //
        } else {
          let canUpdate = false;
          if (lotStatus) {
            canUpdate = true;
            lot.lotStatusId = lotStatus.id;
          }
          const sendingDate = details?.dateEnvoi;
          if (sendingDate && sendingDate !== null && sendingDate.length > 0) {
            canUpdate = true;
            lot.sendingDate = dayjs(sendingDate[0]._).format('YYYY-MM-DD');
          }
          if (canUpdate) {
            await this.lotRepo.save(lot);
          }
        }

        if (
          details?.factures &&
          details?.factures?.idFacture &&
          details.factures?.idFacture.length > 0
        ) {
          for (const idFacture of details.factures.idFacture) {
            const caresheet = await this.fseRepo.findOne({
              where: {
                externalReferenceId: parseInt(idFacture),
              },
            });
            if (caresheet) {
              const lotCareSheet = this.lotCareSheetRepo.create({
                lotId: lot.id,
                caresheetId: caresheet.id,
              });
              await this.lotCareSheetRepo.save(lotCareSheet);
            }
          }
        }
      }
    }

    this.noemieService.process(identity.org, teletransmission.finessNumber);
    return teletransmission;
  }

  async getInterfaceageActivation(organizationId: number) {
    const users = await this.dataSource.getRepository(UserEntity).find({
      where: {
        client: Not(AccountStatusEnum.TERMINATED),
        organizationId,
      },
      relations: {
        medical: true,
        eventTypes: true,
        setting: true,
      },
      order: {
        lastname: 'ASC',
        firstname: 'ASC',
      },
    });

    const cards = [];
    const practioners = users
      .filter((x) => x.medical)
      .map((y) => {
        return {
          id: y?.id,
          lastname: y?.lastname,
          firstname: y?.firstname,
          medical: y?.medical,
        };
      });
    for (const user of practioners) {
      const listeCps =
        await this.sesamvitaleTeletranmistionService.consulterListeCps(
          user?.medical?.finessNumber,
        );
      const carteCps = listeCps?.carteCps;
      if (!carteCps) {
        continue;
      }
      cards.push(carteCps[0]);
    }

    return {
      practioners,
      cards,
    };
  }

  async postInterfaceageActivation(
    id: number,
    consulterUtlDto: ConsulterUtlDto,
  ) {
    const userList = consulterUtlDto?.user;
    for (const userItem of userList) {
      const user = await this.dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: userItem?.id }, relations: { medical: true } });
      const finessNumber = user?.medical?.finessNumber;
      const userDetail =
        await this.sesamvitaleTeletranmistionService.consulterUtlDetail(
          finessNumber,
          userItem?.medical?.nationalIdentifierNumber,
        );
      if (!userDetail?.utilisateur) {
        continue;
      }

      const statuses = userDetail?.utilisateur[0]?.statut;
      const statusesFiltered = statuses?.filter((status) => {
        return (
          status?.numFiness[0] === finessNumber &&
          status?.numIdtNat[0] === userItem.medical?.nationalIdentifierNumber
        );
      });

      if (statusesFiltered?.length === 0) {
        continue;
      }

      const specialtyCode = statusesFiltered[0]?.codeSpecialite[0];
      const medical = user?.medical;
      medical.lastName = userDetail?.utilisateur[0]?.nomPs[0] ?? '';
      medical.firstName = userDetail?.utilisateur[0].prenomPs[0] ?? '';
      medical.specialtyCodeId = Number(specialtyCode);
      medical.nationalIdentifierNumber =
        userItem?.medical?.nationalIdentifierNumber;

      return await this.dataSource
        .getRepository(UserMedicalEntity)
        .save(medical);
    }
  }
}
