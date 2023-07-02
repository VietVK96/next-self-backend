import { Body, Controller, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import {
  PatientBalanceUpdatePayloadDto,
  PatientBalanceUpdateQueryDto,
} from './dto/patientBalance.dto';
import { PatientBalanceService } from './service/patientBalance.service';
@ApiBearerAuth()
@Controller('patients')
@ApiTags('Patients')
export class PatientBalanceController {
  constructor(private service: PatientBalanceService) {}

  @Patch('/update')
  // @UseGuards(TokenGuard)
  async findAll(
    @Query() request: PatientBalanceUpdateQueryDto,
    @Body() payload: PatientBalanceUpdatePayloadDto,
  ) {
    return this.service.update(request, payload);
  }
}
