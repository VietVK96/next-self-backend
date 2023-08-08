import { Module } from '@nestjs/common';
import { BordereauxService } from './bordereaux.service';
import { BordereauxController } from './bordereaux.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlipCheckEntity } from 'src/entities/slip-check.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SlipCheckEntity])],
  controllers: [BordereauxController],
  providers: [BordereauxService],
})
export class BordereauxModule {}
