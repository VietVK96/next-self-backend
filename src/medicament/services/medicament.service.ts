import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { MedicamentEntity } from 'src/entities/medicament.entity';

@Injectable()
export class MedicamentService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(MedicamentEntity)
    private medicamentRepo: Repository<MedicamentEntity>,
  ) {}

  async findAllByName(organizationId: number, name: string) {
    const result = await this.medicamentRepo.find({
      where: { name: Like(`%${name}%`), organizationId },
      relations: { family: true },
      order: {
        family: {
          position: 'ASC',
          name: 'ASC',
        },
        position: 'ASC',
        name: 'ASC',
      },
    });

    return result;
  }
}
