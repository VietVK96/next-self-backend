import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { SuccessResponse } from 'src/common/response/success.res';
import { LibraryActFamilyEntity } from 'src/entities/library-act-family.entity';
import { LibraryActEntity } from 'src/entities/library-act.entity';
import {
  ActFamiliesDto,
  ActFamiliesSearchDto,
  ActFamiliesStoreDto,
  ActFamiliesUpdateDto,
  ActsIndexDto,
} from './dto/act-families.dto';
import { ActsStoreDto } from './dto/library-act.store.dto';
import { LibraryActsService } from './services/acts.service';
import { LibrariesService } from './services/libraries.service';
import { AcFamiliesCopyRes } from './res/act-families.res';

@ApiTags('Libraries')
@Controller('libraries')
@ApiBearerAuth()
export class LibrariesController {
  constructor(
    private librariesService: LibrariesService,
    private actService: LibraryActsService,
  ) {}

  /**
   * php/libraries/act-families/acts/index.php 100%
   */
  @Get('act-families/index/:id')
  @UseGuards(TokenGuard)
  async getActFamilies(
    @Param('id') id: number,
    @CurrentUser() identity: UserIdentity,
    @Query() request: ActFamiliesDto,
  ): Promise<LibraryActEntity[]> {
    return await this.librariesService.indexActByActFamilyId(
      id,
      identity,
      request,
    );
  }

  /**
   * File: php/libraries/act-families/index.php
   */
  @Get('act-families/index')
  @UseGuards(TokenGuard)
  async indexActFamily(
    @Query() request: ActFamiliesDto,
    @CurrentUser() identity: UserIdentity,
  ): Promise<LibraryActFamilyEntity[]> {
    return await this.librariesService.indexActFamily(request, identity);
  }

  @Post('act-families/store')
  @UseGuards(TokenGuard)
  async storeActFamily(
    @Body() request: ActFamiliesStoreDto,
    @CurrentUser() identity: UserIdentity,
  ): Promise<any> {
    return await this.librariesService.storeActFamily(request, identity);
  }

  /**
   * File: php/libraries/act-families/copy.php
   */
  @Post('act-families/copy/:id')
  @UseGuards(TokenGuard)
  async copyActFamily(
    @Param('id') id: number,
    @CurrentUser() identity: UserIdentity,
  ): Promise<any> {
    return await this.librariesService.copyActFamily(id, identity);
  }

  /**
   * php/libraries/act-families/acts/delete.php 100%
   */
  @UseGuards(TokenGuard)
  @Delete('act-families/delete/:id')
  async deleteActFamily(@Param('id') id: number): Promise<SuccessResponse> {
    return await this.librariesService.deleteActFamily(id);
  }

  /**
   * php/libraries/act-families/acts/update.php 100%
   */
  @UseGuards(TokenGuard)
  @Put('act-families/update/:id')
  async updateActFamily(
    @Param('id') id: number,
    @Body() req: ActFamiliesUpdateDto,
  ): Promise<any> {
    return await this.librariesService.updateActFamily(id, req);
  }

  /**
   * php/libraries/act-families/acts/index.php 100%
   */
  @Get('act-families/show/:id')
  @UseGuards(TokenGuard)
  async showActFamilies(
    @Param('id') id: number,
    @CurrentUser() identity: UserIdentity,
  ): Promise<LibraryActFamilyEntity> {
    return await this.librariesService.showActFamily(id, identity);
  }

  /**
   * File: php/libraries/acts/copy.php 100%
   */
  @Post('acts/copy/:id')
  @UseGuards(TokenGuard)
  async actsIndex(
    @CurrentUser() identity,
    @Param('id') id: number,
  ): Promise<any> {
    return await this.librariesService.actsCopy(id, identity);
  }

  /**
   * File: php/libraries/acts/store.php 100%
   */
  @Post('acts/store')
  @UseGuards(TokenGuard)
  async actsStore(
    @Body() request: ActsStoreDto,
    @CurrentUser() user: UserIdentity,
  ) {
    return await this.librariesService.actsStore(user, request);
  }

  /**
   * File: php/libraries/acts/update.php 100%
   */
  @Put('acts/update/:id')
  @UseGuards(TokenGuard)
  async actsUpdate(
    @Param('id') id: number,
    @Body() request: ActsStoreDto,
    @CurrentUser() user: UserIdentity,
  ) {
    return await this.librariesService.actsUpdate(id, user, request);
  }

  /**
   * File: php/libraries/acts/delete.php 100%
   */
  @Delete('acts/delete/:id')
  @UseGuards(TokenGuard)
  async actsDelete(@Param('id') id: number): Promise<SuccessResponse> {
    return await this.librariesService.actsDelete(id);
  }

  /**
   * File: php/libraries/acts/show.php 100%
   */
  @Get('acts/show')
  @UseGuards(TokenGuard)
  async actsShow(@Query() payload: ActFamiliesDto): Promise<any> {
    return await this.librariesService.actsShow(payload);
  }

  /**
   * File: php/libraries/acts-families/show.php 100%
   */
  @Get('acts/:id')
  @UseGuards(TokenGuard)
  async getActs(
    @Param('id') id: number,
    @CurrentUser() identity: UserIdentity,
  ): Promise<LibraryActEntity> {
    return await this.actService.getActs(id, identity);
  }

  @Get('act-families-search')
  @UseGuards(TokenGuard)
  async searchActFamilies(
    @Query() request: ActFamiliesSearchDto,
    @CurrentUser() user,
  ) {
    return await this.librariesService.searchActFamilies(user, request);
  }

  /**
   * php/libraries/acts/index.php?search_term=
   *
   */
  @Get('acts-index')
  @UseGuards(TokenGuard)
  async searchlibrariesActs(@Query() payload: ActsIndexDto) {
    return await this.librariesService.getAtcsBySearchTermAndOnltUsed(payload);
  }

  @Put('sortable')
  @UseGuards(TokenGuard)
  async sortableLibraryActFamily(@Body() payload: AcFamiliesCopyRes[]) {
    return await this.librariesService.sortableLibraryActFamily(payload);
  }

  @Put('acts-sortable')
  @UseGuards(TokenGuard)
  async sortableLibraryAct(@Body() payload: AcFamiliesCopyRes[]) {
    return await this.actService.sortableLibraryAct(payload);
  }
}
