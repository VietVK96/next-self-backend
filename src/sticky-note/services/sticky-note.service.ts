import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { SaveStickNoteDto } from '../dto/save.sticky-note.dto';
import { StickyNoteRes } from '../response/sticky-note.res';
import { InjectRepository } from '@nestjs/typeorm';
import { StickyNoteEntity } from 'src/entities/sticky-note.entity';

@Injectable()
export class StickyNoteService {
  constructor(
    @InjectRepository(StickyNoteEntity)
    private stickyNoteRepo: Repository<StickyNoteEntity>,
    private dataSource: DataSource,
  ) {}

  // File: php\stickyNote\delete.php 23-38
  async delete(stickyNoteId: number, userId: number) {
    const patient = await this.stickyNoteRepo.findOneBy({ id: stickyNoteId });
    if (patient['CON_ID']) {
      await this.dataSource.query(
        `DELETE FROM T_POSTIT_PTT WHERE PTT_ID = ${stickyNoteId}`,
      );
    } else {
      await this.dataSource.query(
        `DELETE FROM T_POSTIT_USER_PTU WHERE PTT_ID = ${stickyNoteId} AND USR_ID = ${userId}`,
      );
    }
    return {};
  }

  // File: php\stickyNote\findAll.php 26-49
  async findAll(contactId: number, userId: number): Promise<StickyNoteRes[]> {
    const qr = `SELECT PTT.PTT_ID id,
                    PTT.PTT_MSG msg,
                    PTT.PTT_COLOR color,
                    PTT.PTT_EDITABLE editable,
                    IF (PTT.PTT_SHARED = 1 OR PTT.USR_ID = ${userId}, 1, 0) shareable,
                    PTT.PTT_SHARED shared,
                    DATE_FORMAT(PTT.created_at, '%Y-%m-%dT%TZ') AS createdOn,
                    PTU.PTU_WIDTH width,
                    PTU.PTU_HEIGHT height,
                    PTU.PTU_X "left",
                    PTU.PTU_Y top
                FROM T_POSTIT_PTT PTT
                JOIN T_POSTIT_USER_PTU PTU ON PTU.PTT_ID = PTT.PTT_ID
                WHERE PTU.USR_ID = ${userId} AND PTT.CON_ID ${
      contactId ? ` = ${contactId}` : ' IS NULL'
    }`;
    const result = await this.dataSource.query(qr);
    // convert shareable to number
    return result.map((item) => {
      return { ...item, shareable: Number(item.shareable) } as StickyNoteRes;
    });
  }

  // File: php\stickyNote\save.php 23-166
  async save(
    reqBody: SaveStickNoteDto,
    userId: number,
    groupId: number,
  ): Promise<StickyNoteRes | any> {
    let insertedId: number = null;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (reqBody?.id) {
        const stickyNoteRow = await queryRunner.query(
          `SELECT USR_ID, PTT_SHARED
                FROM T_POSTIT_PTT 
                WHERE PTT_ID = ${reqBody.id}
          `,
        );
        if (stickyNoteRow.length === 0) {
          throw new Error('You cannot modify this sticky note');
        }
        const qr1 = `UPDATE T_POSTIT_PTT
                    SET ${reqBody.msg ? `PTT_MSG = "${reqBody.msg}",` : ''}
                        PTT_COLOR = ${reqBody.color},
                        PTT_SHARED = ${reqBody.shared}
                    WHERE PTT_ID = ${reqBody.id}`;
        await queryRunner.query(qr1);

        const parameters = [reqBody.id, userId, reqBody.width, reqBody.height];
        parameters.push(Math.max(0, reqBody.left));
        parameters.push(Math.max(0, reqBody.top));
        const qr2 = `INSERT INTO T_POSTIT_USER_PTU (PTT_ID, USR_ID, PTU_WIDTH, PTU_HEIGHT, PTU_X, PTU_Y)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE PTU_WIDTH = VALUES(PTU_WIDTH),
                                            PTU_HEIGHT = VALUES(PTU_HEIGHT),
                                            PTU_X = VALUES(PTU_X),
                                            PTU_Y = VALUES(PTU_Y)`;
        await queryRunner.query(qr2, parameters);

        const stickyNote = stickyNoteRow[0];
        if (userId === stickyNote['USR_ID']) {
          if (Boolean(stickyNote['PTT_SHARED']) && !reqBody.shared) {
            const qr3 = `DELETE FROM T_POSTIT_USER_PTU
                        WHERE PTT_ID = ${reqBody.id}
                          AND USR_ID != ${userId}`;
            await queryRunner.query(qr3);
          } else if (!stickyNote['PTT_SHARED'] && Boolean(reqBody.shared)) {
            const qr4 = `INSERT IGNORE INTO T_POSTIT_USER_PTU (PTT_ID, USR_ID)
                        SELECT ${reqBody.id}, USR_ID
                        FROM T_USER_USR
                        WHERE organization_id = ${groupId}
                          AND USR_ID != ${userId}`;
            await queryRunner.query(qr4);
          }
        }
      } else {
        if (!reqBody?.contact) {
          const result = await queryRunner.query(
            `INSERT INTO T_POSTIT_PTT (USR_ID) VALUES (${userId})`,
          );
          insertedId = result.insertId;
        } else {
          const result = await queryRunner.query(
            `INSERT INTO T_POSTIT_PTT (USR_ID, CON_ID) VALUES (${userId}, ${reqBody.contact})`,
          );
          insertedId = result.insertId;
        }

        const qr5 = `INSERT INTO T_POSTIT_USER_PTU (PTT_ID, USR_ID, PTU_WIDTH, PTU_HEIGHT)
                    SELECT ?, USR_ID, 200, 200
                    FROM T_USER_USR
                    WHERE organization_id = ?`;
        await queryRunner.query(qr5, [insertedId, groupId]);
      }
      await queryRunner.commitTransaction();
      const qr6 = `SELECT
                      PTT.PTT_ID id,
                      PTT.PTT_MSG msg,
                      PTT.PTT_COLOR color,
                      PTT.PTT_EDITABLE editable,
                      IF (PTT.PTT_SHARED = 1 OR PTT.USR_ID = ?, 1 , 0) AS shareable,
                      PTT.PTT_SHARED shared,
                      DATE_FORMAT(PTT.created_at, '%Y-%m-%dT%TZ') AS createdOn,
                      PTU.PTU_WIDTH width,
                      PTU.PTU_HEIGHT height,
                      PTU.PTU_X "left",
                      PTU.PTU_Y top
                  FROM T_POSTIT_PTT PTT
                  JOIN T_POSTIT_USER_PTU PTU ON PTU.PTT_ID = PTT.PTT_ID
                  WHERE PTT.PTT_ID = ?
                    AND PTU.USR_ID = ?`;
      const result = await this.dataSource.query(qr6, [
        userId,
        insertedId ? insertedId : reqBody.id,
        userId,
      ]);
      // convert shareable to number
      return { ...result[0], shareable: Number(result[0].shareable) };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      return { message: err.message, code: 0 };
    } finally {
      await queryRunner.release();
    }
  }
}
