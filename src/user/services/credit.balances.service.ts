import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { CreditBalancesDto } from '../dto/credit-balances.dto';
import { BordereauxIndexRes } from 'src/bordereaux/response/bordereaux.res';

@Injectable()
export class CreditBalancesService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(ContactUserEntity)
    private contactUserRepository: Repository<ContactUserEntity>,
  ) {}

  /**
   * File : php/user/credit-balances/index.php 100%
   * @param payload
   * @returns
   */
  async getPatientBalances(
    payload: CreditBalancesDto,
  ): Promise<BordereauxIndexRes> {
    const { id, page, per_page } = payload;

    const filterParams: string[] = Array.isArray(payload?.filterParams)
      ? payload?.filterParams
      : [payload?.filterParams] || [];
    const filterValues: string[] = Array.isArray(payload?.filterValues)
      ? payload?.filterValues
      : [payload?.filterValues] || [];
    try {
      const user: UserEntity = await this.userRepository.findOne({
        where: { id: id },
      });

      if (!user) {
        throw new CBadRequestException(ErrorCode.NOT_FOUND_DOCTOR);
      }

      const queryBuilder: SelectQueryBuilder<ContactUserEntity> =
        this.contactUserRepository.createQueryBuilder('patientBalance');
      queryBuilder.leftJoinAndSelect('patientBalance.patient', 'patient');
      queryBuilder.where('patientBalance.usr_id = :usr_id', { usr_id: id });
      queryBuilder.andWhere('patientBalance.amount < 0');

      filterParams.map((filterParam, index) => {
        const filterValue = filterValues[index];
        switch (filterParam) {
          case 'patientBalance.amount':
            queryBuilder.andWhere('patientBalance.amount <= :amount', {
              amount: filterValue,
            });
            break;
          case 'patientBalance.visitDate':
            const period = filterValue.split(';');
            if (period[0]) {
              queryBuilder.andWhere('patientBalance.lastCare >= :visitDate1', {
                visitDate1: period[0],
              });
            }
            if (period[1]) {
              queryBuilder.andWhere('patientBalance.lastCare <= :visitDate2', {
                visitDate2: period[1],
              });
            }
            break;
          default:
            break;
        }
      });
      const pagination: ContactUserEntity[] = await queryBuilder
        .select()
        .getMany();

      const offSet = (page - 1) * per_page;
      const dataPaging: ContactUserEntity[] = pagination.slice(
        offSet,
        offSet + per_page,
      );
      const data = {
        current_page_number: page,
        custom_parameters: { sorted: true },
        extra: { total_amount: pagination.length },
        items: dataPaging,
        num_item_per_page: per_page,
        paginator_options: {
          pageParameterName: 'page',
          sortFieldParameterName: 'sort',
          sortDirectionParameterName: 'direction',
          filterFieldParameterName: 'filterParam',
          filterValueParameterName: 'filterValue',
          distinct: false,
          defaultSortFieldName: 'patientBalance.visitDate',
          defaultSortDirection: 'desc',
        },
        range: 5,
        total_count: dataPaging?.length,
      };

      return data;
    } catch (e) {
      throw new CBadRequestException(ErrorCode.QUERY_REPOSITORY_ERROR);
    }
  }
}
