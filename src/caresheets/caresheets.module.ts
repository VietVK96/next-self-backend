import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { ContactEntity } from '../entities/contact.entity';
import { ContactModule } from 'src/contact/contact.module';
import { CashingEntity } from 'src/entities/cashing.entity';
import { PermissionService } from 'src/user/services/permission.service';
import { CaresheetsController } from './caresheets.controller';
import { CaresheetsService } from './service/caresheets.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContactEntity, UserEntity, CashingEntity]),
    forwardRef(() => ContactModule),
  ],
  controllers: [CaresheetsController],
  providers: [PermissionService, CaresheetsService],
  exports: [CaresheetsService],
})
export class PatientModule {}
