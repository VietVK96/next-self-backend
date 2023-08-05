import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentReminderLibrarieController } from './appointmentReminderLibrarie.controller';
import { AppointmentReminderLibrarieService } from './services/AppointmentReminderLibrarie.service';
import { UserEntity } from 'src/entities/user.entity';
import { ReminderTypeEntity } from 'src/entities/reminder-type.entity';
import { ReminderUnitEntity } from 'src/entities/reminder-unit.entity';
import { ReminderReceiverEntity } from 'src/entities/reminder-receiver.entity';
import { AppointmentReminderLibraryEntity } from 'src/entities/appointment-reminder-library.entity';
import { PhoneTypeEntity } from 'src/entities/phone-type.entity';
import { PhoneEntity } from 'src/entities/phone.entity';
import { UploadEntity } from 'src/entities/upload.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      ReminderTypeEntity,
      ReminderReceiverEntity,
      ReminderUnitEntity,
      AppointmentReminderLibraryEntity,
      PhoneTypeEntity,
      PhoneEntity,
      UploadEntity,
    ]),
  ],
  controllers: [AppointmentReminderLibrarieController],
  providers: [AppointmentReminderLibrarieService],
})
export class AppointmentReminderLibrarieModule {}
