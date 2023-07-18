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
import { Repository } from 'typeorm';
import { SaveTeletranmistionDto } from '../dto/save-teletranmistion.dto';

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

    if (listeDateChangementEtat && listeDateChangementEtat.length > 0) {
      for (const details of listeDateChangementEtat) {
        let lot = await this.lotRepo.findOne({
          where: {
            externalReferenceId: payload.external_reference_id,
            organizationId: identity.org,
          },
        });
        const lotStatus = await this.lotStatusRepo.findOne({
          where: {
            value: parseInt(details?.cstatut ?? '0'),
          },
        });
        if (!lot) {
          const lotNew = this.lotRepo.create({
            organizationId: identity.org,
            finessNumber: teletransmission?.finessNumber,
            number: details?.numLot,
            mode: details?.typeSecuLot,
            creationDate: dayjs(details?.dateCrea).format('YYYY-MM-DD'),
            amount: parseFloat(details?.montantTotal),
            amountAmo: parseFloat(details?.montantAmo),
            amountAmc: parseFloat(details?.montantAmc),
            externalReferenceId: parseInt(details?.idLot ?? ''),
          });
          const rnm = details.rnm ?? null;
          if (rnm && rnm !== null) {
            const amcData = await this.amcRepo.findOne({
              where: {
                numero: rnm,
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

          const sendingDate = details?.sendingDate;
          if (sendingDate && sendingDate !== null) {
            lotNew.sendingDate = dayjs(sendingDate).format('YYYY-MM-DD');
          }
          lot = await this.lotRepo.save(lotNew);
          //
        } else {
          let canUpdate = false;
          if (lotStatus) {
            canUpdate = true;
            lot.lotStatusId = lotStatus.id;
          }
          const sendingDate = details?.sendingDate;
          if (sendingDate && sendingDate !== null) {
            canUpdate = true;
            lot.sendingDate = dayjs(sendingDate).format('YYYY-MM-DD');
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

    // @TODO
    // $organization = $container->get('app.repository.organization')->find($session->get('organization_id'));
    // $container->get('app.service.noemie')->process($client, $organization, $teletransmission->getFinessNumber());
    return teletransmission;
  }

  // async process() {}
}
