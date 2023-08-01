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
import { WorkstationService } from './services/workstation.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CreateWorkstationDto } from './dto/workstation.dto';
import { ImagingSoftwareService } from './services/imaging-software.service';

@ApiBearerAuth()
@ApiTags('Workstation')
@Controller('workstation')
export class WorkstationController {
  constructor(
    private workstationService: WorkstationService,
    private imagingSoftwareService: ImagingSoftwareService,
  ) {}
  @Get()
  @UseGuards(TokenGuard)
  async findAll(@CurrentUser() identity: UserIdentity) {
    return this.workstationService.getWorkstations(identity.org);
  }

  @Post()
  @UseGuards(TokenGuard)
  async create(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: CreateWorkstationDto,
  ) {
    return this.workstationService.createWorkstations(identity.org, payload);
  }

  @Put('/:id')
  @UseGuards(TokenGuard)
  async update(@Param('id') id: number, @Body() payload: CreateWorkstationDto) {
    return this.workstationService.updateWorkstations(id, payload);
  }

  @Delete('/:id')
  @UseGuards(TokenGuard)
  async delete(@Param('id') id: number) {
    return this.workstationService.deleteWorkstations(id);
  }

  //imagin-softwware

  @Get('/imaging-softwares')
  @UseGuards(TokenGuard)
  async findImagingSoftwares(
    @CurrentUser() identity: UserIdentity,
    @Param('workstation_id') id: number,
  ) {
    return this.imagingSoftwareService.getImagingSoftwaresByWorkstationId(id);
  }
}
