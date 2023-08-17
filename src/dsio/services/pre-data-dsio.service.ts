import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { HandleDsioService } from './handle-dsio.service';
import * as dayjs from 'dayjs';
import { DataSource } from 'typeorm';
import { InitDsioElemService } from './init-dsio.elem.service';
import { ActDsioElemService } from './act-dsio.elem.service';
import { PaymentDsioElemService } from './payment-dsio.elem.service';
import { LibraryDsioElemService } from './library-dsio.elem.service';
import { MedicaDsioElemService } from './medica-dsio.elem.service';

@Injectable()
export class PreDataDsioService {
  constructor(
    @Inject(forwardRef(() => HandleDsioService))
    private handleDsioService: HandleDsioService,
    private dataSource: DataSource,
    private initDsioElemService: InitDsioElemService,
    private actDsioElemService: ActDsioElemService,
    private paymentDsioElemService: PaymentDsioElemService,
    private libraryDsioElemService: LibraryDsioElemService,
    private medicaDsioElemService: MedicaDsioElemService,
  ) {}

  /** php/dsio/import_shell.php line 2081 -> 2105
   * Permet d'affecter une valeur pour une balise à l'enregistrement d'un praticien
   * en court de définition.
   */
  async newPrat(
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
      if (!this.handleDsioService.esc('B')) {
        return;
      }
      if (bname === 'PN1') {
        await this.chPrat('', groupId, t_dsio_tasks, t_gender_gen, ngapKeys); // Nouveau praticien
        this.handleDsioService.PC1 = '';
        this.handleDsioService.Id_prat = 0;
        this.handleDsioService.Id_agn = 0;
      } else if (bname === 'PC1') {
        this.handleDsioService.PC1 = value;
        this.handleDsioService.Id_prat = this.handleDsioService.ar_prat[value]
          ? this.handleDsioService.ar_prat[value]
          : 0;
      } else if (bname === 'PR1') {
        //this.Id_agn = isset(this.ar_agn[$value])?this.ar_agn[$value]:0;
      } else if (value && ['CA1', 'CA2', 'CAZ', 'CAV'].includes(bname)) {
        await this.handleDsioService.updateAdr(bname, value, groupId); // Affectation de l'adresse au groupe et praticiens
      }
    } catch (error) {
      throw error;
    }
  }

  /** php/dsio/import_shell.php line 2114 -> 2162
   * Dans une section, le fait de changer de praticien indique la fin de définition
   * d'un enregistrement : il faut donc appeler à créer l'enregistrement avant d'en
   * entammer un nouveau.
   */
  async chPrat(
    IDSIO: string,
    groupId: number,
    t_dsio_tasks:
      | Record<string, string>
      | Record<string, Record<string, number>>,
    t_gender_gen: Record<string, number>,
    ngapKeys: Record<string, number>,
  ) {
    try {
      if (this.handleDsioService.curObj) {
        if (
          (this.handleDsioService.esc('D') ||
            this.handleDsioService.esc('P')) &&
          (this.handleDsioService.Id_prat || this.handleDsioService.Id_agn)
        ) {
          // enregistrement du nouvel acte/rdv
          if (
            !this.initDsioElemService.SDA ||
            this.initDsioElemService.SDA === '00000000' ||
            !dayjs(this.initDsioElemService.SDA).isValid()
          ) {
            this.initDsioElemService.setInfo('SDA', '19700101');
          }
          this.initDsioElemService.setInfo('FRQ', this.handleDsioService.FRQ);
          if (this.handleDsioService.Id_agn) {
            const id_prat = !this.handleDsioService.Id_prat
              ? this.handleDsioService.Id_prat_defaut
              : this.handleDsioService.Id_prat;
            await this.actDsioElemService.creatRdv(
              this.handleDsioService.Id_agn,
              id_prat,
              this.handleDsioService.Id_pat,
            );
          } else {
            await this.actDsioElemService.creatActe(
              this.handleDsioService.Id_prat,
              this.handleDsioService.Id_pat,
              this.handleDsioService.getNewHRDV(this.initDsioElemService.SDA),
              this.handleDsioService.actesMacDent,
              this.handleDsioService.actesAgatha,
              this.handleDsioService.actesDentalOnLine,
              t_dsio_tasks,
              ngapKeys,
            );
          }
          this.handleDsioService.curObj = null;
        } else if (
          this.handleDsioService.esc('E') &&
          this.handleDsioService.Id_prat &&
          this.handleDsioService.Id_pat
        ) {
          // enregistrement du nouveau paiement
          await this.paymentDsioElemService.creatPaiement(
            this.handleDsioService.Id_prat,
            this.handleDsioService.Id_pat,
          );
          this.handleDsioService.curObj = null;
        } else if (
          this.handleDsioService.esc('F') &&
          this.handleDsioService.Id_prat &&
          this.handleDsioService.Id_pat
        ) {
          // Serge le 28/06/2013)
          // mise à jour du montant dû du patient
          this.initDsioElemService.setInfo('FRQ', this.handleDsioService.FRQ);
          await this.paymentDsioElemService.setAmountDue(
            this.handleDsioService.Id_prat,
            this.handleDsioService.Id_pat,
          );
          this.handleDsioService.curObj = null;
        } else if (
          this.handleDsioService.esc('J') &&
          this.handleDsioService.Id_pat
        ) {
          let ar_ptt_user: number[] | { [key: number]: string } = [];
          if (this.handleDsioService.Id_prat) {
            (ar_ptt_user as number[]).push(this.handleDsioService.Id_prat);
          } else {
            ar_ptt_user = this.handleDsioService.ar_prat;
          }
          this.initDsioElemService.setInfo(
            'PTC',
            this.handleDsioService.Id_pat + '',
          );
          if (Array.isArray(ar_ptt_user)) {
            for (const Id_ptt_user of ar_ptt_user) {
              this.initDsioElemService.setInfo('PC1', Id_ptt_user + '');
              await this.libraryDsioElemService.setPostit();
            }
          } else {
            for (const key of Object.keys(ar_ptt_user)) {
              this.initDsioElemService.setInfo('PC1', ar_ptt_user[key]);
              await this.libraryDsioElemService.setPostit();
            }
          }
        } else if (
          this.handleDsioService.esc('N') &&
          this.handleDsioService.Id_prat
        ) {
          // enregistrement d'un nouveau correspondant
          this.initDsioElemService.setInfo(
            'PC1',
            `${this.handleDsioService.Id_prat}`,
          );
          await this.medicaDsioElemService.setCorrespondent(
            groupId,
            t_gender_gen,
          );
        } else if (
          this.handleDsioService.esc('O') &&
          this.handleDsioService.Id_prat
        ) {
          // enregistrement d'un nouveau correspondant
          this.initDsioElemService.setInfo(
            'PC1',
            this.handleDsioService.Id_prat + '',
          );
          await this.medicaDsioElemService.setBnq(
            this.handleDsioService.Id_prat,
            groupId,
          );
        }
      }
      this.handleDsioService.Id_prat =
        !IDSIO || !this.handleDsioService.ar_prat[IDSIO]
          ? this.handleDsioService.Id_prat_defaut
          : this.handleDsioService.ar_prat[IDSIO];
      this.handleDsioService.Id_agn = 0;
    } catch (error) {
      throw error;
    }
  }

  /** php/dsio/import_shell.php line 2171 -> 2198
   * Permet d'affecter une valeur pour une balise à l'enregistrement d'un patient
   * en court de définition.
   */
  async newPat(
    bname: string,
    value: string,
    groupId: number,
    t_dsio_tasks:
      | Record<string, string>
      | Record<string, Record<string, number>>,
    t_COF: Record<string, number[]>,
    t_gender_gen: Record<string, number>,
    t_phone_type_pty: Record<string, number>,
    ngapKeys: Record<string, number>,
  ) {
    try {
      if (!this.handleDsioService.esc('C')) {
        return;
      }
      if (bname === 'PTN') {
        // Nouveau patient
        if (this.handleDsioService.PTC) {
          // On enregistre d'abord le précédent et on récupère l'ID de l'enregistrement
          this.handleDsioService.ar_pat[this.handleDsioService.PTC] =
            await this.initDsioElemService.creatPatient(
              this.handleDsioService.ar_fam,
              this.handleDsioService.ar_prat,
              Object.keys(this.handleDsioService.ar_pat).length + 1,
              groupId,
              t_COF,
              t_gender_gen,
              t_phone_type_pty,
            ); // ID du patient créé.
          this.handleDsioService.curObj = null; // Libération de la mémoire
        }

        // On prépare le suivant
        await this.chPat('', groupId, t_dsio_tasks, t_gender_gen, ngapKeys);
        if (value) {
          this.handleDsioService.curObj = true;
          this.initDsioElemService.construct(bname, value);
        }
      } else {
        if (!this.handleDsioService.curObj) {
          this.handleDsioService.curObj = true;
          this.initDsioElemService.construct(bname, value);
        } else {
          this.initDsioElemService.setInfo(bname, value);
        }
        if (bname === 'PTC') {
          this.handleDsioService.PTC = value;
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /** php/dsio/import_shell.php line 2207 -> 2218
   * Comme pour le chnagement de praticien (cf fonction chPrat), le fait de changer
   * de patient indique la fin de définition d'un enregistrement : il faut donc
   * appeler à créer l'enregistrement avant d'en entammer un nouveau.
   *
   * @param string $IDSIO l'identifiant DSIO du nouveau praticien sélectionné
   */
  async chPat(
    IDSIO: string,
    groupId: number,
    t_dsio_tasks:
      | Record<string, string>
      | Record<string, Record<string, number>>,
    t_gender_gen: Record<string, number>,
    ngapKeys: Record<string, number>,
  ) {
    try {
      await this.chPrat('', groupId, t_dsio_tasks, t_gender_gen, ngapKeys);
      if (IDSIO && !this.handleDsioService.ar_pat[IDSIO]) {
        const conIds: { CON_ID: number }[] = await this.dataSource.query(
          `SELECT CON_ID from T_CONTACT_CON where organization_id = ? and CON_NBR = ? order by CON_ID asc limit 1`,
          [groupId, IDSIO],
        );
        const CON_ID = conIds[0].CON_ID;
        if (CON_ID) {
          this.handleDsioService.ar_pat[IDSIO] = CON_ID;
        }
      }
      this.handleDsioService.Id_pat =
        !IDSIO || !this.handleDsioService.ar_pat[IDSIO]
          ? 0
          : this.handleDsioService.ar_pat[IDSIO];
    } catch (error) {
      throw error;
    }
  }

  /** php/dsio/import_shell.php line 2227 -> 2253
   * Permet d'affecter une valeur pour une balise à l'enregistrement de soin
   * en court de définition.
   */
  async newActe(
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
      if (
        !this.handleDsioService.esc('D') &&
        !this.handleDsioService.esc('P')
      ) {
        return;
      }
      if (this.handleDsioService.curObj == null) {
        this.handleDsioService.curObj = true;
        this.initDsioElemService.construct(bname, value);
        if (this.handleDsioService.esc('P')) {
          this.initDsioElemService.setInfo('STA', 'P');
        }
        if (bname === 'PTC') {
          this.handleDsioService.Id_pat =
            !value || !this.handleDsioService.ar_pat[value]
              ? 0
              : this.handleDsioService.ar_pat[value];
        } else if (bname === 'PC1') {
          this.handleDsioService.Id_prat =
            !value || !this.handleDsioService.ar_prat[value]
              ? 0
              : this.handleDsioService.ar_prat[value];
        } else if (bname === 'PR1') {
          this.handleDsioService.Id_agn = this.handleDsioService.ar_agn[value]
            ? this.handleDsioService.ar_agn[value]
            : 0;
        }
      } else if (bname === 'PTC') {
        await this.chPat(value, groupId, t_dsio_tasks, t_gender_gen, ngapKeys);
      } else if (bname === 'PC1') {
        await this.chPrat(value, groupId, t_dsio_tasks, t_gender_gen, ngapKeys);
      } else {
        if (bname === 'PR1') {
          this.handleDsioService.Id_agn = this.handleDsioService.ar_agn[value]
            ? this.handleDsioService.ar_agn[value]
            : 0;
        }
        this.initDsioElemService.setInfo(bname, value);
      }
    } catch (error) {
      throw error;
    }
  }

  /** php/dsio/import_shell.php line 2263 -> 2280
   * Permet d'affecter une valeur pour une balise à l'enregistrement d'un postit
   * en cours de définition.
   */
  async newPostit(
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
      if (!this.handleDsioService.esc('J')) {
        return;
      }
      if (this.handleDsioService.curObj == null) {
        this.handleDsioService.curObj = true;
        this.initDsioElemService.construct(bname, value);
      }
      if (bname == 'PTC') {
        await this.chPat(value, groupId, t_dsio_tasks, t_gender_gen, ngapKeys);
        this.handleDsioService.curObj = true;
        this.initDsioElemService.construct(bname, value);
      } else if (bname == 'PC1') {
        await this.chPrat(value, groupId, t_dsio_tasks, t_gender_gen, ngapKeys);
        this.handleDsioService.curObj = true;
        this.initDsioElemService.construct(bname, value);
        this.initDsioElemService.setInfo(
          'PTC',
          `${this.handleDsioService.Id_pat}`,
        );
      } else {
        this.initDsioElemService.setInfo(bname, value);
      }
    } catch (error) {
      throw error;
    }
  }

  /** php/dsio/import_shell.php line 2289 -> 2307
   * Permet d'affecter une valeur pour une balise à l'enregistrement de paiement
   * en court de définition.
   */
  async newPaiement(
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
      if (!this.handleDsioService.esc('E')) {
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
        } else if (bname === 'PC1') {
          this.handleDsioService.Id_prat =
            !value || !this.handleDsioService.ar_prat[value]
              ? 0
              : this.handleDsioService.ar_prat[value];
        }
      } else if (bname === 'PTC') {
        await this.chPat(value, groupId, t_dsio_tasks, t_gender_gen, ngapKeys);
      } else if (bname === 'PC1') {
        await this.chPrat(value, groupId, t_dsio_tasks, t_gender_gen, ngapKeys);
      } else {
        this.initDsioElemService.setInfo(bname, value);
      }
    } catch (error) {
      throw error;
    }
  }
}
