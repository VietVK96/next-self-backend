import { Injectable } from '@nestjs/common';
import { ContactService } from 'src/contact/services/contact.service';
import { DataSource } from 'typeorm';
import { InitDsioElemService } from './init-dsio.elem.service';

@Injectable()
export class PaymentDsioElemService {
  constructor(
    private contactService: ContactService,
    private dataSource: DataSource,
    private initDsioElemService: InitDsioElemService,
  ) {}

  /**
   * php/dsio/import_shell.php line 962 -> 1087
   *
   * Créer un enregistrement de paiement une fois celui-ci définit
   * par le parcours du fichier DSIO
   */
  async creatPaiement(id_prat: number, id_pat: number) {
    try {
      if (!id_prat) {
        return;
      }
      if (!id_pat) {
        return;
      }

      let DP = '$DP';
      if (this.initDsioElemService.$DP) {
        DP = this.initDsioElemService.getDateFrom(this.initDsioElemService.$DP);
      } else {
        return;
      }

      let DE = '$DE'; // date d'échéance
      if (this.initDsioElemService.$DE) {
        DE = this.initDsioElemService.getDateFrom(this.initDsioElemService.$DE);
      } else {
        DE = DP;
      }

      let SS = '$SS';
      if (
        !this.initDsioElemService.$SS ||
        this.initDsioElemService.$SS.length === 0
      ) {
        return;
      }
      let LI = '$LI';
      LI = this.initDsioElemService.$LI
        ? this.initDsioElemService.$LI
        : 'Import DSIO'; // libellé
      SS =
        '' +
        Math.round(
          parseFloat(
            this.initDsioElemService.$SS.replace(',', '.').replace(/ /g, ''),
          ) * 100,
        ) /
          100; // somme payée
      let MP = '$MP';
      MP = this.initDsioElemService.$MP ? this.initDsioElemService.$MP : ''; // mode de paiement
      // Dans e.cooDentist il existe : 'cheque','carte','espece','virement','prelevement'
      switch (MP.toLowerCase()) {
        case 'carte bleue':
        case 'cb':
        case 'c.b':
        case 'c.b.':
        case 'carte bancaire':
        case 'b':
        case 'a':
          MP = 'carte';
          break;

        case 'chque':
        case 'cheque':
        case 'chèque':
        case 'ccp':
        case 'cc':
        case 'cheque postal':
        case 'ch':
        case 'c':
          MP = 'cheque';
          break;

        case 'espce':
        case 'espece':
        case 'espèce':
        case 'e':
        case 'esp':
        case 'espces':
        case 'especes':
        case 'espèces':
          MP = 'espece';
          break;

        case 'prlvement':
        case 'prelevement':
        case 'prélèvement':
        case 'p':
          MP = 'prelevement';
          break;

        case 'banque':
        case 'virement':
        case 'vrt':
        case 'cmu':
        case 'v':
          MP = 'virement';
          break;

        // Tant que c'est inconnu, on choisi virement
        default:
          MP = 'virement';
      }

      let SLC_ID = null;
      if (MP === 'cheque') {
        let BO = '$BO';
        if (
          this.initDsioElemService.$BO &&
          this.initDsioElemService.$BO.length > 0 &&
          !isNaN(Number(this.initDsioElemService.$BO))
        ) {
          BO = this.initDsioElemService.$BO;
          let BD = '$BD';
          BD = this.initDsioElemService.$BD
            ? this.initDsioElemService.getDateFrom(this.initDsioElemService.$BD)
            : DE;

          if (!this.initDsioElemService.$BB) {
            return;
          }
          let BB = '$BB';
          BB = this.initDsioElemService.$BB;
          const PDOStateLibBank: { LBK_ID: number }[] =
            await this.dataSource.query(
              'SELECT LBK_ID FROM `T_LIBRARY_BANK_LBK` WHERE USR_ID=? AND LBK_ABBR=?',
              [id_prat, BB],
            );
          let LBK_ID = -1;
          if (PDOStateLibBank.length === 1) {
            LBK_ID = PDOStateLibBank[0].LBK_ID;
          } else {
            return;
          }

          const PDOStateSlipCheck: { SLC_ID: number }[] =
            await this.dataSource.query(
              `
            SELECT SLC_ID FROM T_SLIP_CHECK_SLC
            WHERE LBK_ID = ?
            AND SLC_NBR = ?`,
              [LBK_ID, BO],
            );
          if (PDOStateSlipCheck.length) {
            SLC_ID = PDOStateSlipCheck[0].SLC_ID + '';
          } else {
            const insertRes = await this.dataSource.query(
              `
            INSERT /* LOW_PRIORITY */ INTO T_SLIP_CHECK_SLC (LBK_ID, SLC_NBR, SLC_DATE)
            VALUES (?, ?, ?)`,
              [LBK_ID, BO, BD],
            );
            SLC_ID = insertRes.insertId;
          }
        }
      }

      // création du paiement
      const insertRes = await this.dataSource.query(
        `
        INSERT /* LOW_PRIORITY */ INTO T_CASHING_CSG 
        (USR_ID, CON_ID, SLC_ID, CSG_NAME, CSG_DATE, CSG_PAYMENT, CSG_PAYMENT_DATE, CSG_MSG, CSG_AMOUNT, amount_care)
			  VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id_prat, id_pat, SLC_ID, LI, DP, MP, DE, 'Import DSIO', SS, SS],
      );
      const CSG_ID = insertRes.insertId;

      // création de la jointure paiement/patient
      await this.dataSource.query(
        `
        INSERT /* LOW_PRIORITY */ INTO T_CASHING_CONTACT_CSC (CSG_ID, CON_ID, CSC_AMOUNT, amount_care)
        VALUES (?,?,?,?)`,
        [CSG_ID, id_pat, SS, SS],
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * php/dsio/import_shell.php line 1099 -> 1118
   *
   * Crée un rendez-vous invisible avec un acte afin de corriger le
   * montant dû dont le montant a été récupéré dans le fichier DSIO.
   * Ce rendez-vous n'est créé que si la fiche contact correspondante existe
   */
  async setAmountDue(id_prat: number, id_pat: number) {
    if (id_prat && id_pat) {
      let TD: string | number = '$TD';
      if (!this.initDsioElemService.$TD) {
        TD = 0;
      } else {
        TD = this.initDsioElemService.$TD.replace(/,/g, '.').replace(/ /g, '');
        if (isNaN(Number(TD))) {
          TD = 0;
        }
      }

      try {
        await this.contactService.setAmountDue(id_pat, id_prat, Number(TD));
      } catch (error) {}
    }
  }

  /**
   * php/dsio/import_shell.php line 1123 -> 1138
   */
  async setLibraryFamily(groupId: number) {
    if (!this.initDsioElemService.FCF) return;

    try {
      const FCF = this.initDsioElemService.FCF;
      const FLI =
        !this.initDsioElemService.FLI ||
        this.initDsioElemService.FLI.length === 0
          ? 'Famille $FCF'
          : this.initDsioElemService.FLI;
      const FCO = !this.initDsioElemService.FCO
        ? -12303
        : this.initDsioElemService.FCO;

      const pos = Object.keys(
        this.initDsioElemService.t_library_family_lfy,
      ).length;

      const queryStm = `
        INSERT /* LOW_PRIORITY */ INTO T_LIBRARY_FAMILY_LFY (GRP_ID, LFY_NAME, LFY_COLOR, LFY_POS, LFY_DELETABLE, LFY_USABLE)
        VALUES (?, ?, ?, ?, 1, 0)`;
      const insertRes = await this.dataSource.query(queryStm, [
        groupId,
        FLI,
        FCO,
        pos + 200,
      ]);
      this.initDsioElemService.t_library_family_lfy[FCF] = insertRes.insertId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * php/dsio/import_shell.php line 1144 -> 1236
   */
  async setLibraryAct(
    t_dsio_tasks:
      | Record<string, string>
      | Record<string, Record<string, number>>,
    LFT_ASSOCIATED_ACTS: Record<string, string>,
    groupId: number,
  ) {
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

    try {
      this.initDsioElemService.FCF =
        this.initDsioElemService.t_library_family_lfy[
          this.initDsioElemService.FCF
        ] + '';
      if (
        Number(this.initDsioElemService.FCF) != this.initDsioElemService.LFY_ID
      ) {
        this.initDsioElemService.LFT_POS = 0;
        this.initDsioElemService.LFY_ID = Number(this.initDsioElemService.FCF);
      }

      const LFT_NAME = this.initDsioElemService.ALI;
      const LFQ_NAME = this.initDsioElemService.ALI;

      let query = `INSERT /* LOW_PRIORITY */ INTO T_LIBRARY_FAMILY_TASK_LFT (GRP_ID, LFY_ID, LFT_NAME, LFT_POS, LFT_DELETABLE)
        VALUES (?,?,?,?, 1)`;
      let insertRes = await this.dataSource.query(query, [
        groupId,
        this.initDsioElemService.LFY_ID,
        LFT_NAME,
        this.initDsioElemService.LFT_POS++,
      ]);
      const LFT_ID = insertRes.insertId;
      t_dsio_tasks[this.initDsioElemService.ACA] = LFT_ID; // Relation des ID des actes entre DSIO et e.coo

      if (
        this.initDsioElemService.AAS &&
        this.initDsioElemService.AAS.length > 0
      ) {
        LFT_ASSOCIATED_ACTS[LFT_ID] = this.initDsioElemService.AAS;
      }

      const LFQ_ABBR = this.initDsioElemService.AAB;
      let LFQ_DURATION =
        this.initDsioElemService.ADU &&
        this.initDsioElemService.ADU.length > 0 &&
        this.initDsioElemService.ADU.substr(0, 5) != '00:00'
          ? this.initDsioElemService.ADU.substr(0, 5)
          : '00:15:00';
      if (LFQ_DURATION.length == 5) {
        LFQ_DURATION += ':00';
      }
      const LFQ_AMOUNT =
        this.initDsioElemService.ASA && this.initDsioElemService.ASA.length > 0
          ? this.initDsioElemService.ASA.replace(',', '.')
          : 0;
      const LFQ_AMOUNT_CHILD =
        this.initDsioElemService.ASE && this.initDsioElemService.ASE.length > 0
          ? this.initDsioElemService.ASE.replace(',', '.')
          : 0;
      query = `INSERT /* LOW_PRIORITY */ INTO T_LIBRARY_FAMILY_TASK_QUANTITY_LFQ 
        (GRP_ID, LFT_ID, LFQ_NAME, LFQ_ABBR, LFQ_DURATION, LFQ_AMOUNT, LFQ_AMOUNT_CHILD, LFQ_QUANTITY)
        VALUES (?,?,?,?,?,?,?,1)`;
      insertRes = await this.dataSource.query(query, [
        groupId,
        LFT_ID,
        LFQ_NAME,
        LFQ_ABBR.substring(1, 20),
        LFQ_DURATION,
        LFQ_AMOUNT,
        LFQ_AMOUNT_CHILD,
      ]);
      const LFQ_ID = insertRes.insertId;

      if (this['ALC'] && this.initDsioElemService.DLK[this['ALC']]) {
        /* Acte dentaire */
        const DLK_ID = this.initDsioElemService.DLK[this['ALC']];
        const DLT_COLOR = this['ACL'] ? this.initDsioElemService.ACL : -3840;
        const DLT_CROWN_VISIBLE =
          this['ACV'] &&
          this.initDsioElemService.ACV.length > 0 &&
          this.initDsioElemService.ACV === 'N'
            ? 0
            : 1;
        const DLT_ROOT_VISIBLE =
          this['ARV'] &&
          this.initDsioElemService.ARV.length > 0 &&
          this.initDsioElemService.ARV === 'N'
            ? 0
            : 1;
        const DLT_ZONE_VISIBLE =
          this['AZV'] && this.initDsioElemService.AZV.length > 0
            ? this.initDsioElemService.AZV
            : null;
        const DLT_ZONE_INVISIBLE =
          this['AZI'] && this.initDsioElemService.AZI.length > 0
            ? this.initDsioElemService.AZI
            : null;
        const DLT_TOOTH_DISABLE =
          this['ADI'] && this.initDsioElemService.ADI.length > 0
            ? this.initDsioElemService.ADI
            : null;
        let query = `UPDATE T_LIBRARY_FAMILY_TASK_LFT SET
          DLK_ID=?, LFT_COLOR=?, LFT_CROWN_VISIBLE=?, LFT_ROOT_VISIBLE=?, LFT_ZONE_VISIBLE=?,
          LFT_ZONE_INVISIBLE=?, LFT_TOOTH_DISABLE=?, LFT_TYPE='NGAP'
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

        const DLQ_COEF =
          this.initDsioElemService.ACO &&
          this.initDsioElemService.ACO.length > 0
            ? Number(this.initDsioElemService.ACO) % 2147483647
            : 1;
        const DLQ_COEF_CHILD =
          this.initDsioElemService.ACE &&
          this.initDsioElemService.ACE.length > 0
            ? Number(this.initDsioElemService.ACE) % 2147483647
            : 1;
        const DLQ_EXCEEDING =
          this.initDsioElemService.AQD &&
          this.initDsioElemService.AQD.length > 0 &&
          this.initDsioElemService.t_QD[this.initDsioElemService.AQD]
            ? this.initDsioElemService.t_QD[this.initDsioElemService.AQD]
            : null;
        const DLQ_PURCHASE_PRICE =
          this.initDsioElemService.APA &&
          this.initDsioElemService.APA.length > 0
            ? Number(this.initDsioElemService.APA.replace(',', '.'))
            : 0;

        query = `UPDATE /* LOW_PRIORITY */ T_LIBRARY_FAMILY_TASK_QUANTITY_LFQ 
          set LFQ_COEF=?, LFQ_COEF_CHILD=?, LFQ_EXCEEDING=?, LFQ_PURCHASE_PRICE=?
          where LFQ_ID=?`;
        await this.dataSource.query(query, [
          DLQ_COEF,
          DLQ_COEF_CHILD,
          DLQ_EXCEEDING,
          DLQ_PURCHASE_PRICE,
          LFQ_ID,
        ]);
      }
    } catch (error) {
      throw error;
    }
  }
}
