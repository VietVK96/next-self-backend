import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrescriptionTemplateService } from './services/prescription-template.service';
import {
  TokenGuard,
  CurrentUser,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CreatePrescriptionTemplateDto } from './dto/prescription-template.dto';

@ApiBearerAuth()
@ApiTags('PrescriptionTemplate')
@Controller('/prescription-template')
export class PrescriptionTemplateController {
  constructor(
    private prescriptionTemplateService: PrescriptionTemplateService,
  ) {}

  @Get()
  @UseGuards(TokenGuard)
  async findAll(@CurrentUser() identity: UserIdentity) {
    return this.prescriptionTemplateService.findAll(identity.org);
  }

  @Post()
  @UseGuards(TokenGuard)
  async create(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: CreatePrescriptionTemplateDto,
  ) {
    return this.prescriptionTemplateService.create(identity.org, payload);
  }

  @Put('/:id')
  @UseGuards(TokenGuard)
  async update(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: CreatePrescriptionTemplateDto,
    @Param('id') id: number,
  ) {
    return this.prescriptionTemplateService.upadte(identity.org, payload, id);
  }

  @Delete('/:id')
  @UseGuards(TokenGuard)
  async delete(@Param('id') id: number) {
    return this.prescriptionTemplateService.delete(id);
  }
}
