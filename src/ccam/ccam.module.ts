import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CcamEntity } from 'src/entities/ccam.entity';
import { DomtomMajorationEntity } from 'src/entities/domtom-majoration.entity';
import { DomtomEntity } from 'src/entities/domtom.entities';
import { CcamController } from './ccam.controller';
import { CcamServices } from './services/ccam.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CcamEntity,
      DomtomEntity,
      DomtomMajorationEntity,
    ]),
  ],
  controllers: [CcamController],
  providers: [CcamServices],
})
export class CcamModule {}
