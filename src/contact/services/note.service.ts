import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { SuccessResponse } from 'src/common/response/success.res';
import { StoreNoteDto } from '../dto/noteStore.dto';
import { UserService } from 'src/user/services/user.service';
import { PatientService } from 'src/patient/service/patient.service';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { UpdateNoteDto } from '../dto/noteUpdate.dto';
import { PermissionService } from 'src/user/services/permission.service';
import { PerCode } from 'src/constants/permissions';
import { CForbiddenRequestException } from 'src/common/exceptions/forbidden-request.exception';
import { Injectable } from '@nestjs/common';

@Injectable()
export class NoteService {
  constructor(
    private permissionService: PermissionService,
    @InjectRepository(ContactNoteEntity)
    private readonly repo: Repository<ContactNoteEntity>,
    private userService: UserService,
    private patientService: PatientService,
  ) {}
  async store(payload: StoreNoteDto, identity: UserIdentity) {
    try {
      const newNote = { ...payload, userId: identity.id };
      const note = await this.repo.save(newNote);

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

  async deleteByID(
    id: number,
    identity: UserIdentity,
  ): Promise<SuccessResponse> {
    if (
      !this.permissionService.hasPermission(
        PerCode.PERMISSION_DELETE,
        8,
        identity.id,
      )
    ) {
      throw new CForbiddenRequestException(ErrorCode.FORBIDDEN);
    }
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

  async update(payload: UpdateNoteDto) {
    await this.repo.save(payload);

    ///Ids\Log::write('Commentaire', $patientNote['patient']['id'], 2);
    // TODO create log
    return await this.find(payload?.id);
  }
}
