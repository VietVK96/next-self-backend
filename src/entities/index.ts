import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UserEntity } from 'src/entities/user.entity';
import { AddressEntity } from 'src/entities/address.entity';
import { UploadEntity } from './upload.entity';
import { TagEntity } from './tag.entity';
import { LibraryBankEntity } from './library-bank.entity';
import { CashingEntity } from './cashing.entity';
import { NgapKeyEntity } from './ngapKey.entity';
import { LibraryActFamilyEntity } from './library-act-family.entity';
import { LibraryActEntity } from './library-act.entity';
import { LibraryActQuantityEntity } from './library-act-quantity.entity';
import { ReminderUnitEntity } from './reminder-unit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      OrganizationEntity,
      AddressEntity,
      UploadEntity,
      TagEntity,
      LibraryBankEntity,
      CashingEntity,
      NgapKeyEntity,
      LibraryActFamilyEntity,
      LibraryActEntity,
      LibraryActQuantityEntity,
    ]),
  ],
  controllers: [],
  providers: [],
})
export class EntityModule {}
