import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmountDueService } from './services/amount.due.services';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';
import { CreateAccountCmd } from './cmd/create-account.cmd';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ThirdPartyAmoEntity,
      ThirdPartyAmcEntity,
      ContactUserEntity,
    ]),
  ],
  controllers: [],
  providers: [AmountDueService, CreateAccountCmd],
  exports: [AmountDueService],
})
export class CommandModule {}
