import { Module } from '@nestjs/common';
import { PrestationController } from './prestation.controller';
import { PrestationService } from './services/prestation.service';
import { PermissionService } from '../user/services/permission.service';
import { UserModule } from '../user/user.module';
import { RadioAssociationService } from './services/radio-association.service';

@Module({
  imports: [UserModule],
  controllers: [PrestationController],
  providers: [PrestationService, PermissionService, RadioAssociationService],
  exports: [RadioAssociationService],
})
export class PrestationModule {}
