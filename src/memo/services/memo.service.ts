import {
  Injectable,
  UnprocessableEntityException,
  HttpStatus,
} from '@nestjs/common';
import { Connection, DataSource } from 'typeorm';
import { CreateUpdateMemoDto } from '../dto/createUpdate.memo.dto';
import { MemoRes } from '../response/memo.res';
import { ResourceEntity } from 'src/entities/resource.entity';
import { MemoEntity } from 'src/entities/memo.entity';

@Injectable()
export class MemoService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly connection: Connection,
  ) {}

  async create(payload: CreateUpdateMemoDto): Promise<CreateUpdateMemoDto> {
    if (payload.message === null) {
      throw new UnprocessableEntityException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'This value should not be blank.',
      );
    }
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const createMemo = await queryRunner.manager.query(
        `INSERT INTO T_MEMO_MEM(resource_id, MEM_DATE, MEM_MSG) VALUES (?,?,?)`,
        [Number(payload.resourceId), payload.date, payload.message],
      );
      await queryRunner.commitTransaction();
      const resource = await queryRunner.manager
        .createQueryBuilder()
        .select('id, name,color,use_default_color')
        .from(ResourceEntity, 'RES')
        .where('id = :resource_id', { resource_id: payload.resourceId })
        .getRawOne();
      const { resourceId, ...restPayload } = payload;
      const result: MemoRes = {
        id: createMemo.insertId,
        ...restPayload,
        resource,
      };
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async show(id: number): Promise<CreateUpdateMemoDto> {
    const memo = await this.dataSource
      .createQueryBuilder()
      .select(
        `MEM_ID as id, MEM_DATE as date, MEM_MSG as message,resource_id as resourceId`,
      )
      .from(MemoEntity, 'MEM')
      .where('MEM_ID = :id', { id })
      .getRawOne();

    const resource = await this.dataSource
      .createQueryBuilder()
      .select('id, name,color,use_default_color')
      .from(ResourceEntity, 'RES')
      .where('id = :resource_id', { resource_id: memo.resourceId })
      .getRawOne();
    const { resourceId, ...restMemo } = memo;
    const result: MemoRes = {
      ...restMemo,
      resource,
    };
    return result;
  }
}
