import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CorrespondentService } from './services/correspondent.service';
import { Response } from 'express';

@Controller('correspondent')
@ApiTags('Correspondent')
@ApiBasicAuth()
export class CorrespondentController {
  constructor(private readonly correspondentService: CorrespondentService) {}

  /**?
   * php/suggest/correspondantLookup.php
   */
  @Get('lookup/:term')
  @UseGuards(TokenGuard)
  async lookUp(
    @CurrentUser() identity: UserIdentity,
    @Param('term') term: string,
  ) {
    return await this.correspondentService.lookUp(identity.org, term);
  }

  /**?
   * php/correspondent/find.php full
   */
  @Get('find/:id')
  @UseGuards(TokenGuard)
  async findById(@Param('id') id: number) {
    return await this.correspondentService.find(id);
  }

  /**?
   * /php/correspondent/save.php full
   */
  @Post()
  @UseGuards(TokenGuard)
  async save(@CurrentUser() identity: UserIdentity, @Body() payload: any) {
    return await this.correspondentService.save(identity.org, payload);
  }

  /**?
   * php/correspondent/type/findAll.php full
   *
   */
  @Get('/type')
  @UseGuards(TokenGuard)
  async findAllType(@Query('search') search?: string) {
    return await this.correspondentService.findAllType(search);
  }

  @Get()
  @UseGuards(TokenGuard)
  async findAllCorrespondents(
    @CurrentUser() identity: UserIdentity,
    @Query('search') search?: string,
    @Query('page') page?: number,
  ) {
    return await this.correspondentService.findAllCorrespondents(
      identity.org,
      search,
      page,
    );
  }
  @Delete('/:id')
  @UseGuards(TokenGuard)
  async delete(@CurrentUser() identity: UserIdentity, @Param('id') id: number) {
    return await this.correspondentService.delete(identity.id, id);
  }

  @Get('export/:id')
  @UseGuards(TokenGuard)
  async export(@Param('id') id: number, @Res() res: Response) {
    return await this.correspondentService.getExportQuery(res, id);
  }
}
