import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { CreateAppointmentReminderLibrarieQueryDto } from '../dto/appointment-reminder-librarie.dto';
import { ReminderTypeEntity } from 'src/entities/reminder-type.entity';
import { ReminderReceiverEntity } from 'src/entities/reminder-receiver.entity';
import { ReminderUnitEntity } from 'src/entities/reminder-unit.entity';
import { AppointmentReminderLibraryEntity } from 'src/entities/appointment-reminder-library.entity';
import { PhoneTypeEntity } from 'src/entities/phone-type.entity';
import { ErrorCode } from 'src/constants/error';
import { PhoneEntity } from 'src/entities/phone.entity';
import { ConfigService } from '@nestjs/config';
import { UploadEntity } from 'src/entities/upload.entity';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

@Injectable()
export class AppointmentReminderLibrarieService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(ReminderTypeEntity)
    private reminderTypeRepository: Repository<ReminderTypeEntity>,
    @InjectRepository(ReminderReceiverEntity)
    private reminderReceiverRepository: Repository<ReminderReceiverEntity>,
    @InjectRepository(ReminderUnitEntity)
    private reminderUnitRepository: Repository<ReminderUnitEntity>,
    @InjectRepository(AppointmentReminderLibraryEntity)
    private appointmentReminderLibraryRepository: Repository<AppointmentReminderLibraryEntity>,
    @InjectRepository(PhoneTypeEntity)
    private phoneTypeRepository: Repository<PhoneTypeEntity>,
    @InjectRepository(UploadEntity)
    private uploadRepository: Repository<UploadEntity>,
    @InjectRepository(PhoneEntity)
    private phoneRepository: Repository<PhoneEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getAppointmentReminderLibrarie(id: number) {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: {
          appointmentReminderLibraries: {
            addressee: true,
            category: true,
            timelimitUnit: true,
            attachments: true,
          },
        },
      });
      return user.appointmentReminderLibraries;
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }

  async createAppointmentReminderLibrarie(
    orgId: number,
    userId: number,
    payload: CreateAppointmentReminderLibrarieQueryDto,
    files: Array<Express.Multer.File>,
  ) {
    const MAXIMUM_ATTACHMENT_SIZE = 10 * 1024 * 1024;
    try {
      let messageError = '';
      const addressee = await this.reminderReceiverRepository.findOne({
        where: { name: 'contact' },
      });
      const category = await this.reminderTypeRepository.findOne({
        where: { name: payload.category },
      });
      const timelimitUnit = await this.reminderUnitRepository.findOne({
        where: { name: payload.timelimit_unit },
      });
      if (files.length > 0 && category.name !== 'email') {
        messageError = `${messageError} Les pièces jointes ne peuvent être ajoutées qu'aux rappels de rendez-vous par e-mail.`;
      }
      const totalSize = files.reduce((total, file) => total + file.size, 0);
      if (totalSize > MAXIMUM_ATTACHMENT_SIZE) {
        messageError = `${messageError} MAXIMUM_ATTACHMENT_SIZE taille maximale des pièces jointes (10 Mo).`;
      }
      const countByUserId =
        await this.appointmentReminderLibraryRepository.count({
          where: { usrId: userId },
        });
      if (countByUserId >= 4) {
        messageError = `${messageError} Le nombre maximal de rappel de rendez-vous a été atteint.`;
      }
      const checkExistAppointmentReminderLibrarie =
        await this.appointmentReminderLibraryRepository.findOne({
          where: {
            usrId: userId,
            rmrId: addressee.id,
            RMTID: category.id,
            rmuId: timelimitUnit.id,
            timelimit: payload.timelimit,
          },
        });
      if (checkExistAppointmentReminderLibrarie) {
        messageError = `${messageError} Ce rappel de rendez-vous a déjà été configuré.`;
      }
      if (messageError) {
        return new CBadRequestException(messageError);
      }

      const attachments: UploadEntity[] = [];
      const auth = `${orgId.toString().padStart(5, '0')}`;
      const dir = await this.configService.get('app.uploadDir');
      for (const file of files) {
        const mimeTypes = file?.mimetype;
        const token = uuidv4();
        const uploadEntity = new UploadEntity();
        uploadEntity.path = `${auth}/`;
        uploadEntity.userId = userId;
        uploadEntity.fileName = `${auth}/${file?.originalname}`;
        uploadEntity.name = file.originalname;
        uploadEntity.type = mimeTypes;
        uploadEntity.size = file.size;
        uploadEntity.token = token;
        uploadEntity.user = await this.userRepository.findOne({
          where: { id: userId },
        });
        const dirFile = `${dir}/${auth}/${file?.originalname}`;
        if (!fs.existsSync(`${dir}/${auth}`)) {
          fs.mkdirSync(`${dir}/${auth}`, { recursive: true });
        }
        fs.writeFileSync(dirFile, file?.buffer);
        const savedUploadEntity = await this.uploadRepository.save(
          uploadEntity,
        );
        attachments.push(savedUploadEntity);
      }
      return await this.appointmentReminderLibraryRepository.save({
        usrId: userId,
        addressee: addressee,
        category: category,
        timelimitUnit: timelimitUnit,
        timelimit: payload.timelimit,
        attachmentCount: files.length,
        attachments: attachments,
      });
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }

  async deleteAppointmentReminderLibrarie(id: number) {
    try {
      const currentAppointmentReminderLibrarie =
        await this.appointmentReminderLibraryRepository.findOne({
          where: { id },
          relations: {
            attachments: true,
          },
        });
      if (!currentAppointmentReminderLibrarie) {
        return new CBadRequestException(
          'Not Found AppointmentReminderLibrarie',
        );
      }
      const attachments = currentAppointmentReminderLibrarie.attachments;
      const dir = await this.configService.get('app.uploadDir');
      for (const attachment of attachments) {
        await this.uploadRepository.remove(attachment);
        const dirFile = `${dir}/${attachment?.fileName}`;
        fs.unlinkSync(dirFile);
      }

      await this.appointmentReminderLibraryRepository.remove(
        currentAppointmentReminderLibrarie,
      );
      return {
        message: 'success',
      };
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }

  async updateMobilePhoneNumbers(userId: number) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user.admin) {
        return new CBadRequestException(ErrorCode.FORBIDDEN);
      }
      const phoneNumberCategory = await this.phoneTypeRepository.findOne({
        where: { name: 'sms' },
      });
      const queryBuilder =
        this.phoneRepository.createQueryBuilder('phoneNumber');

      queryBuilder.distinct();
      queryBuilder.innerJoin('phoneNumber.category', 'phoneNumberCategory');
      queryBuilder.innerJoin('phoneNumber.patients', 'patient');
      queryBuilder.andWhere(
        'phoneNumberCategory.name != :phoneNumberCategoryName',
        {
          phoneNumberCategoryName: 'sms',
        },
      );
      queryBuilder.andWhere(
        '(phoneNumber.nbr LIKE :phoneNumber1 OR phoneNumber.nbr LIKE :phoneNumber2)',
        {
          phoneNumber1: '06%',
          phoneNumber2: '07%',
        },
      );
      const iterableResult = await queryBuilder.getMany();
      iterableResult.forEach(async (item) => {
        item.ptyId = phoneNumberCategory.id;
        await this.phoneRepository.save(item);
      });
      return iterableResult;
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }
}
