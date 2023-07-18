import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { ContactEntity } from '../entities/contact.entity';
import { ContactModule } from 'src/contact/contact.module';
import { CaresheetsController } from './caresheets.controller';
import { FseEntity } from 'src/entities/fse.entity';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { PatientAmoEntity } from 'src/entities/patient-amo.entity';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
import { CcamEntity } from 'src/entities/ccam.entity';
import { CaresheetStatusEntity } from 'src/entities/caresheet-status.entity';
import { InterfacageService } from 'src/interfacage/services/interfacage.service';
import { PermissionService } from 'src/user/services/permission.service';
import { CaresheetsService } from './service/caresheets.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContactEntity,
      UserEntity,
      DentalEventTaskEntity,
      FseEntity,
      EventTaskEntity,
      PatientAmoEntity,
      CcamEntity,
      CaresheetStatusEntity,
    ]),
    forwardRef(() => ContactModule),
    HttpModule,
  ],
  controllers: [CaresheetsController],
  providers: [PermissionService, CaresheetsService, InterfacageService],
  exports: [CaresheetsService],
})
export class CaresheetsModule {}
