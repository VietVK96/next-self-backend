import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LibraryActFamilyEntity } from 'src/entities/library-act-family.entity';
import { ActFamiliesDto } from './dto/act-families.dto';
import { LibrariesService } from './services/libraries.service';

@ApiTags('Libraries')
@Controller('libraries')
export class LibrariesController {
  constructor(private librariesService: LibrariesService) {}

  /**
   * File: php/libraries/act-families/index.php
   */
  @Get('act-families')
  async get(
    @Query() request: ActFamiliesDto,
  ): Promise<LibraryActFamilyEntity[]> {
    return await this.librariesService.getALl(request);
  }
}
