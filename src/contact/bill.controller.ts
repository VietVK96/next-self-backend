import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { BillService } from './services/bill.service';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';

@ApiBearerAuth()
@Controller('/bill')
@ApiTags('Bill')
export class BillController {
  constructor(private billService: BillService) {}

  @Delete('/delete/:id')
  @UseGuards(TokenGuard)
  async getTraceability(
    @Param('id') id: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    if (!Number(id)) throw new CBadRequestException('Id is invalid');
    this.billService.deleteBill(id, identity);
  }
}
