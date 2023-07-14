import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BankService } from './service/bank.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';

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
      throw new CBadRequestException('error get banks', error);
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
      throw new CBadRequestException('error get bank check', error);
    }
  }
}
