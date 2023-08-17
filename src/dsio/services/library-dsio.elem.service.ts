import { Injectable } from '@nestjs/common';
import { InitDsioElemService } from './init-dsio.elem.service';
import { DataSource } from 'typeorm';

@Injectable()
export class LibraryDsioElemService {
  constructor(
    private dataSource: DataSource,
    private initDsioElemService: InitDsioElemService,
  ) {}

  /** php/dsio/import_shell.php line 1242 -> 1409
   * Crée un nouvel acte dans la bibliothèque et
   * affecte l'id aux tâches des rdv concernés.
   */
  async setLibraryMact(
    t_dsio_tasks:
      | Record<string, string>
      | Record<string, Record<string, number>>,
    groupId: number,
  ) {
    const ATA_DE_BASE = 'NGAP';
    if (
      !this.initDsioElemService.FCF ||
      !this.initDsioElemService.t_library_family_lfy[
        this.initDsioElemService.FCF
      ]
    ) {
      return;
    }
    if (!this.initDsioElemService.ACA) {
      return;
    }
    if (
      !this.initDsioElemService.ALI ||
      this.initDsioElemService.ALI.length === 0
    ) {
      return;
    }
    if (
      !this.initDsioElemService.AAB ||
      this.initDsioElemService.AAB.length === 0
    ) {
      return;
    }

    this.initDsioElemService.FCF =
      this.initDsioElemService.t_library_family_lfy[
        this.initDsioElemService.FCF
      ] + '';
    if (
      Number(this.initDsioElemService.FCF) !== this.initDsioElemService.LFY_ID
    ) {
      this.initDsioElemService.LFT_POS = 0;
      this.initDsioElemService.LFY_ID = Number(this.initDsioElemService.FCF);
    }
    const ATA =
      this.initDsioElemService.ATA && this.initDsioElemService.ATA.length > 0
        ? this.initDsioElemService.ATA
        : ATA_DE_BASE;
    const LFQ_ABBR = this.initDsioElemService.AAB;

    if (
      !t_dsio_tasks[this.initDsioElemService.ACA] ||
      t_dsio_tasks[this.initDsioElemService.ACA].length === 0
    ) {
      t_dsio_tasks[this.initDsioElemService.ACA] = {};
    }

    try {
      let LFT_ID: number = null;
      if (!t_dsio_tasks[this.initDsioElemService.ACA][ATA]) {
        const query = `INSERT /* LOW_PRIORITY */ INTO T_LIBRARY_FAMILY_TASK_LFT (GRP_ID, LFY_ID, LFT_POS, LFT_NAME)
          VALUES(?, ?, ?, ?)`;
        const insertRes = await this.dataSource.query(query, [
          groupId,
          this.initDsioElemService.LFY_ID,
          this.initDsioElemService.LFT_POS++,
          LFQ_ABBR,
        ]);
        LFT_ID = insertRes.insertId;
        t_dsio_tasks[this.initDsioElemService.ACA][ATA] = LFT_ID; // Relation des ID des actes entre DSIO et e.coo
      } else {
        LFT_ID = t_dsio_tasks[this.initDsioElemService.ACA][ATA];
      }

      const LFQ_NAME = this.initDsioElemService.ALI;
      let LFQ_DURATION =
        this.initDsioElemService.ADU &&
        this.initDsioElemService.ADU.length > 0 &&
        this.initDsioElemService.ADU.substr(0, 5) !== '00:00'
          ? this.initDsioElemService.ADU.substr(0, 5)
          : '00:15:00';
      if (LFQ_DURATION.length === 5) {
        LFQ_DURATION += ':00';
      }

      let LFQ_AMOUNT =
        this.initDsioElemService.ASA && this.initDsioElemService.ASA.length > 0
          ? this.initDsioElemService.ASA.replace(/,/g, '.')
          : 0;
      let LFQ_AMOUNT_CHILD =
        this.initDsioElemService.ASE && this.initDsioElemService.ASE.length > 0
          ? this.initDsioElemService.ASE.replace(/,/g, '.')
          : 0;
      const LFQ_QUANTITY =
        this.initDsioElemService.AQT &&
        this.initDsioElemService.AQT.length > 0 &&
        !isNaN(Number(this.initDsioElemService.AQT))
          ? this.initDsioElemService.AQT
          : 1;

      if (LFQ_AMOUNT !== null || LFQ_AMOUNT_CHILD !== null) {
        let LFQ_ID = null;

        if (!this.initDsioElemService.t_dsio_tasks_quantity[LFT_ID]) {
          this.initDsioElemService.t_dsio_tasks_quantity[LFT_ID] = {};
        }

        if (
          LFQ_QUANTITY != 1 &&
          !this.initDsioElemService.t_dsio_tasks_quantity[LFT_ID][1]
        ) {
          this.initDsioElemService.t_dsio_tasks_quantity[LFT_ID][1] = [];
          const query = `INSERT /* LOW_PRIORITY */ INTO T_LIBRARY_FAMILY_TASK_QUANTITY_LFQ
                    (GRP_ID, LFT_ID, LFQ_NAME, LFQ_ABBR, LFQ_DURATION, LFQ_AMOUNT, LFQ_AMOUNT_CHILD, LFQ_QUANTITY)
                    VALUES (?,?,?,?,?,?,?,1)`;
          const insertRes = await this.dataSource.query(query, [
            groupId,
            LFT_ID,
            LFQ_NAME,
            LFQ_ABBR.substring(1, 20),
            LFQ_DURATION,
            LFQ_AMOUNT,
            LFQ_AMOUNT_CHILD,
          ]);
          this.initDsioElemService.t_dsio_tasks_quantity[LFT_ID][1][ATA] =
            insertRes.insertId;
        }

        if (
          !this.initDsioElemService.t_dsio_tasks_quantity[LFT_ID][LFQ_QUANTITY]
        ) {
          this.initDsioElemService.t_dsio_tasks_quantity[LFT_ID][LFQ_QUANTITY] =
            [];
        }

        if (
          !this.initDsioElemService.t_dsio_tasks_quantity[LFT_ID][LFQ_QUANTITY][
            ATA
          ]
        ) {
          // On doit créer l'acte (même coefs et tarif pour adultes et enfants
          LFQ_AMOUNT = LFQ_AMOUNT === null ? LFQ_AMOUNT_CHILD : LFQ_AMOUNT;
          LFQ_AMOUNT_CHILD =
            LFQ_AMOUNT === null ? LFQ_AMOUNT_CHILD : LFQ_AMOUNT;
          const query = `INSERT /* LOW_PRIORITY */ INTO T_LIBRARY_FAMILY_TASK_QUANTITY_LFQ
            (GRP_ID, LFT_ID, LFQ_NAME, LFQ_ABBR, LFQ_DURATION, LFQ_AMOUNT, LFQ_AMOUNT_CHILD, LFQ_QUANTITY)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?)`;
          const insertRes = await this.dataSource.query(query, [
            groupId,
            LFT_ID,
            LFQ_NAME,
            LFQ_ABBR.substring(1, 20),
            LFQ_DURATION,
            LFQ_AMOUNT,
            LFQ_AMOUNT_CHILD,
            LFQ_QUANTITY,
          ]);
          LFQ_ID = insertRes.insertId;
          this.initDsioElemService.t_dsio_tasks_quantity[LFT_ID][LFQ_QUANTITY][
            ATA
          ] = LFQ_ID;
        } else if (ATA == ATA_DE_BASE) {
          LFQ_ID =
            this.initDsioElemService.t_dsio_tasks_quantity[LFT_ID][
              LFQ_QUANTITY
            ][ATA];
          if (LFQ_AMOUNT == null) {
            const query = `UPDATE T_LIBRARY_FAMILY_TASK_QUANTITY_LFQ set LFQ_AMOUNT_CHILD = ? where LFQ_ID = ?`;
            await this.dataSource.query(query, [LFQ_AMOUNT_CHILD, LFQ_ID]);
          } else {
            const query = `UPDATE T_LIBRARY_FAMILY_TASK_QUANTITY_LFQ set LFQ_AMOUNT = ? where LFQ_ID = ?`;
            await this.dataSource.query(query, [LFQ_AMOUNT, LFQ_ID]);
          }
        } else {
          LFQ_ID =
            this.initDsioElemService.t_dsio_tasks_quantity[LFT_ID][
              LFQ_QUANTITY
            ][ATA];
        }

        if (
          this.initDsioElemService.ALC &&
          this.initDsioElemService.DLK[this.initDsioElemService.ALC]
        ) {
          /* Acte dentaire */
          const DLK_ID =
            this.initDsioElemService.DLK[this.initDsioElemService.ALC];
          const DLT_COLOR = this.initDsioElemService.ACL
            ? this.initDsioElemService.ACL
            : -3840;
          const DLT_CROWN_VISIBLE =
            this.initDsioElemService.ACV &&
            this.initDsioElemService.ACV.length > 0 &&
            this.initDsioElemService.ACV === 'N'
              ? 0
              : 1;
          const DLT_ROOT_VISIBLE =
            this.initDsioElemService.ARV &&
            this.initDsioElemService.ARV.length > 0 &&
            this.initDsioElemService.ARV === 'N'
              ? 0
              : 1;
          const DLT_ZONE_VISIBLE =
            this.initDsioElemService.AZV &&
            this.initDsioElemService.AZV.length > 0
              ? this.initDsioElemService.AZV
              : null;
          const DLT_ZONE_INVISIBLE =
            this.initDsioElemService.AZI &&
            this.initDsioElemService.AZI.length > 0
              ? this.initDsioElemService.AZI
              : null;
          const DLT_TOOTH_DISABLE =
            this.initDsioElemService.ADI &&
            this.initDsioElemService.ADI.length > 0
              ? this.initDsioElemService.ADI
              : null;
          const query = `UPDATE T_LIBRARY_FAMILY_TASK_LFT SET
            DLK_ID=?, LFT_COLOR=?, LFT_CROWN_VISIBLE=?, LFT_ROOT_VISIBLE=?, LFT_ZONE_VISIBLE=?,
            LFT_ZONE_INVISIBLE=?, LFT_TOOTH_DISABLE=?, LFT_TYPE='NGAP', LFT_ENABLE=1
            WHERE LFT_ID=?`;
          await this.dataSource.query(query, [
            DLK_ID,
            DLT_COLOR,
            DLT_CROWN_VISIBLE,
            DLT_ROOT_VISIBLE,
            DLT_ZONE_VISIBLE,
            DLT_ZONE_INVISIBLE,
            DLT_TOOTH_DISABLE,
            LFT_ID,
          ]);

          let DLQ_COEF = this.initDsioElemService.ACO
            ? Number(this.initDsioElemService.ACO) % 2147483647
            : null;
          let DLQ_COEF_CHILD = this.initDsioElemService.ACE
            ? Number(this.initDsioElemService.ACE) % 2147483647
            : null;
          const DLQ_EXCEEDING =
            this.initDsioElemService.AQD &&
            this.initDsioElemService.AQD.length > 0 &&
            this.initDsioElemService.t_QD[this.initDsioElemService.AQD]
              ? this.initDsioElemService.t_QD[this.initDsioElemService.AQD]
              : null;
          const DLQ_PURCHASE_PRICE =
            this.initDsioElemService.APA &&
            this.initDsioElemService.APA.length > 0
              ? this.initDsioElemService.APA.replace(/,/g, '.')
              : 0;

          if (!this.initDsioElemService.t_dsio_dental_tasks_quantity[LFQ_ID]) {
            DLQ_COEF = DLQ_COEF === null ? DLQ_COEF_CHILD : DLQ_COEF;
            DLQ_COEF_CHILD = DLQ_COEF === null ? DLQ_COEF_CHILD : DLQ_COEF;
            const query = `UPDATE /* LOW_PRIORITY */ T_LIBRARY_FAMILY_TASK_QUANTITY_LFQ 
              SET LFQ_COEF=?, LFQ_COEF_CHILD=?, LFQ_EXCEEDING=?, LFQ_PURCHASE_PRICE=?
              WHERE LFQ_ID=?`;
            await this.dataSource.query(query, [
              DLQ_COEF,
              DLQ_COEF_CHILD,
              DLQ_EXCEEDING,
              DLQ_PURCHASE_PRICE,
              LFQ_ID,
            ]);
            this.initDsioElemService.t_dsio_dental_tasks_quantity[LFQ_ID] =
              true;
          } else if (ATA === ATA_DE_BASE) {
            if (DLQ_COEF == null) {
              const query = `UPDATE T_LIBRARY_FAMILY_TASK_QUANTITY_LFQ set LFQ_COEF_CHILD = ? where LFQ_ID = ?`;
              await this.dataSource.query(query, [DLQ_COEF_CHILD, LFQ_ID]);
            } else {
              const query = `UPDATE T_LIBRARY_FAMILY_TASK_QUANTITY_LFQ set LFQ_COEF = ? where LFQ_ID = ?`;
              await this.dataSource.query(query, [DLQ_COEF, LFQ_ID]);
            }
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /** php/dsio/import_shell.php line 1414 -> 1473
   * Crée un nouveau postit
   */
  async setPostit() {
    if (
      !this.initDsioElemService.NCN ||
      this.initDsioElemService.NCN.length === 0
    ) {
      return;
    }
    if (
      !this.initDsioElemService.PTC ||
      this.initDsioElemService.PTC.length === 0
    ) {
      return;
    }
    if (!this.initDsioElemService.PC1) {
      return;
    }
    if (
      !this.initDsioElemService.NCO ||
      this.initDsioElemService.NCO.length === 0
    ) {
      return;
    }

    let NCN = this.initDsioElemService.NCN;
    const PTC = this.initDsioElemService.PTC;
    const PC1 = this.initDsioElemService.PC1;
    const NCO = this.initDsioElemService.NCO.replace(/\t/g, '\n');
    const NCL =
      this.initDsioElemService.NCL && this.initDsioElemService.NCL.length > 0
        ? this.initDsioElemService.NCL
        : null;
    const NPA =
      this.initDsioElemService.NPA &&
      this.initDsioElemService.NPA.length > 0 &&
      this.initDsioElemService.NPA === 'N'
        ? 0
        : 1;
    const NGA =
      this.initDsioElemService.NGA && this.initDsioElemService.NGA.length > 0
        ? this.initDsioElemService.NGA
        : null;
    const NHA =
      this.initDsioElemService.NHA && this.initDsioElemService.NHA.length > 0
        ? this.initDsioElemService.NHA
        : null;
    const NDR =
      this.initDsioElemService.NDR && this.initDsioElemService.NDR.length > 0
        ? this.initDsioElemService.NDR
        : null;
    const NBA =
      this.initDsioElemService.NBA && this.initDsioElemService.NBA.length > 0
        ? this.initDsioElemService.NBA
        : null;
    try {
      if (!this.initDsioElemService.T_POSTIT_PTT[NCN]) {
        const query = `REPLACE /* LOW_PRIORITY */ INTO T_POSTIT_PTT (
        ${NCL ? 'PTT_COLOR,' : ''}
        ${NPA ? 'PTT_SHARED,' : ''}
        USR_ID, CON_ID, PTT_MSG) VALUES (
        ${NCL ? NCL + ',' : ''}
        ${NPA ? NPA + ',' : ''}
        ?,?,?)`;
        const res = await this.dataSource.query(query, [PC1, PTC, NCO]);
        this.initDsioElemService.T_POSTIT_PTT[NCN] = res.insertId;
      }
      NCN = this.initDsioElemService.T_POSTIT_PTT[NCN];

      const PTU_X = NGA;
      const PTU_Y = NHA;
      const PTU_WIDTH =
        NDR !== null && NGA !== null ? Number(NDR) - Number(NGA) : null;
      const PTU_HEIGHT =
        NBA !== null && NHA !== null ? Number(NBA) - Number(NHA) : null;

      const query = `REPLACE /* LOW_PRIORITY */ INTO T_POSTIT_USER_PTU (
      ${PTU_WIDTH ? 'PTU_WIDTH,' : ''}
      ${PTU_HEIGHT ? 'PTU_HEIGHT,' : ''}
      ${PTU_X ? 'PTU_X,' : ''}
      ${PTU_Y ? 'PTU_Y,' : ''}
      PTT_ID, USR_ID) VALUES (
      ${PTU_WIDTH ? PTU_WIDTH + ',' : ''}
      ${PTU_HEIGHT ? PTU_HEIGHT + ',' : ''}
      ${PTU_X ? PTU_X + ',' : ''}
      ${PTU_Y ? PTU_Y + ',' : ''}
      ?,?)`;
      await this.dataSource.query(query, [NCN, PC1]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * php/dsio/import_shell.php line 1475 -> 1517
   */
  async insertContraindication(groupId: number) {
    if (
      !this.initDsioElemService.ICI ||
      this.initDsioElemService.ICI.length === 0
    ) {
      return;
    }
    if (
      !this.initDsioElemService.ILI ||
      this.initDsioElemService.ILI.length === 0
    ) {
      return;
    }

    const contraindicationName = this.initDsioElemService.ILI;
    try {
      const insertRes = await this.dataSource.query(
        `
        INSERT INTO T_MEDICAL_LIBRARY_CONTRAINDICATION_MLC (organization_id, MLC_LABEL)
        VALUES (?, ?)
      `,
        [groupId, contraindicationName],
      );

      const contraindicationId = insertRes.insertId;

      if (
        this.initDsioElemService.T_CONTACT_CONTRAINDICATION_COC[
          this.initDsioElemService.ICI
        ]
      ) {
        const values = this.initDsioElemService.T_CONTACT_CONTRAINDICATION_COC[
          this.initDsioElemService.ICI
        ]
          .map((CON_ID) => {
            return `(${CON_ID}, ${contraindicationId})`;
          })
          .join(', ');

        if (!values) return;

        const patientContraindicationStoreStm = `
          INSERT INTO T_CONTACT_CONTRAINDICATION_COC(CON_ID, MLC_ID)
          VALUES ${values}`;

        await this.dataSource.query(patientContraindicationStoreStm);
      }
    } catch (error) {
      throw error;
    }
  }
}
