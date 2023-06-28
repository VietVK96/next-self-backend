import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { AntecedentPrestationService } from './services/antecedent-prestation.service';
import { FindAllStructDto } from './dto/findAll.antecedent-prestation.dto';
import { SaveStructDto } from './dto/save.antecedent-prestation.dto';
import { DeleteStructDto } from './dto/delete.antecedent-prestation.dto';

@ApiBearerAuth()
@Controller('/antecedent-prestation')
@ApiTags('AntecedentPrestation')
export class AntecedentPrestationController {
  constructor(
    private antecedentPrestationService: AntecedentPrestationService,
  ) {}

  //File php/contact/antecedentPrestation/findAll.php
  @Get()
  @UseGuards(TokenGuard)
  async findAllAntecedentPrestation(
    @Query() payload: FindAllStructDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.antecedentPrestationService.findAll(payload, identity.org);
  }

  @Post()
  @UseGuards(TokenGuard)
  async createAntecedentPrestation(@Body() payload: SaveStructDto) {
    return this.antecedentPrestationService.save(payload);
  }

  @Put()
  @UseGuards(TokenGuard)
  async updateAntecedentPrestation(@Body() payload: SaveStructDto) {
    return this.antecedentPrestationService.save(payload);
  }

  @Delete()
  @UseGuards(TokenGuard)
  async deleteAntecedentPrestation(
    @Query() payload: DeleteStructDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.antecedentPrestationService.delete(payload, identity.org);
  }
}
