import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SaveTeletranmistionDto } from './dto/save-teletranmistion.dto';
import { TeletranmistionService } from './services/teletranmistion.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

@Controller('/user')
@ApiTags('User')
@ApiBearerAuth()
export class UserTeletranmistionController {
  constructor(private userTeletranmistionService: TeletranmistionService) {}

  /**
  * File php: php/user/teletransmission.php
  * {external_reference_id: "5584"}
external_reference_id
: 
"5584"
  */
  @Post('/teletransmission/:id')
  @UseGuards(TokenGuard)
  async saveTeletranmission(
    @CurrentUser() identity: UserIdentity,
    @Param('id') doctorId: number,
    @Body() payload: SaveTeletranmistionDto,
    @Req() req: Request,
  ) {
    return await this.userTeletranmistionService.save(
      identity,
      doctorId,
      payload,
      req.headers['user-agent'] ?? '',
    );
  }
}
