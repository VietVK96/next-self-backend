import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { HandleDsioService } from './handle-dsio.service';
import { PreDataDsioService } from './pre-data-dsio.service';
import { DataSource } from 'typeorm';
import { InitDsioElemService } from './init-dsio.elem.service';
import { PaymentDsioElemService } from './payment-dsio.elem.service';
import { LibraryDsioElemService } from './library-dsio.elem.service';
import { MedicaDsioElemService } from './medica-dsio.elem.service';

@Injectable()
export class AmountDsioService {
  constructor(
    @Inject(forwardRef(() => HandleDsioService))
    private handleDsioService: HandleDsioService,
    private preDateDsioService: PreDataDsioService,
    private dataSource: DataSource,
    private initDsioElemService: InitDsioElemService,
    private paymentDsioElemService: PaymentDsioElemService,
    private libraryDsioElemService: LibraryDsioElemService,
    private medicaDsioElemService: MedicaDsioElemService,
  ) {}

  /** php/dsio/import_shell.php line 2316 -> 2334
   * Permet d'affecter une valeur pour une balise à l'enregistrement d'un montant dû
   * en court de définition.
   */
  async newAmountDue(
    bname: string,
    value: string,
    groupId: number,
    t_dsio_tasks:
      | Record<string, string>
      | Record<string, Record<string, number>>,
    t_gender_gen: Record<string, number>,
    ngapKeys: Record<string, number>,
  ) {
    try {
      if (!this.handleDsioService.esc('F')) {
        return;
      }
      if (this.handleDsioService.curObj == null) {
        this.handleDsioService.curObj = true;
        this.initDsioElemService.construct(bname, value);
        if (bname === 'PTC') {
          this.handleDsioService.Id_pat =
            !value || !this.handleDsioService.ar_pat[value]
              ? 0
              : this.handleDsioService.ar_pat[value];
        } else if (bname == 'PC1') {
          this.handleDsioService.Id_prat =
            !value || !this.handleDsioService.ar_prat[value]
              ? 0
              : this.handleDsioService.ar_prat[value];
        }
      } else if (bname === 'PTC') {
        await this.preDateDsioService.chPat(
          value,
          groupId,
          t_dsio_tasks,
          t_gender_gen,
          ngapKeys,
        );
      } else if (bname === 'PC1') {
        await this.preDateDsioService.chPrat(
          value,
          groupId,
          t_dsio_tasks,
          t_gender_gen,
          ngapKeys,
        );
      } else {
        this.initDsioElemService.setInfo(bname, value);
      }
    } catch (error) {
      throw error;
    }
  }

  /** php/dsio/import_shell.php line 2343 -> 2355
   * Permet d'affecter une valeur pour une balise à l'enregistrement d'une famille
   * en court de définition.
   */
  async newFamily(bname: string, value: string, groupId: number) {
    try {
      if (!this.handleDsioService.esc('H')) {
        return;
      }
      if (this.handleDsioService.curObj == null) {
        this.handleDsioService.curObj = true;
        this.initDsioElemService.construct(bname, value);
      } else if (bname == 'FLI') {
        await this.chFam(groupId);
        this.handleDsioService.curObj = true;
        this.initDsioElemService.construct(bname, value);
      } else {
        this.initDsioElemService.setInfo(bname, value);
      }
    } catch (error) {
      throw error;
    }
  }

  /** php/dsio/import_shell.php line 2363 -> 2368
   * Dans la section, le fait de changer de famille indique la fin d'une autre que
   * l'on doit enregistrer.
   */
  async chFam(groupId: number) {
    try {
      if (this.handleDsioService.curObj != null) {
        await this.paymentDsioElemService.setLibraryFamily(groupId);
        this.handleDsioService.curObj = null;
      }
    } catch (error) {
      throw error;
    }
  }

  /** php/dsio/import_shell.php line 2377 -> 2394
   * Permet d'affecter une valeur pour une balise à l'enregistrement d'une famille
   * en court de définition.
   */
  async newFamilyTask(
    bname: string,
    value: string,
    t_dsio_tasks:
      | Record<string, string>
      | Record<string, Record<string, number>>,
    LFT_ASSOCIATED_ACTS: Record<string, string>,
    groupId: number,
  ) {
    try {
      if (!this.handleDsioService.esc('I')) {
        return;
      }

      if (bname == 'FCF') {
        this.handleDsioService.Id_Family_Tasks = Number(value);
      }
      if (this.handleDsioService.curObj == null) {
        this.handleDsioService.curObj = true;
        this.initDsioElemService.construct(bname, value);
      } else if (bname === 'FCF') {
        await this.chLibAct(
          bname,
          value,
          t_dsio_tasks,
          LFT_ASSOCIATED_ACTS,
          groupId,
        );
      } else if (bname === 'ACA') {
        await this.chLibAct(
          bname,
          value,
          t_dsio_tasks,
          LFT_ASSOCIATED_ACTS,
          groupId,
        );
      } else {
        this.initDsioElemService.setInfo(bname, value);
      }
    } catch (error) {
      throw error;
    }
  }

  /** php/dsio/import_shell.php line 2402 -> 2415
   * Dans la section, le fait de changer d'acte indique la fin d'un autre que l'on
   * doit enregistrer.
   */
  async chLibAct(
    bname: string = null,
    value: string = null,
    t_dsio_tasks:
      | Record<string, string>
      | Record<string, Record<string, number>>,
    LFT_ASSOCIATED_ACTS: Record<string, string>,
    groupId: number,
  ) {
    try {
      if (this.handleDsioService.actesMacDent) {
        await this.libraryDsioElemService.setLibraryMact(t_dsio_tasks, groupId);
      } else {
        await this.paymentDsioElemService.setLibraryAct(
          t_dsio_tasks,
          LFT_ASSOCIATED_ACTS,
          groupId,
        );
      }
      if (bname !== null) {
        this.handleDsioService.curObj = true;
        this.initDsioElemService.construct(bname, value);
        if (bname !== 'FCF') {
          this.initDsioElemService.setInfo(
            'FCF',
            this.handleDsioService.Id_Family_Tasks + '',
          );
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /** php/dsio/import_shell.php line 2421 -> 2463
   * Fonction de suppression de la bibliothèque d'actes (fournie de base) du groupe.
   * Le but est qu'elle soit remplacée par la bibliothèque extraite du DSIO
   */
  async deleteLibrary(groupId: number, max_CON_NBR: number) {
    if (max_CON_NBR > 0) {
      return;
    }

    try {
      const query =
        'INSERT INTO `T_LIBRARY_FAMILY_LFY` (`LFY_ID`,`GRP_ID`, `LFY_USABLE`, `LFY_POS`) ' +
        `(SELECT \`LFY_ID\`,${groupId},0,\`LFY_POS\`+200 FROM \`T_LIBRARY_FAMILY_LFY\` WHERE \`GRP_ID\` IN (0,${groupId}) and (LFY_CCAM IS NULL OR LFY_CCAM = 0))
        ON DUPLICATE KEY UPDATE \`LFY_USABLE\`=0`;
      await this.dataSource.query(query);
    } catch (error) {
      throw error;
    }
  }

  // php/dsio/import_shell.php line 2465 -> 2492
  async assocAct(
    groupId: number,
    LFT_ASSOCIATED_ACTS: Record<string, string>,
    t_dsio_tasks:
      | Record<string, string>
      | Record<string, Record<string, number>>,
  ) {
    try {
      for (const [LFT_ID, assoc] of Object.entries(LFT_ASSOCIATED_ACTS)) {
        const t_assocs: (string | boolean)[] = assoc.split(',');
        for (let i = 0; i < t_assocs.length; i++) {
          if (t_dsio_tasks[t_assocs[i] as string]) {
            t_assocs[i] = t_dsio_tasks[t_assocs[i] as string] as string;
          } else if (t_assocs[i] === '') {
            t_assocs[i] = LFT_ID;
          } else {
            t_assocs[i] = false;
          }
        }

        const assocTmp = t_assocs.filter(Boolean).join(',');
        if (assocTmp.localeCompare(LFT_ID)) {
          const query = `UPDATE T_LIBRARY_FAMILY_TASK_LFT
          SET LFT_ASSOCIATED_ACTS = ?
          WHERE LFT_ID = ?
          AND GRP_ID = ?`;
          await this.dataSource.query(query, [assocTmp, LFT_ID, groupId]);
        }
      }
    } catch (error) {
      throw error;
    }
  }

  // php/dsio/import_shell.php line 2494 -> 2509
  async newCI(
    bname: string,
    value: string,
    groupId: number,
    max_CON_NBR: number,
  ) {
    try {
      if (!this.handleDsioService.esc('K')) {
        return;
      }

      if (bname === 'ICI') {
        if (this.handleDsioService.curObj != null) {
          await this.libraryDsioElemService.insertContraindication(groupId); // enregistrement de la contre-indication précédente
        } else {
          await this.deleteContraindications(groupId, max_CON_NBR); // première contre-indication => on supprime celles par défaut dans e.coo
        }
        this.handleDsioService.curObj = true;
        this.initDsioElemService.construct(bname, value);
      } else {
        this.initDsioElemService.setInfo(bname, value);
      }
    } catch (error) {
      throw error;
    }
  }

  // php/dsio/import_shell.php line 2511 -> 2528
  async deleteContraindications(groupId: number, max_CON_NBR: number) {
    if (max_CON_NBR > 0) {
      return;
    }

    try {
      await this.dataSource.query(
        `
        UPDATE T_MEDICAL_LIBRARY_CONTRAINDICATION_MLC
        SET deleted_at = CURRENT_TIMESTAMP()
        WHERE organization_id = ?
      `,
        [groupId],
      );
    } catch (error) {
      throw error;
    }
  }

  // php/dsio/import_shell.php line 2530 -> 2545
  async newMedFam(bname: string, value: string, groupId: number) {
    try {
      if (!this.handleDsioService.esc('L')) {
        return;
      }

      if (bname === 'DLI') {
        if (this.handleDsioService.curObj != null) {
          await this.medicaDsioElemService.insertMedicamentFamily(groupId); // enregistrement de la contre-indication précédente
        } else {
          await this.deleteMedicamentFamilies(groupId); // première famille on supprime celles par défaut dans e.coo
        }
        this.handleDsioService.curObj = true;
        this.initDsioElemService.construct(bname, value);
      } else {
        this.initDsioElemService.setInfo(bname, value);
      }
    } catch (error) {
      throw error;
    }
  }

  // php/dsio/import_shell.php line 2547 -> 2559
  async deleteMedicamentFamilies(groupId: number) {
    try {
      await this.dataSource.query(
        `
        UPDATE T_MEDICAL_PRESCRIPTION_TYPE_MDT
        SET deleted_at = CURRENT_TIMESTAMP()
        WHERE organization_id = ?
      `,
        [groupId],
      );
    } catch (error) {
      throw error;
    }
  }

  // php/dsio/import_shell.php line 2561 -> 2580
  async newMed(bname: string, value: string, groupId: number) {
    try {
      if (!this.handleDsioService.esc('M')) {
        return;
      }

      if (['DCD', 'MCM'].includes(bname)) {
        if (this.handleDsioService.curObj != null) {
          await this.medicaDsioElemService.insertMedicament(groupId); // enregistrement de la contre-indication précédente
        }
        if (bname === 'MCM') {
          // nouveau médicament de la même famille
          const DCD = this.initDsioElemService.DCD;
          this.handleDsioService.curObj = true;
          this.initDsioElemService.construct('DCD', DCD);
          this.initDsioElemService.setInfo(bname, value);
        } else {
          // nouveau médicaent dans une nouvelle famille
          this.handleDsioService.curObj = true;
          this.initDsioElemService.construct(bname, value);
        }
      } else {
        this.initDsioElemService.setInfo(bname, value);
      }
    } catch (error) {
      throw error;
    }
  }

  // php/dsio/import_shell.php line 2582 -> 2596
  async newCorrespondent(
    bname: string,
    value: string,
    groupId: number,
    t_gender_gen: Record<string, number>,
  ) {
    try {
      if (!this.handleDsioService.esc('N')) {
        return;
      }

      if (bname === 'RN1') {
        if (this.handleDsioService.curObj != null) {
          await this.medicaDsioElemService.setCorrespondent(
            groupId,
            t_gender_gen,
          ); // Enregistrement du correspndant précédent
        }
        this.handleDsioService.curObj = true;
        this.initDsioElemService.construct(bname, value);
      } else if (bname === 'PC1') {
        value = this.handleDsioService.Id_prat =
          !value || !this.handleDsioService.ar_prat[value]
            ? 0
            : this.handleDsioService.ar_prat[value];
      }
      this.initDsioElemService.setInfo(bname, value);
    } catch (error) {
      throw error;
    }
  }

  // php/dsio/import_shell.php line 2598 -> 2612
  async newBnq(bname: string, value: number, groupId: number) {
    try {
      if (!this.handleDsioService.esc('O')) {
        return;
      }

      if (bname === 'PC1') {
        if (this.handleDsioService.curObj != null) {
          await this.medicaDsioElemService.setBnq(
            this.handleDsioService.Id_prat,
            groupId,
          ); // Enregistrement du correspndant précédent
        }
        this.handleDsioService.Id_prat =
          !value || !this.handleDsioService.ar_prat[value]
            ? 0
            : +this.handleDsioService.ar_prat[value];
        value = this.handleDsioService.Id_prat;
        this.handleDsioService.curObj = true;
        this.initDsioElemService.construct(bname, value.toString());
      }
      this.initDsioElemService.setInfo(bname, `${value}`);
    } catch (error) {
      throw error;
    }
  }

  /** php/dsio/import_shell.php line 2620 -> 2660
   * récupération de la valeur d'un élément en vue d'alimenter
   * le prochain enregistrement à créer
   */
  async checkDiezLine(
    buffer: string,
    max_CON_NBR: number,
    groupId: number,
    t_dsio_tasks:
      | Record<string, string>
      | Record<string, Record<string, number>>,
    LFT_ASSOCIATED_ACTS: Record<string, string>,
    t_COF: Record<string, number[]>,
    t_gender_gen: Record<string, number>,
    t_phone_type_pty: Record<string, number>,
    ngapKeys: Record<string, number>,
  ) {
    try {
      const bname = buffer.substring(1, 4);
      let value = buffer
        .slice(4)
        .replace(
          /[\x00-\x08\x0A-\x1F\x7F\uFEFF\u{10000}-\u{3FFFF}\u{40000}-\u{FFFFF}\u{100000}-\u{10FFFF}]/gu,
          ' ',
        )
        .trim();

      if ((bname === 'PC1' && !isNaN(Number(value))) || bname === 'PR1') {
        value = String(0 + Number(value));
      } else if (bname === 'PTC' && !isNaN(Number(value))) {
        value = String(
          Math.floor(Number(value)) + max_CON_NBR ? max_CON_NBR : '',
        );
      }

      if (this.handleDsioService.esc('B')) {
        await this.preDateDsioService.newPrat(
          bname,
          value,
          groupId,
          t_dsio_tasks,
          t_gender_gen,
          ngapKeys,
        );
      } else if (this.handleDsioService.esc('C')) {
        await this.preDateDsioService.newPat(
          bname,
          value,
          groupId,
          t_dsio_tasks,
          t_COF,
          t_gender_gen,
          t_phone_type_pty,
          ngapKeys,
        );
      } else if (
        this.handleDsioService.esc('D') ||
        this.handleDsioService.esc('P')
      ) {
        await this.preDateDsioService.newActe(
          bname,
          value,
          groupId,
          t_dsio_tasks,
          t_gender_gen,
          ngapKeys,
        );
      } else if (this.handleDsioService.esc('E')) {
        await this.preDateDsioService.newPaiement(
          bname,
          value,
          groupId,
          t_dsio_tasks,
          t_gender_gen,
          ngapKeys,
        );
      } else if (this.handleDsioService.esc('F')) {
        // Serge le 28/06/2013
        await this.newAmountDue(
          bname,
          value,
          groupId,
          t_dsio_tasks,
          t_gender_gen,
          ngapKeys,
        );
      } else if (this.handleDsioService.esc('H')) {
        // Serge le 01/07/2013
        await this.newFamily(bname, value, groupId); // Alimentation d'une nouvelle famille d'actes
      } else if (this.handleDsioService.esc('I')) {
        // Serge le 04/07/2013
        await this.newFamilyTask(
          bname,
          value,
          t_dsio_tasks,
          LFT_ASSOCIATED_ACTS,
          groupId,
        ); // Alimentation d'un nouvel acte de la bibliothèque
      } else if (this.handleDsioService.esc('J')) {
        await this.preDateDsioService.newPostit(
          bname,
          value,
          groupId,
          t_dsio_tasks,
          t_gender_gen,
          ngapKeys,
        ); // Alimentation d'un nouveau postit
      } else if (this.handleDsioService.esc('K')) {
        await this.newCI(bname, value, groupId, max_CON_NBR); // Alimentation d'une nouvelle famille de médicaments
      } else if (this.handleDsioService.esc('L')) {
        await this.newMedFam(bname, value, groupId); // Alimentation d'un nouvel acte de la bibliothèque
      } else if (this.handleDsioService.esc('M')) {
        await this.newMed(bname, value, groupId); // Alimentation d'un
      } else if (this.handleDsioService.esc('N')) {
        await this.newCorrespondent(bname, value, groupId, t_gender_gen); // Alimentation d'un nouveau correspondant
      } else if (this.handleDsioService.esc('O')) {
        await this.newBnq(bname, Number(value), groupId); // Alimentation d'un nouveau compte bancaire
      }
    } catch (error) {
      throw error;
    }
  }
}
