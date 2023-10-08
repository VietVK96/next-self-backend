import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import * as path from 'path';
import * as fs from 'fs';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { InjectRepository } from '@nestjs/typeorm';
import { promises as fsPromises } from 'fs';
import * as AdmZip from 'adm-zip';
import { UserEntity } from 'src/entities/user.entity';
import { parse } from 'node-html-parser';
import { ContactEntity } from 'src/entities/contact.entity';
import { LettersEntity } from 'src/entities/letters.entity';
import { EnumLettersType } from 'src/entities/letters.entity';
import * as dayjs from 'dayjs';

@Injectable()
export class LetterImporterService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
    @InjectRepository(ContactEntity)
    private contactRepo: Repository<ContactEntity>,
    @InjectRepository(LettersEntity)
    private letterRepo: Repository<LettersEntity>,
  ) {}

  /**
   * File: php/document/letters/import.php -> full
   */
  async letterImport(user: UserIdentity, pathname: string, userId: number) {
    const BATCH_SIZE = 50;
    let i = 1;
    const fileName = pathname;
    const dirName = path.dirname(fileName);
    const nameFile = path.basename(fileName, path.extname(fileName));
    const jsonFileName = path.join(dirName, `${nameFile}.json`);
    const handle = await fsPromises.open(jsonFileName, 'w');
    const logger = async (
      handle: fsPromises.FileHandle,
      content: string,
      close: boolean,
    ) => {
      await handle.write(content);
      if (close) {
        await handle.close();
      }
    };

    if (!fs.existsSync(pathname)) {
      const data = {
        status: -1,
        error: 'Aucun fichier valide fourni en paramètre',
      };
      await logger(handle, JSON.stringify(data), true);
      throw new CBadRequestException(ErrorCode.FILE_NOT_FOUND);
    }

    let users: UserEntity[] = await this.userRepo
      .createQueryBuilder('u')
      .innerJoinAndSelect('u.medical', 'm')
      .where('u.organizationId = :orgId', { orgId: user?.org })
      .orderBy('u.lastname', 'ASC')
      .addOrderBy('u.firstname', 'ASC')
      .getMany();

    if (userId) {
      users = users.filter((user) => userId === user.id);
    }

    if (users?.length <= 0) {
      const data = {
        status: -1,
        error: 'Aucun utilisateur sélectionné',
      };
      await logger(handle, JSON.stringify(data), true);
      throw new CBadRequestException('Aucun utilisateur sélectionné');
    }

    const zip = new AdmZip(fileName);
    if (!zip || zip?.getEntryCount() <= 0) {
      const data = {
        status: -1,
        error:
          "Impossible d'extraire les fichiers. Vérifier que le zip n'est pas corrompu.",
      };
      await logger(handle, JSON.stringify(data), true);
      throw new CBadRequestException(
        "Impossible d'extraire les fichiers. Vérifier que le zip n'est pas corrompu.",
      );
    }

    const zipEntries = zip.getEntries();
    for (let index = 0; index < zipEntries.length; index++) {
      const percent =
        Math.round(((100 * index) / zipEntries.length) * 100) / 100;
      const entry = zipEntries[index];
      const name = entry.entryName;
      const originalFilename = name.substring(name.lastIndexOf('/') + 1);
      const contentBuffer = entry.getData();
      const content = contentBuffer.toString('utf-8');
      const root = parse(content);
      if (!content || !root) {
        continue;
      }
      const styleTags = root.querySelectorAll('head style');
      styleTags.forEach((styleTag) => {
        const nodeValue = styleTag.textContent.replace(/\s+/g, ' ');

        const matches = nodeValue.matchAll(
          /(?<selector>[^{]*){(?<content>[^}]*)}/g,
        );
        for (const match of matches) {
          const selector = match.groups.selector.trim();

          // Sử dụng node-html-parser để tìm các phần tử thỏa mãn bộ chọn CSS
          const selectedElements = root.querySelectorAll(selector);

          // Duyệt qua từng phần tử thỏa mãn bộ chọn
          selectedElements.forEach((selectedElement) => {
            const styleAttr = selectedElement.getAttribute('style') || '';
            const styleList = styleAttr
              .split(';')
              .filter((item) => item !== '');
            const content = match.groups.content.trim();
            const contentList = content
              .split(';')
              .filter((item) => item !== '');
            const style = [...styleList, ...contentList];
            const updatedStyle = style.join(';');

            selectedElement.setAttribute('style', updatedStyle);
          });
        }
      });

      let title = '';
      let type: EnumLettersType = EnumLettersType.CONTACT;
      const firstPos = originalFilename.indexOf('_');
      const firstPart = originalFilename.substring(0, firstPos);
      let createdAt: Date | null = null;
      let patient: ContactEntity | null = null;

      if (/^\d+$/.test(firstPart)) {
        title = originalFilename.substring(firstPos + 1);
        patient = await this.contactRepo.findOneBy({
          organizationId: user?.org,
          nbr: Number(firstPart),
        });
      } else if (firstPart === 'macdent') {
        const elements = originalFilename.split('_', 5);
        title =
          elements[3].substring(0, 3) +
          (elements.length === 4 ? '' : ' : ' + elements[4].replace(/_/g, ' '));
        createdAt = dayjs(elements[2]).toDate();
        patient = await this.contactRepo.findOneBy({
          organizationId: user?.org,
          nbr: Number(elements[1]),
        });
      } else {
        const lastPos = originalFilename.lastIndexOf('_');
        const firstPart = originalFilename.substring(0, lastPos);
        title = firstPart
          .replace(/_/g, ' ')
          .toLowerCase()
          .replace(/^./, (c) => c.toUpperCase());

        const lastChar = originalFilename.charAt(lastPos + 1);
        if (lastChar && lastChar.toUpperCase() !== 'P') {
          type = EnumLettersType.CORRESPONDENT;
        }
      }

      if (firstPart !== 'macdent' || patient) {
        for (const user of users) {
          try {
            const mail: LettersEntity = {} as LettersEntity;
            mail.usrId = user?.id;
            mail.title = title;
            mail.msg = root.querySelectorAll('body').toString();
            mail.type = type;

            if (createdAt) {
              mail.createdAt = createdAt;
              mail.updatedAt = createdAt;
            } else {
              mail.createdAt = dayjs().toDate();
              mail.updatedAt = dayjs().toDate();
            }

            if (patient) {
              mail.conId = patient?.id;
            }

            await this.letterRepo.save(mail);
          } catch (error) {
            throw new CBadRequestException(
              ErrorCode.STATUS_INTERNAL_SERVER_ERROR,
            );
          }
        }
      }

      if (++i % BATCH_SIZE === 0) {
        const data = {
          status: 1,
          action: 'import',
          prc: percent,
          file: name,
        };
        await logger(handle, JSON.stringify(data), false);
      }
    }

    const dataJson = {
      status: 1,
      action: 'Importation des fichiers terminé',
      prc: 100,
    };
    await logger(handle, JSON.stringify(dataJson), true);
    return { success: true };
  }
}
