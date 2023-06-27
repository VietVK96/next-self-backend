import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { ContactPaymentFindAllDto } from './dto/contact.payment.dto';
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
}
