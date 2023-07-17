import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BankService } from './service/bank.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { BankCheckPrintDto } from './dto/bank.dto';
import { ErrorCode } from 'src/constants/error';

@ApiTags('Bank')
@Controller('')
@ApiBearerAuth()
export class BankController {
  constructor(private bankService: BankService) {}

  /**
   * php/bank/findAll.php -> full
   *
   */
  @Get('/banks')
  @UseGuards(TokenGuard)
  async findAllBank(@CurrentUser() identity: UserIdentity) {
    try {
      return await this.bankService.findAllBank(identity.org, identity.id);
    } catch (error) {
      throw new CBadRequestException(ErrorCode.ERROR_GET_BANKS, error);
    }
  }
  /**
   * php/bank-checks/index.php -> full
   *
   */
  @Get('/bank-checks')
  @UseGuards(TokenGuard)
  async bankChecks(@CurrentUser() identity: UserIdentity) {
    try {
      return await this.bankService.bankChecks(identity.org);
    } catch (error) {
      throw new CBadRequestException(ErrorCode.ERROR_GET_PDF, error);
    }
  }
  /**
   * php/bank-checks/print.php -> full
   *
   */
  @Get('/bank-checks/print')
  @UseGuards(TokenGuard)
  async print(@Res() res, @Query() params: BankCheckPrintDto) {
    try {
      const buffer = await this.bankService.print(params);

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
