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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUpdateMailDto } from './dto/createUpdateMail.dto';
import { CurrentDoctor } from 'src/common/decorator/doctor.decorator';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { ContextMailDto, FindVariableDto } from './dto/findVariable.dto';
import { TranformDto } from './dto/transform.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SendMailDto } from './dto/sendMail.dto';
import { UpdateMailDto } from './dto/mail.dto';
import { DocumentMailService } from './services/document.mail.service';

@ApiBearerAuth()
@Controller('/mails')
@ApiTags('Mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private documentMailService: DocumentMailService,
  ) {}

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
    @Query('orderBy') orderBy?: string,
  ) {
    return await this.mailService.findAll(
      draw,
      pageIndex,
      docId,
      identity.org,
      search,
      practitionerId,
      orderBy,
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
  async duplicate(
    @Body() payload: CreateUpdateMailDto,
    @CurrentDoctor() docId: number,
  ) {
    return await this.mailService.duplicate(payload, docId);
  }

  @UseGuards(TokenGuard)
  @Delete('/delete/:id')
  async delete(@Param('id') id: number) {
    return await this.mailService.delete(id);
  }

  // php/mail/transform/php
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

  // php/mail/send.php
  @Post('/send')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        contact: {
          type: 'number',
        },
      },
    },
  })
  @UseGuards(TokenGuard)
  async send(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: SendMailDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return await this.mailService.sendTemplate(identity.id, body, files);
  }
  /**
   *  php/mail/update.php
   */
  @UseGuards(TokenGuard)
  @Post('/update')
  async update(@Body() payload: UpdateMailDto) {
    return await this.mailService.update(payload);
  }

  // php/mail/footers.php 100%
  @Get('/footers')
  @UseGuards(TokenGuard)
  @ApiHeader({
    name: 'X-DoctorId',
    description: 'DoctorId',
  })
  async footers(
    @CurrentDoctor() docId: number,
    @Query('patient_id') patient_id?: number,
    @Query('correspondent_id') correspondent_id?: number,
  ) {
    return await this.mailService.footers({
      doctor_id: docId,
      patient_id,
      correspondent_id,
    });
  }

  // php/mail/footers.php 100%
  @Get('/headers')
  @UseGuards(TokenGuard)
  @ApiHeader({
    name: 'X-DoctorId',
    description: 'DoctorId',
  })
  async headers(
    @CurrentDoctor() docId: number,
    @Query('patient_id') patient_id?: number,
    @Query('correspondent_id') correspondent_id?: number,
  ) {
    return await this.mailService.headers({
      doctor_id: docId,
      patient_id,
      correspondent_id,
    });
  }

  // php/mail/preview.php
  @Get('/preview')
  @UseGuards(TokenGuard)
  async preview(
    @Query('id') id: number,
    @CurrentDoctor() docId: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.mailService.preview(id, docId, identity.org);
  }
}
