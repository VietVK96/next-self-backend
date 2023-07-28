/**
 * Repositories/Group.php
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { DataSource, Repository } from 'typeorm';
import {
  BankCheckPrintDto,
  CreateUpdateBankDto,
  UpdateBankCheckDto,
} from '../dto/bank.dto';
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
import { PermissionService } from 'src/user/services/permission.service';
import { LibraryBankEntity } from 'src/entities/library-bank.entity';
import { AddressEntity } from 'src/entities/address.entity';
import axios from 'axios';
import { SuccessCode } from 'src/constants/success';

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
    private readonly permissionService: PermissionService,
    @InjectRepository(LibraryBankEntity)
    private libraryBankRepo: Repository<LibraryBankEntity>,
    @InjectRepository(AddressEntity)
    private addressRepo: Repository<AddressEntity>,
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

    return organization.bankChecks.map(({ id, name, position, fields }) => ({
      id,
      name,
      position,
      fields,
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
        'templates/pdf/bank_check',
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
          bottom: '10mm',
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

  async updateBankChecks(id: number, payload: UpdateBankCheckDto) {
    const currentBankCheck = await this.bankCheckRepo.findOneOrFail({
      where: { id },
    });

    //@TODO Not understand validator
    // $violations = $container -> get('validator') -> validate($bankCheck);
    // if ($violations -> count()) {
    //   throw new BadRequestHttpException((string) $violations);
    // }

    const newBankCheck = {
      ...currentBankCheck,
      ...payload,
    };
    return await this.bankCheckRepo.save(newBankCheck);
  }

  async duplicateBankChecks(id: number) {
    const currentBankCheck = await this.bankCheckRepo.findOneOrFail({
      where: { id },
    });

    return await this.bankCheckRepo.save({
      ...currentBankCheck,
      id: null,
      internalReferenceId: null,
    });
  }

  async findAllByUser(userId: number) {
    const query = `
    SELECT
      T_LIBRARY_BANK_LBK.LBK_ID AS id,
      T_LIBRARY_BANK_LBK.LBK_NAME AS name,
      T_LIBRARY_BANK_LBK.LBK_ABBR AS short_name,
      CONCAT_WS(' ', LBK_BANK_CODE, LBK_BRANCH_CODE, LBK_ACCOUNT_NBR, LBK_BANK_DETAILS) AS rib
    FROM T_LIBRARY_BANK_LBK
    JOIN T_USER_USR
    WHERE T_USER_USR.USR_ID = ?
      AND T_USER_USR.organization_id = T_LIBRARY_BANK_LBK.organization_id
      AND (
      T_LIBRARY_BANK_LBK.USR_ID IS NULL OR
      T_LIBRARY_BANK_LBK.USR_ID = T_USER_USR.USR_ID
      )
      AND T_LIBRARY_BANK_LBK.deleted_at IS NULL
    ORDER BY T_LIBRARY_BANK_LBK.LBK_POS`;

    return await this.dataSource.query(query, [userId]);
  }

  async createUpdateBank(
    userId: number,
    organizationId: number,
    payload: CreateUpdateBankDto,
  ) {
    if (!payload.id) {
      const hasPermissionCreate = await this.permissionService.hasPermission(
        'PERMISSION_LIBRARY',
        2,
        userId,
      );
      const hasPermissionUpdate = await this.permissionService.hasPermission(
        'PERMISSION_LIBRARY',
        4,
        userId,
      );
      if (!hasPermissionCreate && !hasPermissionUpdate) {
        return ErrorCode.PERMISSION_DENIED;
      }
    }
    try {
      let libraryBankEntity = new LibraryBankEntity();
      let addressEntity;

      const countries = (await axios.get('https://restcountries.com/v3.1/all'))
        .data;

      const {
        bankOfGroup,
        id,
        abbr,
        name,
        bankCode,
        branchCode,
        accountNbr,
        bankDetails,
        accountingCode,
        third_party_account,
        product_account,
        currency,
        slipCheckNbr,
        transfertDefault,
      } = payload;

      if (name && name !== '') {
        if (!id) {
          libraryBankEntity.organizationId = organizationId;
          if (!bankOfGroup) libraryBankEntity.usrId = userId;
        } else {
          libraryBankEntity = await this.libraryBankRepo.findOneOrFail({
            where: { id: id, usrId: userId },
            relations: { address: true, user: true },
          });
          if (!libraryBankEntity.user && !libraryBankEntity.user.admin) {
            return ErrorCode.PERMISSION_DENIED;
          }
          addressEntity = libraryBankEntity.address;
        }

        if (
          (transfertDefault === 0 || transfertDefault === 1) &&
          libraryBankEntity.isDefault !== transfertDefault
        ) {
          await this.dataSource.query(
            `
          UPDATE T_LIBRARY_BANK_LBK
          SET LBK_TRANSFERT_DEFAULT = 0
          WHERE USR_ID = ?
            AND LBK_TRANSFERT_DEFAULT = 1`,
            [userId],
          );
        }

        libraryBankEntity.abbr = abbr;
        libraryBankEntity.name = name;
        libraryBankEntity.bankCode = bankCode;
        libraryBankEntity.branchCode = branchCode;
        libraryBankEntity.accountNumber = accountNbr;
        libraryBankEntity.bankDetails = bankDetails;
        libraryBankEntity.accountingCode = accountingCode;
        libraryBankEntity.thirdPartyAccount = third_party_account;
        libraryBankEntity.product_account = product_account;
        libraryBankEntity.currency = currency;
        libraryBankEntity.slipCheckNbr = slipCheckNbr;
        libraryBankEntity.isDefault = transfertDefault;

        const address = payload.address;
        const { street, zipCode, city, countryAbbr } = address;
        if (address || street || zipCode || city || countryAbbr) {
          let country;
          if (countryAbbr) {
            country = countries.find((x) => x.cca2 === countryAbbr);
          }
          if (!addressEntity) addressEntity = new AddressEntity();
          if (street) addressEntity.street = street;
          if (city) addressEntity.city = city;
          if (zipCode) addressEntity.zipCode = zipCode;
          if (country) addressEntity.country = country.translations.fra.common;
          if (countryAbbr) addressEntity.countryAbbr = countryAbbr;

          const newAddress = await this.addressRepo.save(addressEntity);
          libraryBankEntity.adrId = newAddress.id;
        } else if (addressEntity) {
          await this.addressRepo.remove(addressEntity);
        }

        const newLibraryBankEntity = await this.libraryBankRepo.save(
          libraryBankEntity,
        );

        return newLibraryBankEntity;
      }
    } catch (error) {
      return error;
    }
  }

  async deleteBank(id: number, userId: number, organizationId: number) {
    try {
      if (id) {
        const libraryBankEntity = await this.libraryBankRepo.findOneOrFail({
          where: { id, usrId: userId },
          relations: { user: true },
        });
        if (!libraryBankEntity.user && !libraryBankEntity.user.admin) {
          return ErrorCode.PERMISSION_DENIED;
        }
        const hasPermissionDelete = await this.permissionService.hasPermission(
          'PERMISSION_DELETE',
          8,
          userId,
        );
        if (!hasPermissionDelete) {
          return ErrorCode.PERMISSION_DENIED;
        }
        const listLibraryBank = await this.libraryBankRepo.find({
          where: {
            organizationId,
            usrId: userId,
            deletedAt: null,
          },
        });
        if (listLibraryBank.length <= 1)
          return ErrorCode.AT_LEAST_ONE_BANK_IS_REQUIRED;
        libraryBankEntity.deletedAt = new Date();
        await this.libraryBankRepo.save(libraryBankEntity);
        return SuccessCode.DELETE_SUCCESS;
      }
    } catch (error) {
      return error;
    }
  }

  async getOne(id: number) {
    if (!id) throw new CBadRequestException(ErrorCode.FORBIDDEN);
    const currentBank = await this.libraryBankRepo.findOne({
      where: { id },
      relations: { address: true },
    });
    if (!currentBank) throw new CBadRequestException(ErrorCode.NOT_FOUND);
    return currentBank;
  }
}
