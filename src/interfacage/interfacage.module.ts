import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CcamEntity } from 'src/entities/ccam.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { FseEntity } from 'src/entities/fse.entity';
import { UserEntity } from 'src/entities/user.entity';
import { InterfacageController } from './interfacage.controller';
import { InterfacageService } from './services/interfacage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FseEntity,
      ContactEntity,
      UserEntity,
      EventTaskEntity,
      DentalEventTaskEntity,
      CcamEntity,
    ]),
  ],
  controllers: [InterfacageController],
  providers: [InterfacageService],
})
export class InterfacageModule {}
