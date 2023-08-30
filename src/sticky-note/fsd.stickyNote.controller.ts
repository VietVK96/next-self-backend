import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { StoreOrgFsdDto } from './dto/store.org.fsd.dto';
import { FsdSticktNoteService } from './services/fsd.stickyNote.service';
import { StoreCommunicationFsdDto } from './dto/store.comunication.fsd.dto';

@ApiBearerAuth()
@ApiTags('Fsd')
@Controller('fsd')
export class FsdStickyNoteController {
  constructor(private fsdSticktNoteService: FsdSticktNoteService) {}

  // fsd/organizations/sticky-notes/store.php
  @Post('organizations/sticky-notes/store')
  @UseGuards(TokenGuard)
  async storeStickyOrgFsd(@Body() payload: StoreOrgFsdDto) {
    return await this.fsdSticktNoteService.storeStickyOrgFsd(payload);
  }

  // fsd/communication/store.php
  @Post('fsd/communication/store')
  @UseGuards(TokenGuard)
  async storeCommunicationFsd(@Body() payload: StoreCommunicationFsdDto) {
    return await this.fsdSticktNoteService.storeCommunicationFsd(payload);
  }
}
