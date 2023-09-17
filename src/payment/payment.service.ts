import { Injectable } from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionService } from 'src/user/services/permission.service';
import { CashingEntity } from 'src/entities/cashing.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { CashingContactEntity } from 'src/entities/cashing-contact.entity';
import { PerCode } from 'src/constants/permissions';
import { SuccessResponse } from 'src/common/response/success.res';
import { RecipeService } from 'src/recipe/services/recipe.service';
import * as dayjs from 'dayjs';
import { Response } from 'express';
import { ConditionDto } from 'src/recipe/dto/condition.dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(CashingContactEntity)
    private cashingContactRepository: Repository<CashingContactEntity>,
    @InjectRepository(CashingEntity)
    private readonly cashingRepository: Repository<CashingEntity>,
    private readonly permissionService: PermissionService,
    private readonly recipeService: RecipeService,
  ) {}

  async exportCielMac(
    user: number,
    conditions: ConditionDto[],
  ): Promise<string> {
    try {
      const modes = {
        espece: 'ESP',
        cheque: 'CHQ',
        carte: 'CCR',
        virement: 'VIR',
        prelevement: 'PRV',
      };

      const payments = await this.recipeService.findByDoctor(user, conditions, {
        limit: 0,
        offset: 0,
        order_by: '',
        order: 'ASC',
      });

      const content = [];

      // Entête du fichier
      content.push(
        [0, '', '', '', '', '', '', '', '', '', '', '', '', '', ''].join(
          '\x09',
        ) + '\x0D',
      );

      // Xử lý từng giao dịch
      for (const payment of payments) {
        let debtor = payment?.debtor;
        const entryDate = payment?.date;
        let date: Date | string = payment?.paymentDate || entryDate;
        const mode = payment?.payment;
        const amount = payment?.amount?.toString()?.replace('.', ',');

        date = dayjs(date)?.format('DD/MM/YY');

        // Partie versante
        if (payment.patient) {
          debtor = `Patient n°${payment?.patient[0]?.number}`;
        }

        let financialAccount = '512'; // Compte Financiers
        let productAccount = '700'; // Compte de Produit
        let thirdPartyAccount = 'Patient'; // Compte Tiers

        // Récupération du nom de la banque en fonction du mode de paiement
        switch (mode) {
          case 'espece':
            financialAccount = '530';
            break;
          case 'carte':
          case 'virement':
          case 'prelevement':
            if (payment.bank) {
              thirdPartyAccount = payment.bank[0]?.third_party_account;
              financialAccount = payment.bank[0]?.accounting_code;
              productAccount = payment.bank[0]?.product_account;
            }
            break;
        }

        content.push(
          [
            2,
            0,
            date,
            this.stripAccents(debtor),
            modes[mode],
            modes[mode],
            financialAccount,
            financialAccount,
            amount,
            '',
            '',
            '',
            '',
            '',
            '',
          ].join('\x09') + '\x0D',
        );

        content.push(
          [
            2,
            1,
            '',
            '',
            '',
            '',
            productAccount,
            productAccount,
            amount,
            '',
            '',
            '',
            '',
            '',
            '',
          ].join('\x09') + '\x0D',
        );

        content.push(
          [
            2,
            101,
            '',
            '',
            '',
            '',
            thirdPartyAccount,
            thirdPartyAccount,
            amount,
            '',
            '',
            '',
            '',
            '',
            '',
          ].join('\x09') + '\x0D',
        );

        // Thêm dòng trắng phân cách giữa các giao dịch
        content.push('\x0D');
      }

      return content.join('');
    } catch (error) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
  }

  private stripAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * File : php/payment/export-ciel-win.php 100%
   */
  async exportCielWin(user: number, conditions: ConditionDto[], res: Response) {
    const postComptable = 706910;
    // Lấy ngày hiện tại bằng dayjs
    const currentDate = dayjs().format('YYYYMMDD');

    // Tạo tên tệp mới
    const fileName = `${currentDate}weClever.txt`;
    try {
      const payments = await this.recipeService.findByDoctor(user, conditions, {
        limit: 0,
        offset: 0,
        order_by: '',
        order: 'ASC',
      });

      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${fileName}.txt`,
      );
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');

      const modes = {
        cheque: 'chq',
        carte: 'cb',
        espece: 'esp',
        virement: 'vir',
        prelevement: 'pre',
      };

      for (let i = 0; i < payments?.length; i++) {
        const payment = payments[i];
        let debtor: number | string = payment?.debtor;
        const entryDate = payment?.date;
        const dateSub = payment?.paymentDate || entryDate;
        const mode = payment?.payment;
        const amount = payment?.amount;

        const date = dayjs(dateSub).format('DD/MM/YYYY');

        if (payment?.patient?.length > 0) {
          debtor = `${payment?.patient[0]?.number} - ${payment.patient[0]?.lastname} ${payment.patient[0]?.firstname}`;
        }

        let bankName = '530000';
        switch (mode) {
          case 'cheque':
            bankName = '512000';
            break;
          case 'carte':
          case 'virement':
          case 'prelevement':
            bankName = '512000';
            if (payment.bank && payment?.bank[0]?.accounting_code) {
              bankName = payment?.bank[0]?.accounting_code;
            }
            break;
          default:
            break;
        }

        const line = [
          i + 1,
          'R',
          date,
          postComptable,
          debtor,
          '',
          0,
          amount,
          0,
          amount,
          '',
          '',
          bankName,
          modes[mode],
          '',
        ];

        res.write(line.join('\x09') + '\x0A');
      }
      res.end();
    } catch (error) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
  }

  // delete payment in table 'T_CASHING_CSG' and table 'T_CASHING_CONTACT_CSC'
  async remove(id: number, user: UserIdentity): Promise<SuccessResponse> {
    const userId = user.id;
    let payment: CashingEntity;
    try {
      payment = await this.cashingRepository.findOne({
        where: { id: id },
      });
    } catch (error) {
      throw new CBadRequestException(ErrorCode.QUERY_REPOSITORY_ERROR);
    }
    if (!payment) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }

    // check quyền
    const hasPermissionDelete = await this.permissionService.hasPermission(
      PerCode.PERMISSION_DELETE,
      8,
      userId,
    );
    const hasPermissionPaiement = await this.permissionService.hasPermission(
      PerCode.PERMISSION_PAIEMENT,
      8,
      userId,
      payment.usrId,
    );
    if (!hasPermissionDelete || !hasPermissionPaiement) {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }

    const queryRunner =
      this.cashingRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // delete in database
    try {
      const contacts = await this.cashingContactRepository.find({
        where: {
          cashing: { id: id },
        },
      });

      await this.cashingContactRepository.remove(contacts);

      await this.cashingRepository.remove(payment);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new CBadRequestException(ErrorCode.QUERY_REPOSITORY_ERROR);
    } finally {
      await queryRunner.release();
    }
    return { success: true };
  }
}
