import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CorrespondentService } from './services/correspondent.service';

@Controller('correspondent')
@ApiTags('Correspondent')
@ApiBasicAuth()
export class CorrespondentController {
  constructor(private readonly correspondentService: CorrespondentService) {}

  @Get('lookup/:term')
  @UseGuards(TokenGuard)
  async lookUp(
    @CurrentUser() identity: UserIdentity,
    @Param('term') term: string,
  ) {
    return await this.correspondentService.lookUp(identity.org, term);
  }

  @Get('find/:id')
  @UseGuards(TokenGuard)
  async findById(@Param('id') id: number) {
    return await this.correspondentService.find(id);
  }

  @Post()
  @UseGuards(TokenGuard)
  async save(@CurrentUser() identity: UserIdentity, @Body() payload: any) {
    return await this.correspondentService.save(identity.org, payload);
  }
}
