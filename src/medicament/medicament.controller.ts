import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MedicamentService } from './services/medicament.service';
import {
  TokenGuard,
  CurrentUser,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { SearchMedicamentDto } from './dto/medicament.dto';

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
}
