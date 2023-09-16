import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TexterService } from './services/texter.service';
import { UserSmsEntity } from 'src/entities/user-sms.entity';
import { SendingLogEntity } from 'src/entities/sending-log.entity';
import { UserEntity } from 'src/entities/user.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, SendingLogEntity, UserSmsEntity]),
    UserModule,
  ],
  controllers: [],
  providers: [TexterService],
  exports: [TexterService],
})
export class NotifierModule {}
