import { Injectable } from '@nestjs/common';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { UploadService } from '../../upload/services/upload.service';
import { SuccessResponse } from 'src/common/response/success.res';
import { DataSource, Repository } from 'typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import {
  ContactDocumentEntity,
  EnumContactDocumentType,
} from 'src/entities/contact-document.entity';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { StringHelper } from 'src/common/util/string-helper';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class DocumentServices {
  constructor(
    private readonly uploadservice: UploadService,
    private dataSource: DataSource,
    private configService: ConfigService,
    @InjectRepository(ContactEntity)
    private contactRepository: Repository<ContactEntity>,
    @InjectRepository(ContactDocumentEntity)
    private contactDocumentRepository: Repository<ContactDocumentEntity>,
  ) {}

  async upload(
    orgId: number,
    contactId: number,
    file: Express.Multer.File,
    type: string,
  ): Promise<SuccessResponse> {
    const allowedMimeTypes = [
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/bmp',
      'image/x-windows-bmp',
      'image/x-ms-bmp',
      'image/tiff',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new CBadRequestException('invalid type file');
    }
    if (file.size > 40 * 1024 * 1024) {
      throw new CBadRequestException('file lager than 40m');
    }

    const userCurrent = await this.uploadservice.getContactCurrent(orgId);
    const auth = `${orgId.toString().padStart(5, '0')}`;
    const dir = await this.configService.get('app.uploadDir');
    if (file) {
      await this.uploadservice._checkGroupStorageSpace(orgId, file?.size);
    }
    const fileUpload =
      await this.uploadservice._saveFilesInformationsIntoDatabase(
        file,
        userCurrent,
        dir,
        auth,
      );
    const contact = await this.contactRepository.find({
      where: { id: contactId },
    });

    const typeEnum = await this.convertToEnumContactDocumentType(type);
    await this.contactDocumentRepository.save({
      conId: contact[0].id,
      type: typeEnum,
      uplId: fileUpload.id,
    });

    //@TODO: // 2012-12-12 09:25 romain
    // // Ajout d'une trace IDS suivant le type de document uploadé
    // switch ($type) {
    //   case 'file' :
    //       Ids\Log::write('Document', $contactEntity->getId(), 1);
    //       break;
    //   case 'rx' :
    //       Ids\Log::write('Image', $contactEntity->getId(), 1);
    //       break;
    // }
    return { success: true };
  }

  async convertToEnumContactDocumentType(
    input: string,
  ): Promise<EnumContactDocumentType> {
    if (
      Object.values(EnumContactDocumentType).includes(
        input as EnumContactDocumentType,
      )
    ) {
      return input as EnumContactDocumentType;
    } else {
      throw new Error(`Invalid value for EnumContactDocumentType: ${input}`);
    }
  }

  async getAllFile(orgId, patientId: number, type: string, tags?: string[]) {
    console.log('aa', orgId, patientId, type);
    let query = `
    SELECT
      UPL.UPL_ID AS id,
      UPL.UPL_TOKEN token,
      UPL.UPL_NAME name,
      UPL.UPL_NAME original_filename,
      UPL.UPL_TYPE mimetype,
      UPL.UPL_SIZE size,
      DATE_FORMAT(UPL.created_at, '%Y-%m-%dT%H:%i:%sZ') AS created_at,
      USR.USR_ID ownerId,
      USR.USR_LASTNAME ownerLastname,
      USR.USR_FIRSTNAME ownerFirstname
    FROM T_CONTACT_CON CON
    JOIN T_CONTACT_DOCUMENT_COD COD
    JOIN T_UPLOAD_UPL UPL
    JOIN T_USER_USR USR
    LEFT OUTER JOIN file_tag ON file_tag.file_id = UPL.UPL_ID
    LEFT OUTER JOIN tag ON tag.id = file_tag.tag_id
    WHERE CON.organization_id = ?
      AND CON.CON_ID = ?
      AND CON.CON_ID = COD.CON_ID
      AND COD.COD_TYPE = ?
      AND COD.UPL_ID = UPL.UPL_ID
      AND UPL.USR_ID = USR.USR_ID
    `;
    const queryParameters = [orgId, patientId, type];

    if (tags && tags.length > 0) {
      const placeholders = tags.map(() => `?`).join(',');
      query += `
        AND tag.id IN (${placeholders})
        GROUP BY UPL.UPL_ID
        HAVING COUNT(DISTINCT tag.title) = ${tags.length}
      `;
      queryParameters.push(...tags);
    }
    return await this.dataSource.query(query, queryParameters);
  }

  async findAll(
    identity: UserIdentity,
    patientId: number,
    type: string,
    tags: string[],
  ) {
    const host = await this.configService.get('app.host');
    const files = await this.getAllFile(identity.org, patientId, type, tags);
    for (const file of files) {
      const id = file.id;

      file.tags = [];
      file.sizeAsString = StringHelper.formatBytes(file.size, false);
      file.actions = {
        download: `${host}/files/download/${id}`,
        open: `${host}/files/inline/${id}`,
      };

      if (file.mimetype.match(/^image\/.*/)) {
        file.actions.thumbnail = `${host}/files/thumbnail/${id}`;
      }
      const tagStm = await this.dataSource.query(
        `SELECT
          tag.id,
          tag.title,
          tag.color,
          tag.internal_reference
        FROM file_tag
        JOIN tag
        WHERE file_tag.file_id = ?
          AND file_tag.tag_id = tag.id
        ORDER BY tag.title`,
        [id],
      );
      file.tags = tagStm.map((row) => ({
        id: row.id,
        title: row.title,
        color: JSON.parse(row.color),
        internal_reference: row.internal_reference,
      }));
    }

    return files;
  }
}
