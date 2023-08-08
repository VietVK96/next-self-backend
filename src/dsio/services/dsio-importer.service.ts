import { Injectable } from '@nestjs/common';
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

@Injectable()
export class DsioImporterService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(UserPreferenceEntity)
    private userPrefRepo: Repository<UserPreferenceEntity>,
    private importerService: ImporterService,
  ) {}

  /**
   * File: php/dsio/importer.php -> full
   */
  async importer(user: UserIdentity, importerDsioDto: ImporterDsioDto) {
    let pathname = importerDsioDto.pathname;

    if (!fs.existsSync(pathname)) {
      const dir = await this.configService.get('app.uploadDir');
      pathname = path.join(dir, pathname);
    }

    if (!fs.existsSync(pathname)) {
      throw new CBadRequestException(null, ErrorCode.FILE_NOT_FOUND);
    }

    let command = '';
    const extension = path.extname(pathname).toUpperCase();
    if (extension === 'ZIP') {
      // @TODO
      //   $importPathname = base_path('php/document/letters/import.php');
      // $command = "php -c $phpiniPathname $importPathname filename=" . escapeshellarg($filename) . " organization_id={$session->get('organization_id')}";
      // $filename
      // orgId
      // serId opt
      // if (null !== ($userId = $request->request->get('iduser'))) {
      //     $command .= " user_id={$userId}";
      // }
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
      const paramsObject: { [key: string]: string } = {
        pathname: importerDsioDto.pathname || '',
        patient_number: importerDsioDto.patient_number
          ? importerDsioDto.patient_number.toString()
          : '',
        sections: JSON.stringify(importerDsioDto.sections),
      };
      const params = new URLSearchParams(paramsObject);
      const queryString = `${params.toString()} group=${
        user.org
      } FRQ=${FRQ} HMD=${HMD} HMF=${HMF} HAD=${HAD} HAF=${HAF}`;

      command = `php -c import_shell.php -- ${queryString}`;

      this.importerService.runImportShell(
        importerDsioDto,
        user.org,
        FRQ,
        HMD,
        HMF,
        HAD,
        HAF,
      );
    }

    fs.writeFileSync(
      `${pathname}.json`,
      JSON.stringify({ status: 1, action: "Début d'importation", prc: 0 }),
    );

    return {
      status: 1,
      ext: extension,
      command: command,
    };
  }
}
