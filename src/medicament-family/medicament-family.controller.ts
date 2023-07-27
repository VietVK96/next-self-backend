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
import { MedicamentFamilyService } from './services/medicament-family.service';
import {
  TokenGuard,
  CurrentUser,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CreateMedicamentFamilyDto } from './dto/medicament-family.dto';

@ApiBearerAuth()
@ApiTags('MedicamentFamily')
@Controller('/medicament-family')
export class MedicamentFamilyController {
  constructor(private medicamentFamilyService: MedicamentFamilyService) {}

  //settings/medicament-families/index.php
  //all line
  @Get()
  @UseGuards(TokenGuard)
  async findAll(@CurrentUser() identity: UserIdentity) {
    return this.medicamentFamilyService.findAll(identity.org);
  }

  //settings/medicament-families/create.php
  //all line
  @Post()
  @UseGuards(TokenGuard)
  async create(
    @CurrentUser() identity: UserIdentity,
    @Body() body: CreateMedicamentFamilyDto,
  ) {
    return this.medicamentFamilyService.create(identity.org, identity.id, body);
  }

  //settings/medicament-families/edit.php
  //all line
  @Put('/:id')
  @UseGuards(TokenGuard)
  async update(
    @CurrentUser() identity: UserIdentity,
    @Param('id') id: number,
    @Body() body: CreateMedicamentFamilyDto,
  ) {
    return this.medicamentFamilyService.update(identity.id, body, id);
  }

  //settings/medicament-families/delete.php
  //all line
  @Delete('/:id')
  @UseGuards(TokenGuard)
  async delete(@CurrentUser() identity: UserIdentity, @Param('id') id: number) {
    return this.medicamentFamilyService.delete(identity.id, id);
  }
}
