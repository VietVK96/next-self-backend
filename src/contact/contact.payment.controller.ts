import { Controller, Delete, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import {
  ContactPaymentDeleteByIdDto,
  ContactPaymentFindAllDto,
} from './dto/contact.payment.dto';
import { ContactPaymentService } from './services/contact.payment.service';

@ApiBearerAuth()
@Controller('/contact')
@ApiTags('Contact')
export class ContactPaymentController {
  constructor(private contactPaymentService: ContactPaymentService) {}

  // File php\contact\payment\findAll.php 13->62
  @Get('/payment/findAll')
  @ApiQuery({
    name: 'id',
    type: ContactPaymentFindAllDto,
  })
  @UseGuards(TokenGuard)
  async findAll(@Query() request: ContactPaymentFindAllDto) {
    return this.contactPaymentService.findAll(request);
  }

  // File php\contact\payment\delete.php 21->53
  @Delete('/payment/delete')
  @ApiQuery({
    name: 'id',
    type: ContactPaymentDeleteByIdDto,
  })
  @UseGuards(TokenGuard)
  async deleteById(
    @Query() request: ContactPaymentDeleteByIdDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.contactPaymentService.deleteById(request.id, identity);
  }
}
