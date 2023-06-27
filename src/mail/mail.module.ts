import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LettersEntity } from 'src/entities/letters.entity';
import { MailController } from './mail.controller';
import { MailService } from './services/find.mail.service';

@Module({
  imports: [TypeOrmModule.forFeature([LettersEntity])],
  controllers: [MailController],
  providers: [MailService],
})
export class MailModule {}
