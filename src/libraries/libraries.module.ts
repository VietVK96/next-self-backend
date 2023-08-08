import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CcamEntity } from 'src/entities/ccam.entity';
import { LibraryActFamilyEntity } from 'src/entities/library-act-family.entity';
import { LibraryActEntity } from 'src/entities/library-act.entity';
import { LibraryOdontogramEntity } from 'src/entities/library-odontogram.entity';
import { MedicalDeviceEntity } from 'src/entities/medical-device.entity';
import { NgapKeyEntity } from 'src/entities/ngapKey.entity';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { TariffTypeEntity } from 'src/entities/tariff-type.entity';
import { LibrariesController } from './libraries.controller';
import { LibraryActsService } from './services/acts.service';
import { LibrariesService } from './services/libraries.service';
import { LettersEntity } from '../entities/letters.entity';
import { LibraryActQuantityEntity } from 'src/entities/library-act-quantity.entity';
import { TraceabilityEntity } from 'src/entities/traceability.entity';
import { LibraryActAttachmentPivotEntity } from 'src/entities/library-act-attachment-pivot.entity';
import { LibraryActAssociationEntity } from 'src/entities/library-act-association.entity';
import { LibraryActOdontogramPivotEntity } from 'src/entities/library-act-odontogram-pivot.entity';
import { LibraryActQuantityTariffEntity } from 'src/entities/library-act-quantity-tariff.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LibraryActFamilyEntity,
      LibraryActEntity,
      OrganizationEntity,
      CcamEntity,
      NgapKeyEntity,
      MedicalDeviceEntity,
      LibraryOdontogramEntity,
      TariffTypeEntity,
      LettersEntity,
      LibraryActQuantityEntity,
      TraceabilityEntity,
      LibraryActAssociationEntity,
      LibraryActAttachmentPivotEntity,
      LibraryActOdontogramPivotEntity,
      LibraryActQuantityTariffEntity,
    ]),
  ],
  controllers: [LibrariesController],
  providers: [LibrariesService, LibrariesController, LibraryActsService],
})
export class LibrariesModule {}
