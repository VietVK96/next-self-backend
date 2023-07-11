import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Like, Repository } from 'typeorm';
import { TagDto } from '../dto/index.dto';
import { TagEntity } from 'src/entities/tag.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(TagEntity)
    private tagRepository: Repository<TagEntity>,
  ) {}

  async getTags(payload: TagDto) {
    try {
      const { per_page, query } = payload;
      let page = payload?.page || 1;
      if (page < 0) {
        page = 1;
      }

      const [items, total] = await this.tagRepository.findAndCount({
        where: query ? { title: Like(`%${query}%`) } : undefined,
        skip: (page - 1) * per_page,
        take: per_page,
        order: {
          title: 'ASC',
        },
      });

      const data = {
        current_page_number: page,
        custom_parameters: { sorted: true },
        items: items,
        num_item_per_page: per_page,
        paginator_options: {
          pageParameterName: 'page',
          sortFieldParameterName: 'sort',
          sortDirectionParameterName: 'direction',
          filterFieldParameterName: 'filterParam',
          filterValueParameterName: 'filterValue',
          distinct: true,
        },
        range: 5,
        total_count: total,
      };
      return data;
    } catch (e) {
      throw new CBadRequestException('cannot get tags');
    }
  }
}
