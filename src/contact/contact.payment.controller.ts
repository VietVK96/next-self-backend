import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import {
  ContactPatchDto,
  ContactPaymentDeleteByIdDto,
  ContactPaymentFindAllDto,
  ContactPaymentStoreDto,
  ContactPaymentUpdateDto,
} from './dto/contact.payment.dto';
import { ContactPaymentService } from './services/contact.payment.service';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ContactService } from './services/contact.service';

@ApiBearerAuth()
@Controller('/contact')
@ApiTags('Contact')
export class ContactPaymentController {
  constructor(
    private contactPaymentService: ContactPaymentService,
    private contactService: ContactService,
  ) {}

  // File php/contact/payment/findAll.php 13->62
  @Get('/payment/findAll')
  @ApiQuery({
    name: 'id',
    type: ContactPaymentFindAllDto,
  })
  @UseGuards(TokenGuard)
  async findAll(@Query() request: ContactPaymentFindAllDto) {
    return this.contactPaymentService.findAll(request);
  }

  // File php/contact/payment/findAll.php 13->62
  @Get('/payment/find')
  @UseGuards(TokenGuard)
  async find(@Query('id') id: number) {
    if (!Number(id)) throw new CBadRequestException('id not found');
    return this.contactPaymentService.show(+id);
  }

  // File php/contact/payment/delete.php 21->53
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

  // File php/contact/payment/store.php 12->22
  @Post('/payment/store')
  @UseGuards(TokenGuard)
  async store(@Body() payload: ContactPaymentStoreDto) {
    return this.contactPaymentService.store(payload);
  }

  // File php/contact/payment/update.php 13->62
  @Patch('/payment/update')
  @UseGuards(TokenGuard)
  async update(@Body() payload: ContactPaymentUpdateDto) {
    return this.contactPaymentService.update(payload);
  }

  // File php/contact/patch.php
  @Patch('/patch')
  @UseGuards(TokenGuard)
  async patch(@Body() payload: ContactPatchDto) {
    return this.contactService.patch(payload);
  }
}
