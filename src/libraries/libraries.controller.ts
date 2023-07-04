import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { LibraryActFamilyEntity } from 'src/entities/library-act-family.entity';
import { LibraryActEntity } from 'src/entities/library-act.entity';
import { ActFamiliesDto } from './dto/act-families.dto';
import { LibrariesService } from './services/libraries.service';

@ApiTags('Libraries')
@Controller('libraries')
@ApiBearerAuth()
export class LibrariesController {
  constructor(private librariesService: LibrariesService) {}

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

  /**
   * php/libraries/act-families/acts/index.php 100%
   */
  @Get('act-families/:id')
  @UseGuards(TokenGuard)
  async getAct(
    @Param('id') id: number,
    @CurrentUser() identity: UserIdentity,
    @Query() request: ActFamiliesDto,
  ): Promise<LibraryActEntity[]> {
    return await this.librariesService.getAct(id, identity, request);
  }
}
