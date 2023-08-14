import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TraceabilityEntity } from 'src/entities/traceability.entity';
import { Repository } from 'typeorm';
import { TraceabilitiesRequestDto } from '../dto/index.dto';
import { TraceabilitiesResponse } from '../res/traceabilities.response';

@Injectable()
export class TraceabilityService {
  constructor(
    @InjectRepository(TraceabilityEntity)
    private readonly traceabilityRepository: Repository<TraceabilityEntity>,
  ) {}

  escapeWildcard($string: string): string {
    return ($string + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
  }
  async getListTraceabilities(
    payload: TraceabilitiesRequestDto,
  ): Promise<TraceabilitiesResponse> {
    const { page, per_page, filterParam, filterValue } = payload;
    const _take = per_page || 50;
    const _skip = page ? (page - 1) * _take : 0;
    const queryBuilder = this.traceabilityRepository
      .createQueryBuilder('traceability')
      .select([
        'traceability.id',
        'traceability.reference',
        'traceability.observation',
      ])
      .addSelect(['act.id', 'act.date'])
      .addSelect(['patient.id', 'patient.lastname', 'patient.firstname'])
      .addSelect(['medicalDevice.id', 'medicalDevice.name'])
      .innerJoin('traceability.act', 'act')
      .innerJoin('act.patient', 'patient')
      .leftJoin('traceability.medicalDevice', 'medicalDevice');

    for (let index = 0; index < filterParam?.length; index++) {
      const _filterParam = filterParam[index];
      const _filterValue = filterValue[index];

      switch (_filterParam) {
        case 'traceability.reference':
          queryBuilder
            .andWhere('traceability.reference LIKE :reference')
            .setParameter(
              'reference',
              `%${this.escapeWildcard(_filterValue)}%`,
            );
          break;
        case 'traceability.observation':
          queryBuilder
            .andWhere('traceability.observation LIKE :observation')
            .setParameter(
              'observation',
              `%${this.escapeWildcard(_filterValue)}%`,
            );
          break;
        case 'medicalDevice.id':
          queryBuilder
            .andWhere('medicalDevice.id = :medicalDeviceId')
            .setParameter('medicalDeviceId', _filterValue);
          break;
        case 'act.date':
          const period = _filterValue.split(';');
          if (period[0]) {
            queryBuilder
              .andWhere('act.date >= :date1')
              .setParameter('date1', period[0]);
          }
          if (period[1]) {
            queryBuilder
              .andWhere('act.date <= :date2')
              .setParameter('date2', period[1]);
          }
          break;
      }
    }
    queryBuilder.orderBy('act.date', 'DESC').skip(_skip).take(_take);
    const results: [TraceabilityEntity[], number] =
      await queryBuilder.getManyAndCount();

    return {
      current_page_number: page || 1,
      num_items_per_page: _take,
      custom_parameters: { sorted: true },
      items: results[0],
      total_count: results[1],
      paginator_options: {
        defaultSortDirection: 'desc',
        defaultSortFieldName: 'act.date',
        distinct: false,
        filterFieldParameterName: 'filterParam',
        filterValueParameterName: 'filterValue',
        pageParameterName: 'page',
        sortDirectionParameterName: 'direction',
        sortFieldParameterName: 'sort',
      },
    };
  }
}
