import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PatientBalanceUpdatePayloadDto,
  PatientBalanceUpdateQueryDto,
} from '../dto/patientBalance.dto';
import { PatientService } from './patient.service';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { CashingEntity } from 'src/entities/cashing.entity';
import { CashingContactEntity } from 'src/entities/cashing-contact.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { checkId, checkNumber } from 'src/common/util/number';
import { ErrorCode } from 'src/constants/error';
@Injectable()
export class PatientBalanceService {
  constructor(
    @InjectRepository(CashingEntity)
    private readonly paymentRepo: Repository<CashingEntity>,
    @InjectRepository(CashingContactEntity)
    private readonly cashingContactRepo: Repository<CashingContactEntity>,
    private patientService: PatientService,
    @InjectQueue('amount-due') private readonly amountDueQueue: Queue,
  ) {}
  // php/patients/balance/update.php 19->32
  // application/Service/Patient/BalanceService.php 37 -> 82
  async update(
    request: PatientBalanceUpdateQueryDto,
    payload: PatientBalanceUpdatePayloadDto,
    identity: UserIdentity,
  ) {
    try {
      const patientId = checkId(request.patient_id);
      const { balance, doctorId } = payload;
      const patientUser = await this.patientService.getPatientUser(
        doctorId,
        patientId,
      );

      const oldBalance = checkNumber(patientUser.amount);
      const oldBalanceCare = checkNumber(patientUser.amountCare);
      const oldBalanceProsthesis = checkNumber(patientUser.amountProsthesis);
      if (balance === oldBalance) {
        throw new CBadRequestException('you input same balance');
      }
      const newBalance = oldBalance - balance;
      let newBalanceCare = newBalance;
      let newBalanceProsthesis = 0;

      if (newBalanceCare > oldBalanceCare && oldBalanceProsthesis) {
        newBalanceCare = oldBalance;
        newBalanceProsthesis = newBalance - newBalanceCare;
      }

      const insertData: CashingEntity = {
        usrId: doctorId,
        conId: patientId,
        debtor: 'Mise à jour du montant dû',
        payment: null,
        amount: newBalance,
        amountCare: newBalanceCare,
        amountProsthesis: newBalanceProsthesis,
      };
      const payment = await this.paymentRepo.save(insertData);

      await this.cashingContactRepo.save({
        csgId: payment?.id,
        conId: patientId,
        amount: newBalance,
        amountCare: newBalanceCare,
        amountProsthesis: newBalanceProsthesis,
      });

      this.amountDueQueue.add('update', {
        groupId: identity.org,
      });

      return payment;
    } catch (error) {
      throw new CBadRequestException('Update Error');
    }
  }
  // php/patients/balance/delete.php 17->30
  // application/Service/Patient/BalanceService.php 93 -> 127
  async delete(
    request: PatientBalanceUpdateQueryDto,
    payload: PatientBalanceUpdatePayloadDto,
    identity: UserIdentity,
  ) {
    try {
      const patientId = checkId(request.patient_id);
      const { doctorId } = payload;
      const patientUser = await this.patientService.getPatientUser(
        doctorId,
        patientId,
      );
      const oldBalance = checkNumber(patientUser.amount);
      const oldBalanceCare = checkNumber(patientUser.amountCare);
      const oldBalanceProsthesis = checkNumber(patientUser.amountProsthesis);
      if (!oldBalance) {
        throw new CBadRequestException('Old balance' + ErrorCode.NOT_FOUND);
      }
      const paymentData: CashingEntity = {
        usrId: doctorId,
        conId: patientId,
        debtor: 'Remise à zéro du montant dû',
        payment: null,
        amount: oldBalance,
        amountCare: oldBalanceCare,
        amountProsthesis: oldBalanceProsthesis,
      };
      const payment = await this.paymentRepo.save(paymentData);

      await this.cashingContactRepo.save({
        csgId: payment?.id,
        conId: patientId,
        amount: oldBalance,
        amountCare: oldBalanceCare,
        amountProsthesis: oldBalanceProsthesis,
      });

      this.amountDueQueue.add('update', {
        groupId: identity.org,
      });

      return payment;
    } catch (error) {
      throw new CBadRequestException('Delete Error');
    }
  }
}
