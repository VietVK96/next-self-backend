import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { ContactEntity } from '../entities/contact.entity';
import { ContactModule } from 'src/contact/contact.module';
import { PermissionService } from 'src/user/services/permission.service';
import { CaresheetsController } from './caresheets.controller';
import { CaresheetsService } from './service/caresheets.service';
import { FseEntity } from 'src/entities/fse.entity';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { InterfacageService } from 'src/interfacage/services/interfacage.service';
import { PatientAmoEntity } from 'src/entities/patient-amo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContactEntity,
      UserEntity,
      FseEntity,
      EventTaskEntity,
      PatientAmoEntity,
    ]),
    forwardRef(() => ContactModule),
  ],
  controllers: [CaresheetsController],
  providers: [PermissionService, CaresheetsService, InterfacageService],
  exports: [CaresheetsService],
})
export class PatientModule {}
