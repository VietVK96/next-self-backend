import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import {
  PatientBalanceUpdatePayloadDto,
  PatientBalanceUpdateQueryDto,
} from '../dto/patientBalance.dto';
import { PatientService } from './patient.service';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { CashingEntity } from 'src/entities/cashing.entity';
import { CashingContactEntity } from 'src/entities/cashing-contact.entity';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
@Injectable()
export class PatientBalanceService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(ContactEntity)
    private readonly patientRepo: Repository<ContactEntity>,
    @InjectRepository(CashingEntity)
    private readonly paymentRepo: Repository<CashingEntity>,
    @InjectRepository(CashingContactEntity)
    private readonly cashingContactRepo: Repository<CashingContactEntity>,
    @InjectRepository(ContactUserEntity)
    private readonly contactUserRepo: Repository<ContactUserEntity>,
    private patientService: PatientService,
    private dataSource: DataSource,
  ) {}
  // php/patients/balance/update.php 19->32
  // application/Service/Patient/BalanceService.php 37 -> 82
  async update(
    request: PatientBalanceUpdateQueryDto,
    payload: PatientBalanceUpdatePayloadDto,
  ) {
    try {
      const patientId = +request.patient_id;
      const { balance, doctorId } = payload;
      const patientUser = await this.patientService.getPatientUser(
        doctorId,
        patientId,
      );
      if (balance === patientUser.amount) {
        throw new CBadRequestException('you input same balance');
      }

      let newBalanceCare = patientUser.amount - balance;
      let newBalanceProsthesis = 0;
      if (
        newBalanceCare > patientUser.amountCare &&
        patientUser.amountProsthesis
      ) {
        newBalanceCare = patientUser.amountCare;
        newBalanceProsthesis = balance - newBalanceCare;
      }

      const insertData: CashingEntity = {
        usrId: doctorId,
        conId: patientId,
        debtor: 'Mise à jour du montant dû',
        payment: null,
        amount: balance,
        amountCare: newBalanceCare,
        amountProsthesis: newBalanceProsthesis,
      };
      const payment = await this.paymentRepo.save(insertData);

      await this.cashingContactRepo.save({
        csgId: payment?.id,
        conId: patientId,
        amount: balance,
        amountCare: newBalanceCare,
        amountProsthesis: newBalanceProsthesis,
      });
      const oldContactUser = await this.contactUserRepo.findOne({
        where: { conId: patientId, usrId: doctorId },
      });
      const contactUser: ContactUserEntity = {
        ...oldContactUser,
        amount: balance,
        amountCare: newBalanceCare,
        amountProsthesis: newBalanceProsthesis,
        usrId: doctorId,
        conId: patientId,
      };
      await this.contactUserRepo.save(contactUser);
      return payment;
    } catch (error) {
      throw new CBadRequestException('Update Error');
    }
  }
}
