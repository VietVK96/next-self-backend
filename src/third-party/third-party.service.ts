import { ContactEntity } from 'src/entities/contact.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ThirdPartyDto } from './dto/index.dto';
import { UserEntity } from 'src/entities/user.entity';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { AmoEntity } from 'src/entities/amo.entity';
import { AmcEntity } from 'src/entities/amc.entity';
import { FseEntity } from 'src/entities/fse.entity';
import { UserThirdPartyRes } from './response/index.res';
import { format } from 'date-fns';

@Injectable()
export class ThirdPartyService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(ContactEntity)
    private patientRepository: Repository<ContactEntity>,
    @InjectRepository(ThirdPartyAmcEntity)
    private thirdPartyAmcRepository: Repository<ThirdPartyAmcEntity>,
    @InjectRepository(ThirdPartyAmoEntity)
    private thirdPartyAmoRepository: Repository<ThirdPartyAmoEntity>,
    @InjectRepository(AmoEntity)
    private amoRepository: Repository<AmoEntity>,
    @InjectRepository(AmcEntity)
    private amcRepository: Repository<AmcEntity>,
  ) {}
  /**
   * File: php/third-party/index.php
   * Line: 18 -> 108
   */
  async getPatientThirdParty(payload: ThirdPartyDto) {
    const { user_id, direction, page, per_page, sort } = payload;
    const filterParam: string[] = Array.isArray(payload?.filterParam)
      ? payload?.filterParam
      : [payload?.filterParam] || [];
    const filterValue: string[] = Array.isArray(payload?.filterValue)
      ? payload?.filterValue
      : [payload?.filterValue] || [];
    const user = await this.userRepository.findOne({ where: { id: user_id } });
    if (!user) {
      throw new CNotFoundRequestException('User Not Found');
    }
    const sortParam =
      sort === 'caresheet.creationDate' ? 'caresheet.date' : 'caresheet.nbr';
    const patients = await this.patientRepository.find({
      select: ['id', 'lastname', 'firstname'],
    });
    const thirdPartyAmcs = await this.thirdPartyAmcRepository.find({
      select: ['id', 'status', 'caresheetId', 'amcId'],
    });
    const amcs = await this.amcRepository.find({
      select: ['id', 'libelle', 'numero'],
    });
    const thirdPartyAmos = await this.thirdPartyAmoRepository.find({
      select: ['id', 'status', 'caresheetId', 'amoId'],
    });
    const amos = await this.amoRepository.find({
      select: ['id', 'libelle', 'codeNational'],
    });
    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select(
        `
    caresheet.id as id,
    caresheet.conId as conId,
    caresheet.tiersPayantStatus as tiersPayantStatus,
    caresheet.amount as amount,
    caresheet.thirdPartyAmount as thirdPartyAmount,
    caresheet.thirdPartyAmountPaid as thirdPartyAmountPaid,
    caresheet.date as date,
    caresheet.nbr as nbr
    `,
      )
      .from(FseEntity, 'caresheet')
      .innerJoin(ContactEntity, 'patient', 'caresheet.conId = patient.id')
      .andWhere('caresheet.usrId = :usrId', { usrId: user.id })
      .andWhere('caresheet.tiersPayant = true');

    filterParam.forEach((param, index) => {
      const valueParam = filterValue[index];
      switch (param) {
        case 'caresheet.creationDate':
          queryBuilder.andWhere('caresheet.FSE_DATE = :creationDate', {
            creationDate: valueParam,
          });
          break;
        case 'caresheet.number':
          queryBuilder.andWhere('caresheet.number = LPAD(:number, 9, 0)', {
            number: valueParam,
          });
          break;
        case 'caresheet.tiersPayantStatus':
          queryBuilder.andWhere(
            'caresheet.tiersPayantStatus = :tiersPayantStatus',
            { tiersPayantStatus: valueParam },
          );
          break;
        case 'amo.libelle':
          queryBuilder.innerJoin(
            ThirdPartyAmoEntity,
            'thirdPartyAmo',
            'thirdPartyAmo.caresheetId = caresheet.id',
          );
          queryBuilder.innerJoin(
            AmoEntity,
            'amo',
            'thirdPartyAmo.amoId = amo.id',
          );
          queryBuilder.andWhere('amo.libelle LIKE :amoLibelle', {
            amoLibelle: `${valueParam}%`,
          });
          break;
        case 'amc.libelle':
          queryBuilder.innerJoin(
            ThirdPartyAmcEntity,
            'thirdPartyAmc',
            'thirdPartyAmc.caresheetId = caresheet.id',
          );
          queryBuilder.innerJoin(
            AmcEntity,
            'amc',
            'thirdPartyAmc.amcId = amc.id',
          );
          queryBuilder.andWhere('amc.libelle LIKE :amcLibelle', {
            amcLibelle: `${valueParam}%`,
          });
          break;
      }
    });
    const queryResult: FseEntity[] = await queryBuilder
      .orderBy(
        sortParam,
        direction?.toLocaleLowerCase() === 'asc' ? 'ASC' : 'DESC',
      )
      .getRawMany();
    const patientThirdParties = queryResult.map((item: FseEntity) => {
      const res: UserThirdPartyRes = {
        id: item?.id,
        amount: item?.amount,
        creation_date: item?.date
          ? format(new Date(item?.date), 'yyyy-MM-dd')
          : '',
        third_party_amount: item?.thirdPartyAmount,
        third_party_amount_paid: item?.thirdPartyAmountPaid,
        tiers_payant_status: item?.tiersPayantStatus,
        number: item?.nbr,
      };
      const patientRes = patients.find((p) => p?.id === item?.conId);
      if (patientRes) {
        res.patient = {
          id: patientRes?.id,
          full_name: `${patientRes?.lastname} ${patientRes?.firstname}`,
        };
      }
      const thirdPartyAmc = thirdPartyAmcs.find(
        (tpamc) => tpamc?.caresheetId === item?.id,
      );
      if (thirdPartyAmc && thirdPartyAmc?.amcId) {
        const amc = amcs.find((a) => a?.id === thirdPartyAmc?.amcId);
        res.third_party_amc = {
          id: thirdPartyAmc?.id,
          status: thirdPartyAmc?.status,
          amc,
        };
      }
      const thirdPartyAmo = thirdPartyAmos.find(
        (tpamo) => tpamo?.caresheetId === item?.id,
      );
      if (thirdPartyAmo && thirdPartyAmo?.amoId) {
        const amo = amos.find((a) => a?.id === thirdPartyAmo?.amoId);
        res.third_party_amo = {
          id: thirdPartyAmo?.id,
          status: thirdPartyAmo?.status,
          amo: {
            id: amo?.id,
            libelle: amo?.libelle,
            code_national: amo?.codeNational,
          },
        };
      }
      return res;
    });
    const offSet = (page - 1) * per_page;
    const dataPaging = patientThirdParties.slice(offSet, offSet + per_page);
    const data = {
      current_page_number: page,
      custom_parameters: { sorted: true },
      items: dataPaging,
      num_item_per_page: per_page,
      paginator_options: {
        defaultSortDirection: 'desc',
        defaultSortFieldName: 'caresheet.creationDate+caresheet.number',
        distinct: false,
        filterFieldParameterName: 'filterParam',
        filterValueParameterName: 'filterValue',
        pageParameterName: 'page',
        sortDirectionParameterName: 'direction',
        sortFieldParameterName: 'sort',
      },
      range: 5,
      total_count: dataPaging?.length,
    };
    return data;
  }
}
