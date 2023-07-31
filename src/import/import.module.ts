import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportServices } from './services/import.service';

@Module({
  controllers: [ImportController],
  providers: [ImportServices],
})
export class ImportModule {}
