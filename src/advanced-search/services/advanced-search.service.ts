import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { SearchEntity } from 'src/entities/search.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AdvancedSearchRes } from '../res/advanced-seatch.res';
import { IInfomationSchemaColumn } from '../interface/advanced-search.interface';

@Injectable()
export class AdvanceSearchService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(SearchEntity)
    private readonly searchRepository: Repository<SearchEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async getFilterByName(name: string): Promise<AdvancedSearchRes[]> {
    const operators = {
      boolean: [
        {
          name: 'est égal(e) à',
          label: 'est égal(e) à',
          value: 'eq',
        },
      ],
      string: [
        {
          name: 'est égal(e) à',
          label: 'est égal(e) à',
          value: 'like',
        },
      ],
      text: [
        {
          name: 'est égal(e) à',
          label: 'est égal(e) à',
          value: 'like',
        },
      ],
      multiple: [
        {
          name: 'est égal(e) à',
          label: 'est égal(e) à',
          value: 'eq',
        },
      ],
      number: [
        {
          name: 'est supérieur(e) à',
          label: 'est supérieur(e) à',
          value: 'gte',
        },
        {
          name: 'est égal(e) à',
          label: 'est égal(e) à',
          value: 'eq',
        },
        {
          name: 'est inférieur(e) à',
          label: 'est inférieur(e) à',
          value: 'lte',
        },
      ],
      datetime: [
        {
          name: 'est compris entre',
          label: 'est compris entre',
          value: 'between',
        },
        {
          name: 'est supérieur(e) à',
          label: 'est supérieur(e) à',
          value: 'gte',
        },
        {
          name: 'est égal(e) à',
          label: 'est égal(e) à',
          value: 'eq',
        },
        {
          name: 'est inférieur(e) à',
          label: 'est inférieur(e) à',
          value: 'lte',
        },
      ],
      date: [
        {
          name: 'est compris entre',
          label: 'est compris entre',
          value: 'between',
        },
        {
          name: 'est supérieur(e) à',
          label: 'est supérieur(e) à',
          value: 'gte',
        },
        {
          name: 'est égal(e) à',
          label: 'est égal(e) à',
          value: 'eq',
        },
        {
          name: 'est inférieur(e) à',
          label: 'est inférieur(e) à',
          value: 'lte',
        },
      ],
    };

    const output: AdvancedSearchRes[] = [];
    const searchQuery = this.searchRepository.createQueryBuilder('sch');

    if (name) {
      searchQuery.where('sch.name = :name', { name });
    }

    searchQuery.orderBy('sch.pos');
    const searchCollection = await searchQuery.getMany();

    for (const searchEntity of searchCollection) {
      const searchColumnOperator = operators[searchEntity.columnType];
      const searchColumnValues = [];

      // Récupération des valeurs pour les champs de type "multiple"
      if (searchEntity.columnType === 'multiple') {
        const statement = await this.entityManager.query(
          `
          SELECT *
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = ?
            AND COLUMN_NAME = ?
        `,
          [
            this.dataSource.options.database,
            searchEntity.table,
            searchEntity.column,
          ],
        );

        const informationSchemaColumn: IInfomationSchemaColumn = statement[0];
        const informationSchemaColumnType = informationSchemaColumn.COLUMN_TYPE;
        const matches = informationSchemaColumnType.match(/enum\((.*)\)$/);
        if (matches) {
          const values = matches[1].split(',');
          for (let value of values) {
            value = value.trim().replace(/'/g, '');
            searchColumnValues.push(value);
          }
        }
      }

      const data = {
        id: searchEntity.id,
        field: searchEntity.columnName,
        name: searchEntity.columnLabel,
        type: searchEntity.columnType,
        op: searchColumnOperator,
        values: searchColumnValues,
      };

      output.push(data);
    }

    return output;
  }
}
