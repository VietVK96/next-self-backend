import { Controller, Get, Query, Res } from '@nestjs/common';
import { PatientService } from './service/patient.service';
import { PatientExportDto } from './dto/index.dto';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';

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
}
