import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkstationController } from './workstation.controller';
import { WorkstationService } from './services/workstation.service';
import { WorkstationEntity } from 'src/entities/workstation.entity';
import { ImagingSoftwareEntity } from 'src/entities/imaging-software.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkstationEntity, ImagingSoftwareEntity]),
  ],
  controllers: [WorkstationController],
  providers: [WorkstationService],
})
export class WorkstationModule {}
