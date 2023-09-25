import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkstationController } from './workstation.controller';
import { WorkstationService } from './services/workstation.service';
import { WorkstationEntity } from 'src/entities/workstation.entity';
import { ImagingSoftwareEntity } from 'src/entities/imaging-software.entity';
import { ImagingSoftwareService } from './services/imaging-software.service';
import { CwfController } from './cwfse.controller';
import { JuxtalinkLaunchService } from './services/juxtalink-launch.service';
import { ImagingGatewayService } from './services/imaging-gateway.service';
import { ContactEntity } from 'src/entities/contact.entity';
import { UserEntity } from 'src/entities/user.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkstationEntity,
      ImagingSoftwareEntity,
      ContactEntity,
      UserEntity,
    ]),
    HttpModule,
  ],
  controllers: [WorkstationController, CwfController],
  providers: [
    WorkstationService,
    ImagingSoftwareService,
    JuxtalinkLaunchService,
    ImagingGatewayService,
  ],
})
export class WorkstationModule {}
