import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
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
import { AuthMiddleware } from 'src/middleware/auth.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      OrganizationEntity,
      AddressEntity,
      UserMedicalEntity,
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
  ],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(
      { path: 'securities/verify-password', method: RequestMethod.POST },
      // Thêm các route khác mà bạn muốn sử dụng middleware trong đó
    );
  }
}
