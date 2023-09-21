import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { PatientService } from './service/patient.service';
import {
  PatientActsDependenciesDto,
  PatientExportDto,
  PatientThirdPartyDto,
  RelauchDto,
} from './dto/index.dto';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

@ApiTags('Patients')
@Controller('patients')
export class PatientController {
  constructor(private patientService: PatientService) {}

  /**
   * File: auth\validation.php
   */
  @Get('export')
  async export(@Res() res: Response, @Query() request: PatientExportDto) {
    return await this.patientService.getExportQuery(res, request);
  }

  /**
   * File: application/php/patient/delete.php
   */
  @Delete('delete/:id')
  @ApiBearerAuth()
  @UseGuards(TokenGuard)
  async delete(@Param('id') id: number, @CurrentUser() identity: UserIdentity) {
    return await this.patientService.deletePatient(id, identity);
  }

  /**
   * File: php/patients/third-party/index.php
   */
  @Get('third-party')
  @ApiBearerAuth()
  @UseGuards(TokenGuard)
  async getPatientThirdParty(@Query() payload: PatientThirdPartyDto) {
    return await this.patientService.getPatientThirdParty(payload);
  }

  /**
   * php/patients/contraindications/index.php
   */
  @Get('/contraindications/:id')
  @UseGuards(TokenGuard)
  async findAllContraindications(@Param('id') id: number) {
    return await this.patientService.findAllContraindications(id);
  }

  /**
   * php/patients/acts/dependencies/index.php
   */

  @Get('/atcs/dependencies')
  @UseGuards(TokenGuard)
  async getAtcsDependencies(@Query() request: PatientActsDependenciesDto) {
    return await this.patientService.getAtcsDependencies(request);
  }

  /**
   * php/patients/unpaid/relauch.php
   */

  @Get('/unpaid/relaunch')
  @UseGuards(TokenGuard)
  async printUnpaidRelaunch(@Query() payload: RelauchDto) {
    return await this.patientService.relauch(payload);
  }
}
