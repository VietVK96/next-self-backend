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
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { ContraindicationsService } from './services/contradications.service';
import {
  CreateContraindicationsDto,
  SortableContraindicationsDto,
} from './dto/contraindications.dto';

@ApiBearerAuth()
@ApiTags('Contraindications')
@Controller('contraindications')
export class ContraindicationsController {
  constructor(private contraindicationsService: ContraindicationsService) {}

  /**
   * php/contraindications/index.php
   */
  @Get()
  @UseGuards(TokenGuard)
  async findAllContraindications(@CurrentUser() identity: UserIdentity) {
    return this.contraindicationsService.findAll(identity);
  }

  @Post()
  @UseGuards(TokenGuard)
  async create(
    @CurrentUser() identity: UserIdentity,
    @Body() body: CreateContraindicationsDto,
  ) {
    return this.contraindicationsService.create(
      identity.id,
      body,
      identity.org,
    );
  }

  @Put('sortable')
  @UseGuards(TokenGuard)
  async sortableContraindications(
    @Body() payload: SortableContraindicationsDto[],
  ) {
    return await this.contraindicationsService.sortable(payload);
  }

  @Put('/:id')
  @UseGuards(TokenGuard)
  async update(
    @CurrentUser() identity: UserIdentity,
    @Body() body: CreateContraindicationsDto,
    @Param('id') id: number,
  ) {
    return this.contraindicationsService.update(identity.id, body, id);
  }

  @Delete('/:id')
  @UseGuards(TokenGuard)
  async delete(@CurrentUser() identity: UserIdentity, @Param('id') id: number) {
    return this.contraindicationsService.delete(identity.id, id);
  }
}
