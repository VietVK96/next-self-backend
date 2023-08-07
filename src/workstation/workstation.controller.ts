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
  // /workstations/imaging-softwares/index.php?workstation_id=
  @Get('/imaging-softwares')
  @UseGuards(TokenGuard)
  async findImagingSoftwaresByWorkstationId(
    @Query('workstationId') id: number,
  ) {
    return this.imagingSoftwareService.getImagingSoftwaresByWorkstationId(id);
  }

  //create
  // /workstations/imaging-softwares/imaging-softwares.php?workstation_id=
  // /workstations/imaging-softwares/create.php?workstation_id=&imaging_software=
  @Get('/imaging-softwares/imaging-softwares')
  @UseGuards(TokenGuard)
  async findImagingSoftwaresTemplateOfWorkstationPlatform(
    @Query() query: CreateImageSoftwareQueryDto,
  ) {
    return this.imagingSoftwareService.getImagingSoftwaresTemplateOfWorkstationPlatform(
      query,
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

  //update
  // /workstations/imaging-softwares/edit.php?workstation_id=&id=
  @Get('/imaging-softwares/:id')
  @UseGuards(TokenGuard)
  async findImagingSoftwaresById(
    @Query('workstationId') workstationId: number,
    @Param('id') id: number,
  ) {
    return this.imagingSoftwareService.getImagingSoftwaresById(
      workstationId,
      id,
    );
  }

  @Put('/imaging-softwares/:id')
  @UseGuards(TokenGuard)
  async updateImagingSoftwares(
    @Query('workstationId') workstationId: number,
    @Body() payload: CreateImageSoftwareDto,
    @Param('id') id: number,
  ) {
    return this.imagingSoftwareService.updateImagingSoftwaresByWorkstationId(
      id,
      workstationId,
      payload,
    );
  }

  @Delete('/imaging-softwares/:id')
  @UseGuards(TokenGuard)
  async deleteImagingSoftwares(@Param('id') id: number) {
    return this.imagingSoftwareService.deleteImagingSoftwaresById(id);
  }
}
