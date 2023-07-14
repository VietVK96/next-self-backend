import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { OdontogramCurrentDto } from './dto/patientBalance.dto';
import { PatientOdontogramService } from './service/patientOdontogram.service';
@ApiBearerAuth()
@Controller('patients')
@ApiTags('Patients')
export class PatientOdontogramController {
  constructor(private service: PatientOdontogramService) {}

  @Get('/odontogram/current')
  @UseGuards(TokenGuard)
  async getCurrent(
    @CurrentUser() user: UserIdentity,
    @Query() request: OdontogramCurrentDto,
  ) {
    return await this.service.getCurrent(request, user);
  }
}
