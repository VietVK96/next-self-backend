import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsService } from './services/jobs.service';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  providers: [JobsService],
  controllers: [],
  exports: [],
})
export class JobsModule {}
