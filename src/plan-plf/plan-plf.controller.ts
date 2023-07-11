import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PlantPlfService } from './services/planplf.service';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('planplf')
@ApiBearerAuth()
@ApiTags('Planification')
export class PlantPlfController {
  constructor(private readonly plantPlfService: PlantPlfService) {}

  @Get('/:id')
  @UseGuards(TokenGuard)
  async getPlanificationContact(@Param('id') id: number) {
    return this.plantPlfService.getPlanificationContact(id);
  }
}
