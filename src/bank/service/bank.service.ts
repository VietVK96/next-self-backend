/**
 * Repositories/Group.php
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { DataSource, Repository } from 'typeorm';
import { BankCheckPrintDto } from '../dto/bank.dto';
import { UserEntity } from 'src/entities/user.entity';
import { BankCheckEntity } from 'src/entities/bank-check.entity';
import { StringHelper } from 'src/common/util/string-helper';
import * as numberToWords from 'number-to-words';
import * as path from 'path';
import { createPdf } from '@saemhco/nestjs-html-pdf';
import * as dayjs from 'dayjs';
import { checkId, checkNumber } from 'src/common/util/number';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';

@Injectable()
export class BankService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(OrganizationEntity)
    private organizationRepo: Repository<OrganizationEntity>,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
    @InjectRepository(BankCheckEntity)
    private bankCheckRepo: Repository<BankCheckEntity>,
  ) {}

  async findAllBank(groupId: number, practitionerId: number) {
    const records = await this.dataSource.query(
      `SELECT
      LBK.LBK_ID id,
      LBK.LBK_ABBR abbr,
      LBK.LBK_NAME name,
      LBK.LBK_BANK_CODE bankCode,
      LBK.LBK_BRANCH_CODE branchCode,
      LBK.LBK_ACCOUNT_NBR accountNbr,
      LBK.LBK_BANK_DETAILS bankDetails,
      LBK.LBK_CURRENCY currency,
      LBK.LBK_SLIP_CHECK_NBR slipCheckNbr,
      LBK.LBK_POS pos,
      USR.USR_ID practitionerId,
      USR.USR_ABBR practitionerAbbr,
      USR.USR_LASTNAME practitionerLastname,
      USR.USR_FIRSTNAME practitionerFirstname,
      ADR.ADR_ID addressId,
      ADR.ADR_STREET addressStreet,
      ADR.ADR_STREET_COMP addressStreetComp,
      ADR.ADR_ZIP_CODE addressZipCode,
      ADR.ADR_CITY addressCity
    FROM T_LIBRARY_BANK_LBK LBK
    LEFT OUTER JOIN T_USER_USR USR ON USR.USR_ID = LBK.USR_ID
    LEFT OUTER JOIN T_ADDRESS_ADR ADR ON ADR.ADR_ID = LBK.ADR_ID
    WHERE LBK.organization_id = ?
      AND LBK.deleted_at IS NULL
      AND (LBK.USR_ID IS NULL OR LBK.USR_ID = ?)
    ORDER BY LBK.LBK_POS, LBK.LBK_ABBR`,
      [groupId, practitionerId],
    );
    return records;
  }

  async bankChecks(organizationId: number) {
    const organization = await this.organizationRepo.findOne({
      where: { id: organizationId },
      relations: {
        bankChecks: true,
      },
    });

    return organization.bankChecks.map(({ id, name, position }) => ({
      id,
      name,
      position,
    }));
  }

  async print(params: BankCheckPrintDto) {
    try {
      const id = checkId(params.id);
      const doctor_id = checkId(params.doctor_id);
      const amount = checkNumber(params.amount)
        ? Number(params.amount).toFixed(2)
        : '0';
      const amountSplit = amount.split('.');
      const token: string[] = [];
      let currencyName = 'Euro';

      const user = await this.userRepo.findOneOrFail({
        where: { id: doctor_id },
        relations: {
          address: true,
        },
      });
      const bankCheck = await this.bankCheckRepo.findOneOrFail({
        where: { id },
      });
      currencyName += Number(amount) >= 2 ? 's' : '';
      token.push(numberToWords.toWords(amountSplit[0]));
      token.push(currencyName);
      if (amountSplit[1] && +amountSplit[1] != 0)
        token.push(numberToWords.toWords(amountSplit[1]));
      const chain = token.join(' ').toUpperCase();
      const lines = StringHelper.trunkLine(chain, 31);

      const filePath = path.join(
        process.cwd(),
        'templates/bank_check',
        'bank_check.hbs',
      );

      const options = {
        format: 'A4',
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: '<div></div>',
        margin: {
          left: '10mm',
          top: '25mm',
          right: '10mm',
          bottom: '15mm',
        },
        landscape: true,
      };
      const place = user?.address?.city?.toUpperCase() || null;
      const payee = (user.lastname + ' ' + user.firstname).toUpperCase();
      const date = dayjs().format('DD/MM/YYYY');
      const data = {
        sum_words_line_1: lines.shift(),
        sum_words_line_2: lines.shift(),
        sum_digit: amount,
        place,
        payee,
        fields: bankCheck.fields,
        date,
      };

      return await createPdf(filePath, options, data);
    } catch (error) {
      throw new CBadRequestException(ErrorCode.ERROR_GET_PDF);
    }
  }
}
