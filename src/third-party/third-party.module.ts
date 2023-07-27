import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { ThirdPartyController } from './third-party.controller';
import { ThirdPartyService } from './third-party.service';
import { UserEntity } from 'src/entities/user.entity';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { AmoEntity } from 'src/entities/amo.entity';
import { AmcEntity } from 'src/entities/amc.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContactEntity,
      UserEntity,
      ThirdPartyAmcEntity,
      ThirdPartyAmoEntity,
      AmoEntity,
      AmcEntity,
    ]),
  ],
  controllers: [ThirdPartyController],
  providers: [ThirdPartyService],
})
export class ThirdPartyModule {}
