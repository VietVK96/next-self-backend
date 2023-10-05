import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicenseEntity } from 'src/entities/license.entity';
import { LicenseService } from './services/license.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([LicenseEntity])],
  providers: [LicenseService],
  exports: [LicenseService],
})
export class LicenseModule {}
