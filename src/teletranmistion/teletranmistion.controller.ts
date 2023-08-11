import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { SaveTeletranmistionDto } from './dto/save-teletranmistion.dto';
import { TeletranmistionService } from './services/teletranmistion.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { ConsulterUtlDto } from './dto/user-teletransmission.dto';

@Controller('/teletransmission')
@ApiTags('Teletransmission')
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
  @Post('/:id')
  @UseGuards(TokenGuard)
  @ApiProperty({
    description: 'Create teletransmission',
  })
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

  @Post('/account/interfaceage')
  @UseGuards(TokenGuard)
  async postInterfaceageActivation(
    @CurrentUser() identity: UserIdentity,
    @Body() consulterUtlDto: ConsulterUtlDto,
  ) {
    return await this.userTeletranmistionService.postInterfaceageActivation(
      identity.id,
      consulterUtlDto,
    );
  }

  @Get('/account/interfaceage')
  @UseGuards(TokenGuard)
  async getInterfaceageActivation(@CurrentUser() identity: UserIdentity) {
    return await this.userTeletranmistionService.getInterfaceageActivation(
      identity.org,
    );
  }
}
