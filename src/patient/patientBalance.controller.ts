import { Body, Controller, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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

  @Patch('/balance/update')
  @UseGuards(TokenGuard)
  async update(
    @Query() request: PatientBalanceUpdateQueryDto,
    @Body() payload: PatientBalanceUpdatePayloadDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.service.update(request, payload, identity);
  }

  @Patch('/balance/delete')
  @UseGuards(TokenGuard)
  async delete(
    @Query() request: PatientBalanceUpdateQueryDto,
    @Body() payload: PatientBalanceUpdatePayloadDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.service.delete(request, payload, identity);
  }
}
