import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { ContactNoteEntity } from 'src/entities/contact-note.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { SuccessResponse } from 'src/common/response/success.res';

@Injectable()
export class ContactNoteServices {
  constructor(
    @InjectRepository(ContactNoteEntity)
    private contactNoteRepository: Repository<ContactNoteEntity>,
  ) {}

  async findByID(id: number) {
    return await this.contactNoteRepository.find({
      where: { id: id },
      relations: {
        patient: true,
        contact: true,
        user: true,
      },
    });
  }

  async deleteByID(id: number): Promise<SuccessResponse> {
    // Vérification de la permission de suppression des modèles de courriers.
    // if (!$em->getRepository('App\Entities\User')->hasPermission('PERMISSION_DELETE', 8, $userId)) {
    // Response::abort(Response::STATUS_FORBIDDEN);
    // }
    try {
      const contactNote = await this.findByID(id);
      if (!contactNote)
        throw new CBadRequestException(ErrorCode.NOT_FOUND_CONTACT);

      const deleteContactNote = await this.contactNoteRepository.delete(id);
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
