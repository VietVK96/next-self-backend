import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { Repository } from 'typeorm';
import { StoreNoteDto } from '../dto/noteStore.dto';
import { UserService } from 'src/user/services/user.service';
import { PatientService } from 'src/patients/service/patient.service';

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(ContactNoteEntity)
    private readonly repo: Repository<ContactNoteEntity>,
    private userService: UserService,
    private patientService: PatientService,
  ) {}
  async store(payload: StoreNoteDto) {
    const note = await this.repo.save(payload);
    const res = await this.find(note.id);
    return res;
  }

  async find(id: number) {
    const notes = await this.repo.find({
      where: {
        id,
      },
      relations: {
        patient: true,
      },
    });
    const note = notes[0];

    if (note.userId) {
      const doctorPR = this.userService.find(note.userId);
      const patientPR = this.patientService.find(note.conId);
      const [doctor, patient] = await Promise.all([doctorPR, patientPR]);
      return {
        id: note.id,
        date: note.date,
        color: note.color,
        message: note.message,
        doctor: {
          ...doctor,
        },
        patient,
      };
    }
  }
}
