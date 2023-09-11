import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JWT_LIFETIME, JWT_SECRET } from 'src/constants/jwt';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UserEntity } from 'src/entities/user.entity';
import { AuthController } from './auth.controller';
import { SessionService } from './services/session.service';
import { ValidationService } from './services/validation.service';
import { AddressEntity } from 'src/entities/address.entity';
import { JwtStrategy } from './jwt.strategy';
import { GetSessionService } from './services/get-session.service';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { UserAmoEntity } from 'src/entities/user-amo.entity';
import { UserConnectionService } from 'src/user/services/user-connection.service';
import { UserConnectionEntity } from 'src/entities/user-connection.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      OrganizationEntity,
      AddressEntity,
      UserMedicalEntity,
      UserAmoEntity,
      UserConnectionEntity,
    ]),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: `${JWT_LIFETIME}s` },
    }),
  ],
  controllers: [AuthController],
  providers: [
    ValidationService,
    SessionService,
    JwtStrategy,
    GetSessionService,
    UserConnectionService,
  ],
  exports: [GetSessionService, SessionService],
})
export class AuthModule {}
