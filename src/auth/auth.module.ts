import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JWT_LIFETIME, JWT_SECRET } from 'src/constatns/jwt';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UserEntity } from 'src/entities/user.entity';
import { AuthController } from './auth.controller';
import { SessionService } from './services/session.service';
import { ValidationService } from './services/validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, OrganizationEntity]),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: `${JWT_LIFETIME}s` },
    }),
  ],
  controllers: [AuthController],
  providers: [ValidationService, SessionService],
})
export class AuthModule {}
