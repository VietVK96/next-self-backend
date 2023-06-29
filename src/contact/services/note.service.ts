import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm/repository/Repository';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { SuccessResponse } from 'src/common/response/success.res';
import { StoreNoteDto } from '../dto/noteStore.dto';
import { UserService } from 'src/user/services/user.service';
import { PatientService } from 'src/patient/service/patient.service';

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

  async findByID(id: number) {
    return await this.repo.find({
      where: { id: id },
      relations: {
        patient: true,
        contact: true,
        user: true,
      },
    });
  }

  async deleteByID(id: number): Promise<SuccessResponse> {
    // @TODO: Vérification de la permission de suppression des modèles de courriers.
    // if (!$em->getRepository('App\Entities\User')->hasPermission('PERMISSION_DELETE', 8, $userId)) {
    // Response::abort(Response::STATUS_FORBIDDEN);
    // }
    try {
      const contactNote = await this.findByID(id);
      if (!contactNote)
        throw new CBadRequestException(ErrorCode.NOT_FOUND_CONTACT);

      const deleteContactNote = await this.repo.delete(id);
      if (deleteContactNote.affected === 0) {
        throw new CBadRequestException(ErrorCode.DELETE_UNSUCCESSFUL);
      }

      return {
        success: true,
      };
    } catch (error) {
      throw new CBadRequestException(error?.response?.msg || error?.sqlMessage);
    }
  }
}
