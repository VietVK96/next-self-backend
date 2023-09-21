import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartVitalController } from './cart-vital.controller';
import { CartVitalService } from './services/cart-vital.service';
import { UserEntity } from 'src/entities/user.entity';
import { SesamvitaleTeletranmistionService } from 'src/caresheets/service/sesamvitale-teletranmistion.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), HttpModule],

  providers: [CartVitalService, SesamvitaleTeletranmistionService],
  controllers: [CartVitalController],
})
export class CartVitalModule {}
