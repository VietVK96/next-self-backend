import { Injectable } from '@nestjs/common';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as AdmZip from 'adm-zip';
import { SectionsDsio } from './sections-dsio';
import { ErrorCode } from 'src/constants/error';

@Injectable()
export class ImportServices {
  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  /**
   * File: php/import.php line 24 -> 44
   */
  async getLocalEntities(
    request: string,
    orgId: number,
  ): Promise<{ id: string; name: string }[]> {
    const toReturn: { id: string; name: string }[] = [];

    const users: { id: string; name: string }[] = await this.dataSource.query(
      request,
      [orgId],
    );

    users.map((user) => toReturn.push(user));

    return toReturn;
  }

  /**
   * File: php/import.php line 48 -> 166
   */
  async import(orgId: number, action: string, file: Express.Multer.File) {
    if (!file) throw new CBadRequestException(ErrorCode.FILE_NOT_FOUND);

    const dir = await this.configService.get('app.uploadDir');
    let dirFile = '';
    // action processing
    switch (action) {
      case 'dsio':
        try {
          const time = Math.floor(Date.now() / 1000);
          const pathname = path.join(
            'dsio',
            `${orgId.toString().padStart(5, '0')}_${time}`,
          );
          dirFile = path.join(dir, pathname, file.originalname);

          // write upload file to upload dir
          if (!fs.existsSync(path.join(dir, pathname))) {
            fs.mkdirSync(path.join(dir, pathname), { recursive: true });
          }
          fs.writeFileSync(dirFile, file?.buffer);

          let filename = dirFile;

          // File recovery if upload file is archived
          if (file.mimetype === 'application/zip') {
            const zip = new AdmZip(filename);
            const zipEntries = zip.getEntries();
            const firstEntry = zipEntries[0];
            const newDirFile = path.join(dir, pathname, firstEntry.entryName);

            // write new extracted file from zip file
            fs.writeFileSync(newDirFile, firstEntry.getData());
            // delete the zip file
            fs.unlinkSync(filename);

            filename = newDirFile;
          }

          const sectionsDsio = new SectionsDsio();
          const sections = await sectionsDsio.getList(filename);

          if (sections) {
            if (sections?.Praticiens?.sources) {
              // Recovery of group practitioners
              sections['Praticiens']['targets'] = await this.getLocalEntities(
                `
                SELECT
                  T_USER_USR.USR_ID as id,
                  CONCAT_WS(' ', T_USER_USR.USR_LASTNAME, T_USER_USR.USR_FIRSTNAME, USR_NUMERO_FACTURANT) as name
                FROM T_USER_USR
                JOIN T_USER_TYPE_UST
                WHERE T_USER_USR.organization_id = ?
                  AND T_USER_USR.USR_VALIDATED IS NOT NULL
                  AND T_USER_USR.UST_ID = T_USER_TYPE_UST.UST_ID
                  AND T_USER_TYPE_UST.UST_PRO = 1`,
                orgId,
              );
            }

            if (sections?.Agendas?.sources) {
              // Collection of group agendas
              sections['Agendas']['targets'] = await this.getLocalEntities(
                `
                SELECT
                  id, name
                FROM resource
                WHERE organization_id = ?`,
                orgId,
              );
            }

            // retrieve the next file number
            const result: { customer_max_number: number }[] =
              await this.dataSource.query(
                `
              SELECT customer_max_number
              FROM T_GROUP_GRP
              WHERE GRP_ID = ?`,
                [orgId],
              );

            return {
              filename: filename,
              sections: sections,
              patient_number: result[0].customer_max_number,
            };
          } else {
            throw new CBadRequestException(
              ErrorCode.NOT_RETRIEVE_PRACTIONERS_FROM_DSIO_FILE,
              file,
            );
          }
        } catch (error) {
          return error;
        }

      case 'courriers':
        try {
          const dsioDir = path.join(dir, 'dsio');
          const filePath = path.join(dsioDir, file.originalname);
          if (!fs.existsSync(dsioDir)) {
            fs.mkdirSync(dsioDir, { recursive: true });
          }
          fs.writeFileSync(filePath, file?.buffer);

          return {
            filename: `dsio/${file.originalname}`,
          };
        } catch (error) {
          throw new CBadRequestException(error.message);
        }

      default:
        throw new CBadRequestException(ErrorCode.INVALID_ACTION, action);
    }
  }
}
