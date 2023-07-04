import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryActFamilyEntity } from 'src/entities/library-act-family.entity';
import { LibraryActEntity } from 'src/entities/library-act.entity';
import { LibrariesController } from './libraries.controller';
import { LibrariesService } from './services/libraries.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LibraryActFamilyEntity, LibraryActEntity]),
  ],
  controllers: [LibrariesController],
  providers: [LibrariesService, LibrariesController],
})
export class LibrariesModule {}
