import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
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
  ActsShowDto,
  ActsStoreDto,
} from './dto/act-families.dto';
import { LibraryActsService } from './services/acts.service';
import { LibrariesService } from './services/libraries.service';

@ApiTags('Libraries')
@Controller('libraries')
@ApiBearerAuth()
export class LibrariesController {
  constructor(
    private librariesService: LibrariesService,
    private actService: LibraryActsService,
  ) {}

  /**
   * File: php/libraries/act-families/index.php
   */
  @Get('act-families')
  @UseGuards(TokenGuard)
  async get(
    @Query() request: ActFamiliesDto,
    @CurrentUser() identity: UserIdentity,
  ): Promise<LibraryActFamilyEntity[]> {
    return await this.librariesService.getALl(request, identity);
  }

  @Post('act-families/store')
  @UseGuards(TokenGuard)
  async store(
    @Query() request: ActFamiliesStoreDto,
    @CurrentUser() identity: UserIdentity,
  ): Promise<LibraryActFamilyEntity[]> {
    return await this.librariesService.storeActFamily(request, identity);
  }

  /**
   * File: php/libraries/act-families/copy.php
   */
  @Get('act-families/copy')
  @UseGuards(TokenGuard)
  async copy(
    @Query() request: ActFamiliesDto,
    @CurrentUser() identity: UserIdentity,
  ): Promise<LibraryActFamilyEntity[]> {
    return await this.librariesService.getALl(request, identity);
  }

  @UseGuards(TokenGuard)
  @Delete('act-families/delete/:id')
  async delete(@Param('id') id: number): Promise<SuccessResponse> {
    return await this.librariesService.deleteActFamilies(id);
  }

  /** php/libraries/act-families/acts/index.php 100%
   */
  @Get('act-families/:id')
  @UseGuards(TokenGuard)
  async getActFamilies(
    @Param('id') id: number,
    @CurrentUser() identity: UserIdentity,
    @Query() request: ActFamiliesDto,
  ): Promise<LibraryActEntity[]> {
    return await this.librariesService.getAct(id, identity, request);
  }

  /**
   * File: php/libraries/acts/show.php 100%
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
  @Post('acts/update/:id')
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
}
