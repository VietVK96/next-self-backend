import { MailService } from './services/mail.service';
import { Controller, Get, Query, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CreateUpdateMailDto } from './dto/createUpdateMail.dto';
import { CurrentDoctor } from 'src/common/decorator/doctor.decorator';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

@ApiBearerAuth()
@Controller('/mails')
@ApiTags('Mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get()
  @ApiHeader({
    name: 'X-DoctorId',
    description: 'DoctorId',
  })
  @UseGuards(TokenGuard)
  async findAll(
    @CurrentDoctor() docId: number,
    @CurrentUser() identity: UserIdentity,
    @Query('draw') draw?: string,
    @Query('search') search?: string,
    @Query('pageIndex') pageIndex?: number,
  ) {
    return await this.mailService.findAll(
      draw,
      pageIndex,
      docId,
      identity.org,
      search,
    );
  }

  @Get('/find')
  async findById(@Query('id') id?: number) {
    return await this.mailService.findById(id);
  }

  @Post('/duplicate')
  async duplicate(@Body() payload: CreateUpdateMailDto) {
    return await this.mailService.duplicate(payload);
  }
}
