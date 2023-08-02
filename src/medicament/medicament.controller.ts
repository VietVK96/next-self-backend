import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MedicamentService } from './services/medicament.service';
import {
  TokenGuard,
  CurrentUser,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CreateMedicamentDto, SearchMedicamentDto } from './dto/medicament.dto';

@ApiBearerAuth()
@ApiTags('Medicament')
@Controller('/medicament')
export class MedicamentController {
  constructor(private medicamentService: MedicamentService) {}

  @Get()
  @UseGuards(TokenGuard)
  async findAllByName(
    @CurrentUser() identity: UserIdentity,
    @Query() payload: SearchMedicamentDto,
  ) {
    return this.medicamentService.findAllByName(identity.org, payload.name);
  }

  //settings/medicaments/create.php
  //line 1-56
  @Post()
  @UseGuards(TokenGuard)
  async create(
    @CurrentUser() identity: UserIdentity,
    @Body() body: CreateMedicamentDto,
  ) {
    return this.medicamentService.create(identity.org, identity.id, body);
  }

  //settings/medicaments/copy.php
  //line 1-35
  @Post('/copy/:id')
  @UseGuards(TokenGuard)
  async duplicate(@Param('id') id: number) {
    return this.medicamentService.duplicate(id);
  }

  //settings/medicaments/edit.php
  //line 1-55
  @Put('/:id')
  @UseGuards(TokenGuard)
  async update(
    @Param('id') id: number,
    @CurrentUser() identity: UserIdentity,
    @Body() body: CreateMedicamentDto,
  ) {
    return this.medicamentService.update(id, body, identity.id);
  }

  //settings/medicaments/delete.php
  //line 1-42
  @Delete('/:id')
  @UseGuards(TokenGuard)
  async delete(@Param('id') id: number, @CurrentUser() identity: UserIdentity) {
    return this.medicamentService.delete(id, identity.id);
  }
}
