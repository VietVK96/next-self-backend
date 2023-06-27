import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { Repository } from 'typeorm';
import { StoreNoteDto } from '../dto/noteStore.dto';
import { UserService } from 'src/user/services/user.service';

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(ContactNoteEntity)
    private readonly repo: Repository<ContactNoteEntity>,
    private userService: UserService,
  ) {}
  async store(payload: StoreNoteDto) {
    try {
      const note = await this.repo.save(payload);
      return await this.find(note.id);
    } catch (error) {}
  }

  async find(id: number) {
    const note = await this.repo.find({
      where: {
        id,
      },
      relations: {
        patient: true,
      },
    });
    console.log('doctor thanh', note[0].userId);

    if (note[0].userId) {
      const doctor = await this.userService.find(note[0].userId);
      console.log('doctor thanh', doctor);

      delete note[0].userId;
      delete note[0].conId;
      return {
        ...note[0],
        doctor: {
          ...doctor,
        },
      };
    }
  }
}
