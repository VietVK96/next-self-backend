import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { AppointmentReminderLibrarieService } from './services/AppointmentReminderLibrarie.service';
import { CreateAppointmentReminderLibrarieQueryDto } from './dto/appointment-reminder-librarie.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@ApiBearerAuth()
@ApiTags('AppointmentReminderLibrarie')
@Controller('appointmentReminderLibrarie')
export class AppointmentReminderLibrarieController {
  constructor(
    private appointmentReminderLibrarieService: AppointmentReminderLibrarieService,
  ) {}

  /**
   * /settings/appointment-reminder-libraries/index.php 100%
   *
   */
  @Get()
  @UseGuards(TokenGuard)
  async findAll(@CurrentUser() identity: UserIdentity) {
    return this.appointmentReminderLibrarieService.getAppointmentReminderLibrarie(
      identity.id,
    );
  }

  /**
   * /settings/appointment-reminder-libraries/store.php 100%
   *
   */
  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  @ApiConsumes('multipart/form-data')
  @UseGuards(TokenGuard)
  async createAppointmentReminderLibrarie(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: CreateAppointmentReminderLibrarieQueryDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.appointmentReminderLibrarieService.createAppointmentReminderLibrarie(
      identity.org,
      identity.id,
      payload,
      files,
    );
  }

  /**
   * /settings/appointment-reminder-libraries/delete.php 100%
   *
   */
  @Delete('/:id')
  @UseGuards(TokenGuard)
  async deleteAppointmentReminderLibrarie(@Param('id') id: number) {
    return this.appointmentReminderLibrarieService.deleteAppointmentReminderLibrarie(
      id,
    );
  }

  /**
   * /settings/appointment-reminder-libraries/create.php 100%
   *
   */
  @Post('/mobilePhoneNumbers')
  @UseGuards(TokenGuard)
  async updateMobilePhoneNumbers(@CurrentUser() identity: UserIdentity) {
    return this.appointmentReminderLibrarieService.updateMobilePhoneNumbers(
      identity.id,
    );
  }
}
