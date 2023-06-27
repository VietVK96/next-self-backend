import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { Repository } from 'typeorm';
import { StoreNoteDto } from '../dto/noteStore.dto';
import { UserService } from 'src/user/services/user.service';
import { PatientService } from 'src/patients/service/patient.service';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(ContactNoteEntity)
    private readonly repo: Repository<ContactNoteEntity>,
    private userService: UserService,
    private patientService: PatientService,
  ) {}
  async store(payload: StoreNoteDto) {
    try {
      const note = await this.repo.save(payload);

      // TODO add LOG
      //Ids\Log::write('Commentaire', $patientId, 1);
      return await this.find(note.id);
    } catch (error) {
      return new CBadRequestException('Insert Comment Failure');
    }
  }

  //application/Services/PatientNote.php
  // find()
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
