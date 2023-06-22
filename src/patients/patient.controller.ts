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
import { PatientExportDto } from './dto/index.dto';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';

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

  @Delete('delete/:id')
  @UseGuards(TokenGuard)
  async delete(@Param('id') id: number) {
    return await this.patientService.deletePatient(id);
  }
}
