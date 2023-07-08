import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContraindicationEntity } from 'src/entities/contraindication.entity';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { ContraindicationsController } from './contraindications.controller';
import { ContraindicationsService } from './services/contradications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContraindicationEntity, OrganizationEntity]),
  ],
  controllers: [ContraindicationsController],
  providers: [ContraindicationsService],
})
export class ContraindicationsModule {}
