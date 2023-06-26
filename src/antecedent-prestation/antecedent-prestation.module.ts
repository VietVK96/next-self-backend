import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AntecedentPrestationController } from './antecedent-prestation.controller';
import { AntecedentPrestationService } from './services/antecedent-prestation.service';
import { AntecedentPrestationEntity } from 'src/entities/antecedentprestation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AntecedentPrestationEntity])],
  controllers: [AntecedentPrestationController],
  providers: [AntecedentPrestationService],
})
export class AntecedentPrestationModule {}
