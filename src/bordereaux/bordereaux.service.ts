import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import 'dayjs/locale/fr';
import * as dayjs from 'dayjs';
import * as path from 'path';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import {
  HandlebarsHelpers,
  PdfTemplateFile,
  customCreatePdf,
} from 'src/common/util/pdf';
import { ErrorCode } from 'src/constants/error';
import { SlipCheckEntity } from 'src/entities/slip-check.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BordereauxService {
  constructor(
    @InjectRepository(SlipCheckEntity)
    private readonly slipCheckRepository: Repository<SlipCheckEntity>,
  ) {}

  /**
   * File php/bordereaux/show.php
   *
   * @param id
   * @returns
   */
  async findOne(id: number): Promise<SlipCheckEntity[]> {
    const slipCheck = await this.slipCheckRepository.find({
      relations: ['libraryBank', 'cashings'],
      where: { id: id },
    });
    return slipCheck;
  }

  /**
   * File php/bordereaux/print.php
   *
   * @param id
   * @returns
   */
  async printPdf(id: number) {
    try {
      const slipCheck = await this.slipCheckRepository.find({
        relations: [
          'libraryBank',
          'cashings',
          'libraryBank.user',
          'libraryBank.group',
          'libraryBank.address',
        ],
        where: { id: id },
      });

      const filePath = path?.join(
        process.cwd(),
        'templates/bordereaux',
        'index.hbs',
      );

      const options = {
        format: 'A4',
        displayHeaderFooter: true,
        footerTemplate: '<div></div>',
        headerTemplate: '<div></div>',
        margin: {
          left: '5mm',
          top: '5mm',
          right: '5mm',
          bottom: '5mm',
        },
      };

      const data = {
        slipCheck: slipCheck.length > 0 ? slipCheck[0] : {},
      };

      const files: PdfTemplateFile[] = [
        {
          data,
          path: filePath,
        },
      ];

      const helpers = {
        dateFr: (date) => {
          return dayjs(date).locale('fr').format('dddd D MMMM YYYY');
        },
        count: (arr) => arr.length,
      };

      return customCreatePdf({ files, options, helpers });
    } catch {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }
}
