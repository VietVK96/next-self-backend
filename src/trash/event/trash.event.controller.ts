import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TrashEventService } from './service/trash.event.service';

@Controller('trash/event')
@ApiBearerAuth()
@ApiTags('Trash/Event')
export class TrashEventController {
  constructor(private readonly trashEventService: TrashEventService) {}
}
