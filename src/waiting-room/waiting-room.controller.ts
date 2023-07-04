import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FindWaitingService } from './services/find.waiting.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

@ApiBearerAuth()
@ApiTags('Waiting Room')
@Controller('waiting-room')
export class WaitingRoomController {
  constructor(private findWaitingService: FindWaitingService) {}

  @Get()
  @ApiQuery({
    name: 'practitioner_id',
    type: 'string',
  })
  @UseGuards(TokenGuard)
  async findAll(
    @Query() request: { practitioner_id: string },
    @CurrentUser() identity: UserIdentity,
  ) {
    const practitionerId = Number(request.practitioner_id);
    return this.findWaitingService.findAll(
      identity.org,
      identity.id,
      practitionerId,
    );
  }
}
