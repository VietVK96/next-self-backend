import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { OrdonnancesServices } from './services/ordonnances.services';
import { OrdonnancesDto } from './dto/ordonnances.dto';
import { EnregistrerFactureDto, PrintPDFDto } from './dto/facture.dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';

@ApiBearerAuth()
@Controller('/dental')
@ApiTags('Dental')
export class OrdonnancesController {
  constructor(private ordonnancesServices: OrdonnancesServices) {}

  /**
   * php/dental/quotation/delete.php -> full file
   * delete quotation
   */

  @Post('/ordonnances/ordo_requetes_ajax')
  @UseGuards(TokenGuard)
  async store(@Body() payload: OrdonnancesDto) {
    return this.ordonnancesServices.update(payload);
  }
  @Get('/ordonnances/medical/:patientId')
  @UseGuards(TokenGuard)
  async getMedical(
    @Param('patientId') patientId: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return await this.ordonnancesServices.getMedicalByPatientId(
      patientId,
      identity,
    );
  }

  @Post('/ordonnances/ordo_email')
  @UseGuards(TokenGuard)
  async mail(@Body() payload: EnregistrerFactureDto) {
    return this.ordonnancesServices.getMail(payload);
  }

  @Get('/ordonnances/ordo_pdf')
  @UseGuards(TokenGuard)
  async getOrdoPdf(
    @Res() res,
    @Query() payload: PrintPDFDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    try {
      const buffer = await this.ordonnancesServices.generatePdf(
        payload,
        identity,
      );

      res.set({
        // pdf
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=print.pdf`,
        'Content-Length': buffer.length,
        // prevent cache
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: 0,
      });
      res.end(buffer);
    } catch (error) {
      throw new CBadRequestException(ErrorCode.ERROR_GET_PDF, error);
    }
  }
}
