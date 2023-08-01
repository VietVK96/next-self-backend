import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CcamEntity } from 'src/entities/ccam.entity';
import { CcamController } from './ccam.controller';
import { CcamServices } from './services/ccam.service';

@Module({
  imports: [TypeOrmModule.forFeature([CcamEntity])],
  controllers: [CcamController],
  providers: [CcamServices],
})
export class CcamModule {}
