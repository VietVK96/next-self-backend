import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorrespondentController } from './correspondent.controller';
import { CorrespondentEntity } from 'src/entities/correspondent.entity';
import { CorrespondentService } from './services/correspondent.service';
import { PhoneEntity } from 'src/entities/phone.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CorrespondentEntity, PhoneEntity])],
  controllers: [CorrespondentController],
  providers: [CorrespondentService],
})
export class CorrespondentModule {}
