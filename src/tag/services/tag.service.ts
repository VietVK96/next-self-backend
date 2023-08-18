import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DataSource, Like, Repository } from 'typeorm';
import { CreateUpdateTagDto, TagDto } from '../dto/index.dto';
import { TagEntity } from 'src/entities/tag.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { ErrorCode } from 'src/constants/error';
import { SuccessResponse } from 'src/common/response/success.res';

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
    @InjectRepository(OrganizationEntity)
    private organizationRepository: Repository<OrganizationEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getTags(identity: UserIdentity, payload: TagDto) {
    try {
      const { per_page, query } = payload;
      let page = payload?.page || 1;
      if (page < 0) {
        page = 1;
      }

      const [items, total] = await this.tagRepository.findAndCount({
        where: query
          ? { organizationId: identity.org, title: Like(`%${query}%`) }
          : { organizationId: identity.org },
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

  async store(groupId: number, title: string) {
    try {
      const obj = { background: '#e0e0e0', foreground: '#343a40' };

      const newTags = await this.dataSource.query(
        `INSERT INTO tag (organization_id, title, color) VALUES (?,?,?) `,
        [groupId, title, JSON.stringify(obj)],
      );
      return await this.tagRepository.findOne({
        where: { id: newTags.insertId },
      });
    } catch {
      throw new CBadRequestException('title has already exist');
    }
  }

  async getAllTagsByOrganization(organization_id: number) {
    const getOrganization = await this.organizationRepository.findOne({
      where: { id: organization_id },
      relations: { tags: true },
    });
    const resultTags = getOrganization.tags.map((item) => {
      return {
        id: item.id,
        title: item.title,
        color: item.color,
        internalReference: item.internalReference,
        organizationId: item.organizationId,
      };
    });
    return resultTags;
  }

  async createUpdateTag(organization_id: number, payload: CreateUpdateTagDto) {
    let currentTag: TagEntity;
    if (payload?.id) {
      currentTag = await this.tagRepository.findOne({
        where: { id: payload?.id },
      });
      if (!currentTag) throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
    const color = {
      background: payload?.color?.background ?? '#e0e0e0',
      foreground: payload?.color?.foreground ?? '#000000',
    };
    const checkTitle = await this.tagRepository.findOne({
      where: { title: payload?.title, organizationId: organization_id },
    });
    if (checkTitle) {
      throw new CBadRequestException(ErrorCode.TAG_TITLE_ALREADY_USED);
    }
    const newTag: TagEntity = {
      ...currentTag,
      title: payload.title,
      color: color,
      organizationId: organization_id,
    };
    return await this.tagRepository.save(newTag);
  }

  async deleteTag(id: number): Promise<SuccessResponse> {
    const currentTag = await this.tagRepository.findOne({
      where: { id },
    });
    if (!currentTag) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
    await this.tagRepository.remove(currentTag);
    return {
      success: true,
    };
  }
}
