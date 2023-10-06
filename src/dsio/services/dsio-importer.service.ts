import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ImporterDsioDto } from '../dto/importer-dsio.dto';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import * as path from 'path';
import * as fs from 'fs';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { InjectRepository } from '@nestjs/typeorm';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { ImporterService } from './importer.service';
import { LetterImporterService } from './letter-importer.service';

@Injectable()
export class DsioImporterService {
  private logger: Logger = new Logger(DsioImporterService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(UserPreferenceEntity)
    private userPrefRepo: Repository<UserPreferenceEntity>,
    private importerService: ImporterService,
    private letterImporterService: LetterImporterService,
  ) {}

  /**
   * File: php/dsio/importer.php -> full
   */
  async importer(user: UserIdentity, importerDsioDto: ImporterDsioDto) {
    try {
      let pathname = importerDsioDto.pathname;

      if (!fs.existsSync(pathname)) {
        const dir = await this.configService.get('app.uploadDir');
        pathname = path.join(dir, pathname);
      }

      if (!fs.existsSync(pathname)) {
        throw new CBadRequestException(ErrorCode.FILE_NOT_FOUND);
      }

      const extension = path.extname(pathname).toUpperCase();
      if (extension === '.ZIP') {
        await this.letterImporterService.letterImport(
          user,
          pathname,
          importerDsioDto.iduser,
        );
      } else {
        // Import fichier DSIO
        const userPreference: UserPreferenceEntity =
          await this.userPrefRepo.findOne({
            where: {
              usrId: user.id,
            },
          });

        const FRQ = userPreference.frequency;
        const HMD = userPreference.hmd;
        const HMF = userPreference.hmf;
        const HAD = userPreference.had;
        const HAF = userPreference.haf;

        /**
         * php/dsio/importer.php line 58->61
         */
        importerDsioDto.pathname = pathname;
        this.importerService
          .runImportShell(importerDsioDto, user.org, FRQ, HMD, HMF, HAD, HAF)
          .catch((error) => {
            this.logger.error('importerService - runImportShell', error);
          });
      }

      fs.writeFileSync(
        `${pathname}.json`,
        JSON.stringify({ status: 1, action: "Début d'importation", prc: 0 }),
      );

      return {
        status: 1,
        ext: extension,
      };
    } catch (error) {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }
}
