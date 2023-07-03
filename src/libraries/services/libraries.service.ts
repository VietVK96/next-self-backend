import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LibraryActFamilyEntity } from 'src/entities/library-act-family.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ActFamiliesDto } from '../dto/act-families.dto';

@Injectable()
export class LibrariesService {
  constructor(
    @InjectRepository(LibraryActFamilyEntity)
    private libraryActRepo: Repository<LibraryActFamilyEntity>,
  ) {}

  /**
   * php/libraries/act-families/index.php 10 -> 22
   *
   */
  async getALl(request: ActFamiliesDto): Promise<LibraryActFamilyEntity[]> {
    const where: FindOptionsWhere<LibraryActFamilyEntity> = {};
    if (request.used_only) {
      where.used = 1;
    }
    const data = await this.libraryActRepo.find({
      order: {
        position: 'DESC',
      },
    });

    return data;
  }
}
