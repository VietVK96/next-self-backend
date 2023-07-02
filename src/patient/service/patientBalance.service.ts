import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import {
  PatientBalanceUpdatePayloadDto,
  PatientBalanceUpdateQueryDto,
} from '../dto/patientBalance.dto';
import { PatientService } from './patient.service';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { CashingEntity } from 'src/entities/cashing.entity';
import { CashingContactEntity } from 'src/entities/cashing-contact.entity';
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
      if (balance === patientUser.balance) {
        throw new CBadRequestException('you input same balance');
      }

      let newBalanceCare = patientUser.balance - balance;
      let newBalanceProsthesis = 0;
      if (
        newBalanceCare > patientUser.balanceCare &&
        patientUser.balanceProsthesis
      ) {
        newBalanceCare = patientUser.balanceCare;
        newBalanceProsthesis = balance - newBalanceCare;
      }

      const q = `
      INSERT INTO T_CASHING_CSG (USR_ID, CON_ID, CSG_DEBTOR, CSG_PAYMENT, CSG_AMOUNT, amount_care, amount_prosthesis)
					VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const payment = await this.dataSource.manager.query(q, [
        doctorId,
        patientId,
        'Mise à jour du montant dû',
        null,
        balance,
        newBalanceCare,
        newBalanceProsthesis,
      ]);

      const payees = await this.cashingContactRepo.find({
        where: {
          csgId: payment.insertId,
          conId: patientId,
          amount: balance,
          amountCare: newBalanceCare,
          amountProsthesis: newBalanceProsthesis,
        },
      });
      if (payees.length) {
        await this.dataSource.manager.query(
          `INSERT INTO T_CASHING_CONTACT_CSC (CSG_ID, CON_ID ,CSC_AMOUNT,	amount_care, amount_prosthesis)
        VALUES (?, ?, ?, ?, ?)`,
          [
            payment.insertId,
            patientId,
            balance,
            newBalanceCare,
            newBalanceProsthesis,
          ],
        );
      }
      return;
    } catch (error) {
      throw new CBadRequestException('Update Error');
    }
  }
}
