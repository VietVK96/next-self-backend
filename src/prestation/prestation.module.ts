import { Module } from '@nestjs/common';
import { PrestationController } from './prestation.controller';
import { PrestationService } from './services/prestation.service';
import { PermissionService } from '../user/services/permission.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [PrestationController],
  providers: [PrestationService, PermissionService],
})
export class PrestationModule {}
