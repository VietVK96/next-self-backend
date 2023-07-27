import { Module } from '@nestjs/common';
import { MedicamentController } from './medicament.controller';
import { MedicamentService } from './services/medicament.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicamentEntity } from 'src/entities/medicament.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicamentEntity])],
  controllers: [MedicamentController],
  providers: [MedicamentService],
})
export class MedicamentModule {}
