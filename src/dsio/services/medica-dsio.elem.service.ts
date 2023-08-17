import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LibraryBankEntity } from 'src/entities/library-bank.entity';
import { InitDsioElemService } from './init-dsio.elem.service';

/**
 * php/dsio/import_shell.php line 1519 -> 1692
 */
@Injectable()
export class MedicaDsioElemService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(LibraryBankEntity)
    private libraryBankRepo: Repository<LibraryBankEntity>,
    private initDsioElemService: InitDsioElemService,
  ) {}

  /**
   * php/dsio/import_shell.php line 1519 -> 1544
   */
  async insertMedicamentFamily(groupId: number) {
    if (
      !this.initDsioElemService.DLI ||
      this.initDsioElemService.DLI.length === 0
    ) {
      return;
    }
    if (
      !this.initDsioElemService.DCD ||
      this.initDsioElemService.DCD.length === 0
    ) {
      return;
    }

    const medicamentFamilyId = this.initDsioElemService.DCD;
    const medicamentFamilyName = this.initDsioElemService.DLI;

    try {
      const insertRes = await this.dataSource.query(
        `
        INSERT INTO T_MEDICAL_PRESCRIPTION_TYPE_MDT (organization_id, MDT_NAME)
        VALUES (?, ?)
      `,
        [groupId, medicamentFamilyName],
      );

      this.initDsioElemService.medicamentFamilies[medicamentFamilyId] =
        insertRes.insertId;
    } catch (error) {
      throw error;
    }
  }

  /** php/dsio/import_shell.php line 1553 -> 1597
   * Permet de créer une prescription
   */
  async insertMedicament(groupId: number) {
    if (
      !this.initDsioElemService.DCD ||
      this.initDsioElemService.DCD.length === 0
    ) {
      return;
    }

    if (groupId !== 280) {
      if (
        !this.initDsioElemService.MLI ||
        this.initDsioElemService.MLI.length === 0
      ) {
        this.initDsioElemService.MLI = '';
      }
      if (
        !this.initDsioElemService.MAB ||
        this.initDsioElemService.MAB.length === 0
      ) {
        this.initDsioElemService.MAB = '';
      }
      if (
        !this.initDsioElemService.MTX ||
        this.initDsioElemService.MTX.length === 0
      ) {
        this.initDsioElemService.MTX = '';
      }
    } else if (
      (!this.initDsioElemService.MLI ||
        this.initDsioElemService.MLI.length === 0) &&
      (!this.initDsioElemService.MAB ||
        this.initDsioElemService.MAB.length === 0) &&
      (!this.initDsioElemService.MTX ||
        this.initDsioElemService.MTX.length === 0)
    ) {
      return;
    }

    if (
      !this.initDsioElemService.medicamentFamilies[this.initDsioElemService.DCD]
    ) {
      return;
    }

    const medicamentFamilyId =
      this.initDsioElemService.medicamentFamilies[this.initDsioElemService.DCD];
    const medicamentShortName =
      !this.initDsioElemService.MAB || this.initDsioElemService.MAB.length === 0
        ? ''
        : this.initDsioElemService.MAB;
    const medicamentName =
      !this.initDsioElemService.MLI || this.initDsioElemService.MLI.length === 0
        ? ''
        : this.initDsioElemService.MLI;
    const medicamentPosologie =
      !this.initDsioElemService.MTX || this.initDsioElemService.MTX.length === 0
        ? ''
        : this.initDsioElemService.MTX.replace(/\t/g, '\n');

    try {
      await this.dataSource.query(
        `
        INSERT INTO T_MEDICAL_PRESCRIPTION_MDP (organization_id, MDT_ID, MDP_ABBR, MDP_NAME, MDP_PRESCRIPTION)
        VALUES (?, ?, ?, ?, ?)
      `,
        [
          groupId,
          medicamentFamilyId,
          medicamentShortName,
          medicamentName,
          medicamentPosologie,
        ],
      );
    } catch (error) {
      throw error;
    }
  }

  /** php/dsio/import_shell.php line 1602 -> 1644
   * Crée un nouveau correspondant du praticien
   */
  async setCorrespondent(
    groupId: number,
    t_gender_gen: Record<string, number>,
  ) {
    const LASTNAME = this.initDsioElemService.RN1
      ? this.initDsioElemService.RN1
      : ''; // T_CORRESPONDENT_CPD.CPD_LASTNAME VARCHAR(50)
    const TYPE = this.initDsioElemService.RF1
      ? this.initDsioElemService.RF1
      : null; // T_CORRESPONDENT_CPD.CPD_TYPE VARCHAR(50)
    const GEN_ID =
      this.initDsioElemService.RT1 && t_gender_gen[this.initDsioElemService.RT1]
        ? t_gender_gen[this.initDsioElemService.RT1]
        : null; // T_CORRESPONDENT_CPD.GEN_ID INT(11)
    const MAIL = this.initDsioElemService.RM1
      ? this.initDsioElemService.RM1
      : null; // T_CORRESPONDENT_CPD.CPD_MAIL VARCHAR(50)
    const MSG = this.initDsioElemService.RN2
      ? this.initDsioElemService.RN2.replace(/\t/g, '\n')
      : null; // T_CORRESPONDENT_CPD.CPD_MSG TEXT

    const STREET = this.initDsioElemService.RA1
      ? this.initDsioElemService.RA1.replace(/\t/g, ', ')
      : null; // T_ADDRESS_ADR.ADR_STREET VARCHAR(255)
    const ZIP_CODE = this.initDsioElemService.RA2
      ? this.initDsioElemService.RA2
      : null; // T_ADDRESS_ADR.ADR_ZIP_CODE VARCHAR(6)
    const CITY = this.initDsioElemService.RA3
      ? this.initDsioElemService.RA3
      : null; // T_ADDRESS_ADR.ADR_CITY VARCHAR(255)

    const RT = {
      1: 'home',
      2: 'mobile',
      4: 'fax',
    };
    RT[1] =
      this.initDsioElemService.RT1 && this.initDsioElemService.RT1.length > 0
        ? this.initDsioElemService.RT1.replace(/ /g, '')
        : null; // Tel T_PHONE_PHO.PHO_NBR
    RT[4] =
      this.initDsioElemService.RT2 && this.initDsioElemService.RT2.length > 0
        ? this.initDsioElemService.RT2.replace(/ /g, '')
        : null; // Tel T_PHONE_PHO.PHO_NBR
    RT[2] =
      this.initDsioElemService.RT3 && this.initDsioElemService.RT3.length > 0
        ? this.initDsioElemService.RT3.replace(/ /g, '')
        : null; // Tel T_PHONE_PHO.PHO_NBR

    try {
      let insertRes = await this.dataSource.query(
        `
        INSERT INTO T_ADDRESS_ADR (ADR_STREET, ADR_ZIP_CODE, ADR_CITY)
        VALUES (?, ?, ?)`,
        [STREET, ZIP_CODE, CITY],
      );
      const ADR_ID = insertRes.insertId;

      insertRes = await this.dataSource.query(
        `
        INSERT INTO T_CORRESPONDENT_CPD (organization_id, GEN_ID, ADR_ID, CPD_TYPE, CPD_LASTNAME, CPD_MAIL, CPD_MSG)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          groupId,
          GEN_ID,
          ADR_ID,
          TYPE.substring(1, 50),
          LASTNAME.substring(1, 50),
          MAIL.substring(1, 50),
          MSG,
        ],
      );
      const CPD_ID = insertRes.insertId;

      for (const [PTY_ID, PHO_NBR] of Object.entries(RT)) {
        if (PHO_NBR) {
          const insertRes = await this.dataSource.query(
            `
            INSERT INTO T_PHONE_PHO (PTY_ID, PHO_NBR)
            VALUES (?, ?)
          `,
            [PTY_ID, PHO_NBR],
          );

          const PHO_ID = insertRes.insertId;

          await this.dataSource.query(
            `
            INSERT INTO T_CORRESPONDENT_PHONE_CPP (PHO_ID, CPD_ID)
            VALUES (?, ?)
          `,
            [PHO_ID, CPD_ID],
          );
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * php/dsio/import_shell.php line 1648 -> 1692
   */
  async setBnq(idPrat: number, groupId: number) {
    try {
      if (
        !this.initDsioElemService.BAB ||
        this.initDsioElemService.BAB.length === 0 ||
        !this.initDsioElemService.PC1 ||
        this.initDsioElemService.PC1.length === 0
      ) {
        return;
      }

      const USR_ID = idPrat;
      const LBK_ABBR = this.initDsioElemService.BAB
        ? this.initDsioElemService.BAB
        : '';

      const numRows = await this.libraryBankRepo.count({
        where: {
          usrId: USR_ID,
          abbr: LBK_ABBR,
        },
      });

      if (numRows > 0) {
        return;
      }

      const STREET = this.initDsioElemService.BAD
        ? this.initDsioElemService.BAD
        : '';
      const ZIP_CODE = this.initDsioElemService.BCP
        ? this.initDsioElemService.BCP
        : '';
      const CITY = this.initDsioElemService.BVI
        ? this.initDsioElemService.BVI
        : '';

      let ADR_ID = null;
      if (STREET + ZIP_CODE + CITY !== '') {
        const insertRes = await this.dataSource.query(
          `
        INSERT INTO T_ADDRESS_ADR (ADR_STREET, ADR_ZIP_CODE, ADR_CITY)
        VALUES(?, ?, ?)`,
          [STREET, ZIP_CODE, CITY],
        );
        ADR_ID = insertRes.insertId;
      }

      const LBK_NAME = this.initDsioElemService.BNO
        ? this.initDsioElemService.BNO
        : '';
      const LBK_BANK_CODE = this.initDsioElemService.BCO
        ? this.initDsioElemService.BCO
        : '';
      const LBK_BRANCH_CODE = this.initDsioElemService.BGU
        ? this.initDsioElemService.BGU
        : '';
      const LBK_ACCOUNT_NBR = this.initDsioElemService.BNU
        ? this.initDsioElemService.BNU
        : '';
      const LBK_BANK_DETAILS = this.initDsioElemService.BRI
        ? this.initDsioElemService.BRI
        : '';
      const LBK_SLIP_CHECK_NBR = this.initDsioElemService.BNB
        ? this.initDsioElemService.BNB
        : '1';

      await this.dataSource.query(
        `INSERT INTO T_LIBRARY_BANK_LBK
        (USR_ID, organization_id, ADR_ID, LBK_ABBR, LBK_NAME, LBK_BANK_CODE, LBK_BRANCH_CODE, LBK_ACCOUNT_NBR, LBK_BANK_DETAILS, LBK_CURRENCY, LBK_SLIP_CHECK_NBR)
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, 'EUR', ?)`,
        [
          USR_ID,
          groupId,
          ADR_ID,
          LBK_ABBR,
          LBK_NAME,
          LBK_BANK_CODE,
          LBK_BRANCH_CODE,
          LBK_ACCOUNT_NBR,
          LBK_BANK_DETAILS,
          LBK_SLIP_CHECK_NBR,
        ],
      );
    } catch (error) {
      throw error;
    }
  }
}
