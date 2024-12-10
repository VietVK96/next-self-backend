import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JWT_LIFETIME, JWT_SECRET } from 'src/constants/jwt';
import { UserEntity } from 'src/entities/user.entity';
import { AuthController } from './auth.controller';
import { SessionService } from './services/session.service';
import { ValidationService } from './services/validation.service';
import { JwtStrategy } from './jwt.strategy';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: `${JWT_LIFETIME}s` },
    }),
    CacheModule.register({}),
  ],
  controllers: [AuthController],
  providers: [ValidationService, SessionService, JwtStrategy],
  exports: [SessionService],
})
export class AuthModule {}
