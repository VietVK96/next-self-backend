import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrestationService } from './services/prestation.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { FindAllPrestationStructDto } from './dto/findAll.prestation.dto';
import { FindPrestationStructDto } from './dto/find.prestation.dto';
import { PrestationDto } from 'src/contact/dto/prestation.dto';

@ApiBearerAuth()
@ApiTags('Prestation')
@Controller('/prestation')
export class PrestationController {
  constructor(private prestationService: PrestationService) {}

  /**
   * /contact/prestation/findAll.php 1->14
   * @param payload
   * @param identity
   * @returns
   */
  @Get('/findAll')
  @UseGuards(TokenGuard)
  async findAllPrestation(
    @Query() payload: FindAllPrestationStructDto,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.prestationService.findAll(payload, identity.org);
  }

  /**
   * php/prestation/find.php line 1->8
   * @param payload
   * @returns
   */
  @Get('/find')
  @UseGuards(TokenGuard)
  async findPrestation(@Query() payload: FindPrestationStructDto) {
    return this.prestationService.find(payload);
  }

  /**
   * php/prestation/delete.php line 1->13
   * @param id
   * @param identity
   * @returns
   */
  @Delete('/:id')
  @UseGuards(TokenGuard)
  async deletePrestation(
    @Param('id') id: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.prestationService.delete(id, identity);
  }

  @Post('/save')
  @UseGuards(TokenGuard)
  async updatePrestation(@Body() payload: PrestationDto) {
    return await this.prestationService.updatePrestation(payload);
  }
}
