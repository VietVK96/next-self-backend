import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { join } from 'path';
import {
  helpersCaresheetPdf,
  optionsCaresheetPdf,
} from 'src/caresheets/utils/pdf';
import { customCreatePdf } from 'src/common/util/pdf';
import { FseEntity } from 'src/entities/fse.entity';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CareSheetPrintService {
  constructor(
    @InjectRepository(FseEntity)
    private fseRepo: Repository<FseEntity>,
    @InjectRepository(ThirdPartyAmoEntity)
    private thirdPartyAmoRepository: Repository<ThirdPartyAmoEntity>,
    @InjectRepository(ThirdPartyAmcEntity)
    private thirdPartyAmcRepository: Repository<ThirdPartyAmcEntity>,
  ) {}

  async print(id: number, duplicata: boolean) {
    const caresheet = await this.fseRepo.findOne({
      where: {
        id,
      },
      relations: {
        patient: {
          medical: {
            policyHolder: true,
          },
        },
        actMedicals: {
          act: true,
          ccam: true,
          ngapKey: true,
        },
      },
    });
    caresheet.thirdPartyAmo = await this.thirdPartyAmoRepository.findOne({
      where: {
        caresheetId: caresheet?.id,
      },
    });
    caresheet.thirdPartyAmc = await this.thirdPartyAmcRepository.findOne({
      where: {
        caresheetId: caresheet?.id,
      },
    });
    const filePath = join(
      process.cwd(),
      'templates/pdf/caresheets',
      'duplicata.hbs',
    );
    const data = {
      caresheet,
      duplicata,
    };
    const pdf = await customCreatePdf({
      files: [{ path: filePath, data }],
      options: { optionsCaresheetPdf },
      helpers: helpersCaresheetPdf,
    });
    return pdf;
  }
}
