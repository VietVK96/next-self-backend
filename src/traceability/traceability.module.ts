import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TraceabilityEntity } from 'src/entities/traceability.entity';
import { TraceabilityController } from './traceability.controller';
import { TraceabilityService } from './services/traceability.service';

@Module({
  imports: [TypeOrmModule.forFeature([TraceabilityEntity])],
  controllers: [TraceabilityController],
  providers: [TraceabilityService],
})
export class TraceabilityModule {}
