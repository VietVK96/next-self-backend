import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
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
import {
  CreateImageSoftwareDto,
  CreateImageSoftwareQueryDto,
} from './dto/image-software.dto';

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

  @Get('/imaging-softwares/:workstationId')
  @UseGuards(TokenGuard)
  async findImagingSoftwares(@Param('workstationId') workstationId: number) {
    return this.imagingSoftwareService.getImagingSoftwaresByWorkstation(
      workstationId,
    );
  }

  @Post('/imaging-softwares')
  @UseGuards(TokenGuard)
  async createImagingSoftwares(
    @CurrentUser() identity: UserIdentity,
    @Query() query: CreateImageSoftwareQueryDto,
    @Body() body: CreateImageSoftwareDto,
  ) {
    return this.imagingSoftwareService.createImagingSoftwaresByWorkstationId(
      identity.org,
      query,
      body,
    );
  }

  @Get('/imaging-softwares/:id')
  @UseGuards(TokenGuard)
  async findOneImagingSoftwares(@Param('id') id: number) {
    return this.imagingSoftwareService.findOneImagingSoftwaresByWorkstationId(
      id,
    );
  }
}
