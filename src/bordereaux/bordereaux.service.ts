import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SlipCheckEntity } from 'src/entities/slip-check.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BordereauxService {
  constructor(
    @InjectRepository(SlipCheckEntity)
    private readonly slipCheckRepository: Repository<SlipCheckEntity>,
  ) {}

  /**
   * File php/bordereaux/show.php
   *
   * @param id
   * @returns
   */
  async findOne(id: number): Promise<SlipCheckEntity[]> {
    const slipCheck = this.slipCheckRepository.find({
      relations: ['libraryBank', 'cashings'],
      where: { id: id },
    });
    return slipCheck;
  }
}
