import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BankService } from './service/bank.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import {
  BankCheckPrintDto,
  CreateUpdateBankDto,
  SortableUpdateBankCheckDto,
  UpdateBankCheckDto,
} from './dto/bank.dto';
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

  @Put('/bank-checks/sortable')
  @UseGuards(TokenGuard)
  async sortableContraindications(
    @Body() payload: SortableUpdateBankCheckDto[],
  ) {
    return await this.bankService.sortable(payload);
  }

  @Put('/bank-checks/:id')
  @UseGuards(TokenGuard)
  async updateBankChecks(
    @Param('id') id: number,
    @Body() payload: UpdateBankCheckDto,
  ) {
    return await this.bankService.updateBankChecks(id, payload);
  }

  @Post('/bank-checks/copy/:id')
  @UseGuards(TokenGuard)
  async duplicateBankChecks(@Param('id') id: number) {
    return await this.bankService.duplicateBankChecks(id);
  }

  /**
   *
   * /settings/library/bank.php -> full
   */

  @Get('/banks/all')
  @UseGuards(TokenGuard)
  async findAllBankByUser(@Query('id') id: number) {
    try {
      return await this.bankService.findAllByUser(id);
    } catch (error) {
      throw new CBadRequestException(ErrorCode.ERROR_GET_BANKS, error);
    }
  }

  /**
   * /settings/library/bankEdit.php
   */
  @Post('/banks')
  @UseGuards(TokenGuard)
  async createUpdateBank(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: CreateUpdateBankDto,
  ) {
    return await this.bankService.createUpdateBank(
      identity.id,
      identity.org,
      payload,
    );
  }

  /**
   * /settings/library/bankEdit.php
   */
  @Delete('/banks/:id')
  @UseGuards(TokenGuard)
  async deleteBank(
    @CurrentUser() identity: UserIdentity,
    @Param('id') id: number,
  ) {
    return await this.bankService.deleteBank(id, identity.id, identity.org);
  }

  @Get('/banks/:id')
  @UseGuards(TokenGuard)
  async getOneBank(
    @CurrentUser() identity: UserIdentity,
    @Param('id') id: number,
  ) {
    return await this.bankService.getOne(id);
  }
}
