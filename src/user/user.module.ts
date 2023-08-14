import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressModule } from 'src/address/address.module';
import { UserEntity } from 'src/entities/user.entity';
import { PermissionService } from './services/permission.service';
import { UserService } from './services/user.service';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { UserController } from './user.controller';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { PreferenceService } from './services/preference.service';
import { JwtModule } from '@nestjs/jwt';
import { TokenDownloadService } from './services/token-download.service';
import { JWT_SECRET_DOWNLOAD } from 'src/constants/jwt';
import { UnpaidService } from './services/unpaid.service';
import { ContactEntity } from 'src/entities/contact.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserPreferenceEntity,
      UserMedicalEntity,
      ContactEntity,
    ]),
    AddressModule,
    JwtModule.register({
      secret: JWT_SECRET_DOWNLOAD,
    }),
  ],

  providers: [
    PermissionService,
    UserService,
    PreferenceService,
    TokenDownloadService,
    UnpaidService,
  ],
  exports: [PermissionService, UserService, PreferenceService, UnpaidService],
  controllers: [UserController],
})
export class UserModule {}
