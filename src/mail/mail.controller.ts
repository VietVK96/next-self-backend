import { MailService } from './services/mail.service';
import { Controller, Get, Query, Headers, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CreateUpdateMailDto } from './dto/createUpdateMail.dto';

@ApiBearerAuth()
@Controller('/mails')
@ApiTags('Mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('/')
  @ApiHeader({
    name: 'X-DocterId',
    description: 'DocterId',
  })
  async findAll(
    @Query('draw') draw?: string,
    @Query('pageIndex') pageIndex?: number,
    @Query('docId') docId?: number,
    @Query('groupId') groupId?: number,
    @Query('search') search?: string,
    @Headers('X-DocterId') doctorId?: number,
  ) {
    return await this.mailService.findAll(
      draw,
      pageIndex,
      docId,
      groupId,
      search,
      doctorId,
    );
  }

  @Get('/find')
  async findById(@Query('id') id?: number) {
    return await this.mailService.findById(id);
  }

  @Post('/create')
  async duplicate(@Body() payload: CreateUpdateMailDto) {
    return await this.mailService.duplicate(payload);
  }
}
