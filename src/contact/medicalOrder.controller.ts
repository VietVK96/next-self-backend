import { Controller, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { MedicalOrderService } from './services/medicalOrder.service';

@ApiBearerAuth()
@Controller('/medicalOrder')
@ApiTags('')
export class MedicalOrderController {
  constructor(private service: MedicalOrderService) {}
  @Delete('/delete/:id')
  @UseGuards(TokenGuard)
  async findAll(
    @Param('id') id: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return await this.service.deleteById(id, identity);
  }
}
