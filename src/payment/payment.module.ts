import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { CashingEntity } from 'src/entities/cashing.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionService } from 'src/user/services/permission.service';
import { CashingContactEntity } from 'src/entities/cashing-contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CashingEntity, CashingContactEntity])],
  controllers: [PaymentController],
  providers: [PaymentService, PermissionService],
})
export class PaymentModule {}