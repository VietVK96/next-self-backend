import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UserEntity } from 'src/entities/user.entity';
import { PatientController } from './patient.controller';
import { PatientService } from './service/patient.service';
import { ContactEntity } from '../entities/contact.entity';
import { AddressEntity } from '../entities/address.entity';
import { PhoneEntity } from '../entities/phone.entity';
import { ContactModule } from 'src/contact/contact.module';
import { AddressModule } from 'src/address/address.module';
import { PatientBalanceController } from './patientBalance.controller';
import { PatientBalanceService } from './service/patientBalance.service';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { CashingEntity } from 'src/entities/cashing.entity';
import { CashingContactEntity } from 'src/entities/cashing-contact.entity';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { AmoEntity } from 'src/entities/amo.entity';
import { AmcEntity } from 'src/entities/amc.entity';
import { ContraindicationEntity } from 'src/entities/contraindication.entity';
import { PermissionService } from 'src/user/services/permission.service';

@Module({
  imports: [
    AddressModule,
    TypeOrmModule.forFeature([
      ContactEntity,
      UserEntity,
      OrganizationEntity,
      AddressEntity,
      PhoneEntity,
      CashingEntity,
      ContactUserEntity,
      CashingContactEntity,
      ThirdPartyAmcEntity,
      ThirdPartyAmoEntity,
      AmoEntity,
      AmcEntity,
      ContraindicationEntity,
    ]),
    forwardRef(() => ContactModule),
  ],
  controllers: [PatientController, PatientBalanceController],
  providers: [PermissionService, PatientService, PatientBalanceService],
  exports: [PatientService, PatientBalanceService],
})
export class PatientModule {}
