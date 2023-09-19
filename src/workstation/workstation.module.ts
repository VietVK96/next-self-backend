import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkstationController } from './workstation.controller';
import { WorkstationService } from './services/workstation.service';
import { WorkstationEntity } from 'src/entities/workstation.entity';
import { ImagingSoftwareEntity } from 'src/entities/imaging-software.entity';
import { ImagingSoftwareService } from './services/imaging-software.service';
import { CwfController } from './cwfse.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkstationEntity, ImagingSoftwareEntity]),
  ],
  controllers: [WorkstationController, CwfController],
  providers: [WorkstationService, ImagingSoftwareService],
})
export class WorkstationModule {}
