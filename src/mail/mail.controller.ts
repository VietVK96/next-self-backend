import { MailService } from './services/mail.service';
import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CreateUpdateMailDto } from './dto/createUpdateMail.dto';
import { CurrentDoctor } from 'src/common/decorator/doctor.decorator';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { ContextMailDto, FindVariableDto } from './dto/findVariable.dto';
import { TranformDto } from './dto/transform.dto';

@ApiBearerAuth()
@Controller('/mails')
@ApiTags('Mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  /**
   * php/mail/findAll.php 100%
   */
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
    @Query('practitionerId') practitionerId?: string,
  ) {
    return await this.mailService.findAll(
      draw,
      pageIndex,
      docId,
      identity.org,
      search,
      practitionerId,
    );
  }

  /**
   * php/mail/find.php 100%
   */
  @UseGuards(TokenGuard)
  @Get('/find')
  async findById(@Query('id') id?: number) {
    return await this.mailService.findById(id);
  }

  /**
   *  php/mail/store.php 100%
   */
  @UseGuards(TokenGuard)
  @Post('/duplicate')
  async duplicate(@Body() payload: CreateUpdateMailDto) {
    return await this.mailService.duplicate(payload);
  }

  @UseGuards(TokenGuard)
  @Delete('/delete/:id')
  async delete(@Param('id') id: number) {
    return await this.mailService.delete(id);
  }

  @Post('/variable')
  @ApiHeader({
    name: 'X-DoctorId',
    description: 'DoctorId',
  })
  @UseGuards(TokenGuard)
  async findVariable(
    @Body() payload: FindVariableDto,
    @CurrentDoctor() docId: number,
  ) {
    return this.mailService.findVariable(payload, docId);
  }

  // php/mail/transform.php 100%
  @Post('/transform')
  @ApiHeader({
    name: 'X-DoctorId',
    description: 'DoctorId',
  })
  @UseGuards(TokenGuard)
  async transform(
    @Body() payload: TranformDto,
    @CurrentDoctor() docId: number,
  ) {
    const contextParam: ContextMailDto = {};
    if (payload?.patient?.id)
      contextParam.patient_id = Number(payload.patient.id);
    if (payload?.correspondent?.id)
      contextParam.patient_id = Number(payload.correspondent.id);
    const context = await this.mailService.contextMail(contextParam, docId);
    return await this.mailService.transform(payload, context);
  }
}
