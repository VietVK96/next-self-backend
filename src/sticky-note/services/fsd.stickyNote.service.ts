import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { checkEmpty } from 'src/common/util/string';
import { ErrorCode } from 'src/constants/error';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { StickyNoteEntity } from 'src/entities/sticky-note.entity';
import { DataSource, Repository } from 'typeorm';
import { StoreOrgFsdDto } from '../dto/store.org.fsd.dto';
import { StoreCommunicationFsdDto } from '../dto/store.comunication.fsd.dto';

@Injectable()
export class FsdSticktNoteService {
  constructor(
    @InjectRepository(StickyNoteEntity)
    private stickyNoteRepo: Repository<StickyNoteEntity>,
    private dataSource: DataSource,
  ) {}

  async storeStickyOrgFsd(payload: StoreOrgFsdDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log(payload);
      if (!payload || checkEmpty(payload?.organization_id))
        return new CBadRequestException(ErrorCode.NOT_HAVE_ORGANIZATION);
      const organization_id = payload.organization_id;

      const organization = await this.dataSource
        .getRepository(OrganizationEntity)
        .findOne({ where: { id: organization_id } });
      if (checkEmpty(organization))
        return new CBadRequestException(ErrorCode.NOT_FOUND_ORGANIZATION);

      const statements: { PTT_ID: number }[] = await queryRunner.query(
        `
          SELECT T_POSTIT_PTT.PTT_ID
            FROM T_POSTIT_PTT
          JOIN T_USER_USR
          WHERE T_POSTIT_PTT.USR_ID = T_USER_USR.USR_ID
            AND T_USER_USR.organization_id = ?
      `,
        [organization?.id],
      );

      const promiseArr = [];
      for (const statement of statements) {
        promiseArr.push(
          queryRunner.query(
            `
        INSERT INTO T_POSTIT_USER_PTU (PTT_ID, USR_ID)
        SELECT ?, T_USER_USR.USR_ID
        FROM T_USER_USR
        WHERE T_USER_USR.organization_id = ?
          AND NOT EXISTS (
            SELECT *
            FROM T_POSTIT_USER_PTU
            WHERE T_POSTIT_USER_PTU.PTT_ID = ?
              AND T_POSTIT_USER_PTU.USR_ID = T_USER_USR.USR_ID
          )
        `,
            [statement.PTT_ID, organization?.id, statement.PTT_ID],
          ),
        );
      }
      const totalBatch = Math.ceil(promiseArr.length / 100);
      for (let i = 0; i < totalBatch; i++) {
        const batch = promiseArr.splice(0, 100);
        await Promise.all(batch);
      }

      await queryRunner.commitTransaction();
      return {
        msg: 'Les post-its ont bien été copiés',
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      return new CBadRequestException(ErrorCode.FORBIDDEN);
    } finally {
      await queryRunner.release();
    }
  }

  async storeCommunicationFsd({
    color,
    width,
    height,
    content,
  }: StoreCommunicationFsdDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      content = content ? content.trim() : '';
      if (checkEmpty(content))
        return new CBadRequestException('Le champ message est obligatoire.');

      const stickNote: StickyNoteEntity = {};
    } catch (e) {
      await queryRunner.rollbackTransaction();
      return new CBadRequestException(ErrorCode.FORBIDDEN);
    } finally {
      await queryRunner.release();
    }
  }
}
