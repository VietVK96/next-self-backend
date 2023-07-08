import { Injectable } from '@nestjs/common';
import { Connection, DataSource } from 'typeorm';
import { CreateUpdateMemoDto } from '../dto/createUpdate.memo.dto';
import { MemoRes } from '../response/memo.res';
import { ResourceEntity } from 'src/entities/resource.entity';
import { MemoEntity } from 'src/entities/memo.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';

@Injectable()
export class MemoService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly connection: Connection,
  ) {}

  async create(payload: CreateUpdateMemoDto): Promise<MemoRes> {
    if (payload.message === null) {
      throw new CBadRequestException(ErrorCode.FRESH_TOKEN_WRONG);
    }
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const createMemo = await queryRunner.manager.query(
        `INSERT INTO T_MEMO_MEM(resource_id, MEM_DATE, MEM_MSG) VALUES (?,?,?)`,
        [Number(payload.resourceId), payload.date, payload.message],
      );

      const resource = await queryRunner.manager
        .createQueryBuilder()
        .select('id, name,color,use_default_color')
        .from(ResourceEntity, 'RES')
        .where('id = :resource_id', { resource_id: payload.resourceId })
        .getRawOne();
      const { ...restPayload } = payload;
      const result: MemoRes = {
        id: createMemo.insertId,
        ...restPayload,
        resource,
      };
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new CBadRequestException(ErrorCode.FRESH_TOKEN_WRONG);
    } finally {
      await queryRunner.release();
    }
  }

  async show(id: number): Promise<MemoRes> {
    try {
      const memo = await this.dataSource
        .createQueryBuilder()
        .select(
          `MEM_ID as id, MEM_DATE as date, MEM_MSG as message, resource_id as resourceId`,
        )
        .from(MemoEntity, 'MEM')
        .where('MEM_ID = :id', { id })
        .getRawOne();

      if (!memo) {
        throw new CBadRequestException(ErrorCode.FRESH_TOKEN_WRONG);
      }

      const resource = await this.dataSource
        .createQueryBuilder()
        .select('id, name, color, use_default_color')
        .from(ResourceEntity, 'RES')
        .where('id = :resource_id', { resource_id: memo.resourceId })
        .getRawOne();

      const { ...restMemo } = memo;
      const result: MemoRes = {
        ...restMemo,
        resource,
      };

      return result;
    } catch (error) {
      throw new CBadRequestException(ErrorCode.FRESH_TOKEN_WRONG);
    }
  }

  async delete(id: number) {
    try {
      const result = await this.dataSource.query(
        'delete from T_MEMO_MEM where MEM_ID = ?',
        [id],
      );
      if (result.affectedRows === 0)
        throw new Error(
          'No result was found for query although at least one row was expected.',
        );
      return {};
    } catch (error) {
      throw new CBadRequestException(ErrorCode.FRESH_TOKEN_WRONG);
    }
  }

  async update(id: number, payload: MemoRes) {
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const memo = await queryRunner.manager
        .createQueryBuilder()
        .update(MemoEntity)
        .set({ date: payload.date, message: payload.message })
        .where('id = :id', { id })
        .execute();

      if (memo.affected === 0)
        throw new CBadRequestException(ErrorCode.FRESH_TOKEN_WRONG);

      await queryRunner.commitTransaction();
      const result = {
        id,
        ...payload,
      };
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new CBadRequestException(ErrorCode.FRESH_TOKEN_WRONG);
    } finally {
      await queryRunner.release();
    }
  }
}
