import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ImporterDsioDto } from '../dto/importer-dsio.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import dayjs from 'dayjs';
import * as duration from 'dayjs/plugin/duration';
import { execSync } from 'child_process';
import { AmountDueService } from 'src/command/services/amount.due.services';
import { DsioElemService } from './dsio.elem.service';

/**
 * php/dsio/import_shell.php line 1697 ->
 */
@Injectable()
export class DsioService {
  private currentQuery: string;
  private pathname = ''; // nom du fichier
  private filesize: number; // taille du fichier
  private handle: fs.ReadStream = null; // ressource du fichier DSIO
  private json: fs.WriteStream = null; //ressource du fichier json d'état d'avancement
  private debut = 0;
  private ESC = 'A'; // section courante
  private PC1: string;
  private Id_prat = 0; // Id dans C&W
  private Id_prat_defaut = 0; // Id par défaut si aucun sélectionné alors qu'il en faut un (rdv)
  private Id_agn = 0; // Id de la ressource de l'agenda sans praticien
  private PTC = ''; // Id dsio du patient en cours de création
  private Id_pat = 0; // Id dans C&W
  private Id_Family_Tasks = 0; // Id d'une famille de tâche
  private ar_pat: Record<string, number> = {}; // tableau [Id_DSIO] => Id_C&W pour les patients
  private ar_prat: number[] | { [key: number]: string } = []; // tableau [Id_DSIO] => Id_C&W pour les praticiens
  private ar_agn = {}; // tableau [Id_DSIO] => id_ecoo pour les ressources d'agenda
  private ar_fam = {}; // tableau [Id_DSIO] => Id_C&W pour les familles
  private curObj: DsioElemService = null; // DSIO_ELEM
  private FRQ: duration.Duration;
  private HMD: string;
  private HMF: string;
  private HAD: string;
  private HAF: string;
  private AR_HRDV: Record<string, Record<string, string>>;
  private section = {
    A: "Détection du type d'agrément",
    B: 'Référencement des Professionnels de Santé',
    C: 'Importation des fiches Patients',
    D: 'Importation des soins',
    E: 'Importation des honoraires',
    F: 'Importation des montants dus',
    G: 'Section comptabilité',
    H: "Importation des familles d'actes",
    I: 'Importation des actes de la bibliothèque',
    J: 'Importation des postits patients',
    K: 'Importation des contre-indications',
    L: 'Importation des médicaments',
    M: 'Importation des médicaments',
    N: 'Importation des correspondants',
    O: 'Importation des banques',
    P: 'Importation des rendez-vous',
  };
  public noline = 0;
  private importEtendu = false;
  private actesMacDent = false;
  private actesAgatha = false;
  private actesDentalOnLine = false;

  constructor(
    private dataSource: DataSource,
    private amountDueService: AmountDueService,
    private dsioElemService: DsioElemService,
  ) {
    this.curObj = dsioElemService;
  }

  // php/dsio/import_shell.php line 1753 -> 1780
  async construct(
    pathname: string,
    payload: ImporterDsioDto,
    groupId: number,
    utf8: boolean,
    FRQ: number,
    HMD: string,
    HMF: string,
    HAD: string,
    HAF: string,
  ) {
    try {
      this.pathname = pathname;
      if (fs.existsSync(pathname)) {
        const fileCheck = execSync(`file -i ${pathname}`);
        utf8 = fileCheck.toString().includes('utf-8');
        this.filesize = fs.statSync(pathname).size;
        this.handle = fs.createReadStream(pathname);
        this.json = fs.createWriteStream(`${pathname}.json`);
      } else {
        fs.writeFileSync(
          `${pathname}.json`,
          JSON.stringify({
            status: -2,
            error: "Problème d'accès au fichier DSIO",
          }),
        );
      }

      this.initHorraires(FRQ, HMD, HMF, HAD, HAF);
      const sections = payload.sections;
      this.ar_prat = sections['Praticiens'] ? sections['Praticiens'] : {};
      this.ar_agn = sections['Agendas'] ? sections['Agendas'] : {};

      if (Object.keys(this.ar_prat).length) {
        this.Id_prat_defaut = Number(`${Object.values(this.ar_prat)[0]}`);
      } else {
        const usrId: { USR_ID: number }[] = await this.dataSource.query(
          'SELECT USR_ID from T_USER_USR where organization_id=? and USR_ADMIN=1 order by USR_ID asc limit 1',
          [groupId],
        );
        this.Id_prat_defaut = usrId[0].USR_ID;
      }

      fs.writeFileSync(`${pathname}.prop`, JSON.stringify(payload));
      fs.writeFileSync(`${pathname}.prop`, JSON.stringify(this));
    } catch (error) {
      throw error;
    }
  }

  // php/dsio/import_shell.php line 1785 -> 1793
  // Initialise certaines données de l'objet pour la gestion des rdvs à créer
  initHorraires(
    FRQ: number,
    HMD: string,
    HMF: string,
    HAD: string,
    HAF: string,
  ) {
    dayjs.extend(duration);
    this.FRQ = dayjs.duration(`PT${FRQ}M`);
    this.HMD = HMD;
    this.HMF = HMF;
    this.HAD = HAD;
    this.HAF = HAF;
  }

  /** php/dsio/import_shell.php line 1801 -> 1820
   * Mémorise et fourni un horaire libre pour un rendez-vous pour un jour donné.
   *
   * @param string $date_dsio date pour laquelle obtenir un horraire libre
   * @return DateTime date et surtout heure de l'horaire libre
   */
  getNewHRDV(date_dsio: string) {
    if (date_dsio === '00000000') {
      return false;
    }

    if (!this.AR_HRDV[this.Id_prat]) {
      this.AR_HRDV[this.Id_prat] = {};
    }

    if (!this.AR_HRDV[this.Id_prat][date_dsio]) {
      // Tout premier rdv pour ce jour
      this.AR_HRDV[this.Id_prat][date_dsio] = dayjs(
        `${date_dsio}${this.HMD}:00`,
      ).format('YYYYMMDDHH:mm:ss');
    } else if (
      dayjs(this.AR_HRDV[this.Id_prat][date_dsio]).format('HH:mm') === this.HMF
    ) {
      // On saute la pause de midi
      this.AR_HRDV[this.Id_prat][date_dsio] = dayjs(
        `${date_dsio}${this.HAD}:00`,
      ).format('YYYYMMDDHH:mm:ss');
    } else if (
      dayjs(this.AR_HRDV[this.Id_prat][date_dsio]).format('HH:mm') === this.HAF
    ) {
      // Arrivé en fin de journée, on reprend au début
      this.AR_HRDV[this.Id_prat][date_dsio] = dayjs(
        `${date_dsio}${this.HMD}:00`,
      ).format('YYYYMMDDHH:mm:ss');
    }

    return this.AR_HRDV[this.Id_prat][date_dsio];
  }

  /** php/dsio/import_shell.php line 1828 -> 1830
   * Permet de savoir si nous sommes dans la bonne section.
   *
   * @param string $bname nom de la section à tester
   * @return boolean TRUE si la section à tester est la section courante, sinon FALSE
   */
  esc(bname: string) {
    return !this.ESC.localeCompare(bname);
  }

  /** php/dsio/import_shell.php line 1838 -> 1859
   * Récupère une nouvelle ligne du fichier DSIO et met à jour l'état
   * d'avancement.
   */
  async getLine(buffer: string, utf8: boolean) {
    try {
      /* On est pas encore à la fin du fichier */
      // @TODO set_time_limit(30);
      const rapport = {
        status: 1,
        action: this.section[this.ESC],
        prc: ((100 * this.handle.bytesRead) / this.filesize).toFixed(2),
        noline: ++this.noline,
        line: buffer,
        time: Date.now() - this.debut,
      };

      fs.writeFileSync(this.json.path, JSON.stringify(rapport), { flag: 'w' });

      if (!utf8) {
        buffer = Buffer.from(buffer).toString('utf-8');
      }
      return buffer;
    } catch (error) {
      throw error;
    }
  }

  /** php/dsio/import_shell.php line 1873 -> 2011
   * Permet de réaliser les opérations nécessaires lors du changement
   * de section (création de l'enregistrement qui était en cours de
   * définition, mise à jour de certaine données de l'objet ...).
   *
   * Comme nous ne gérons pas les sections au delà de la E, la fonction
   * renvoie FALSE pour terminer les opérations une fois cette dernière
   * terminée.
   *
   * @param string $bname nom de la nouvelle section
   * @return boolean continuer à parser le fichier DSIO ou terminer
   */
  async newSection(
    bname: string,
    groupId: number,
    patient_number: number,
    LFT_ASSOCIATED_ACTS: Record<string, string>,
    t_dsio_tasks:
      | Record<string, string>
      | Record<string, Record<string, number>>,
  ) {
    try {
      const TRIGGER_CHECKS = 'FALSE';
      await this.dataSource.query(`SET @TRIGGER_CHECKS = ${TRIGGER_CHECKS}`);

      switch (this.ESC) {
        case 'A':
          break;
        case 'B':
          await this.newPrat('PN1', '', groupId, t_dsio_tasks); // on est à la fin de B
          break;
        case 'C': // on est à la fin de C
          await this.newPat('PTN', '', groupId, t_dsio_tasks);
          break;
        case 'D':
        case 'P':
          await this.chPat('', groupId, t_dsio_tasks); // on est à la fin de D
          break;
        case 'E':
          await this.chPat('', groupId, t_dsio_tasks); // on est à la fin de E
          const rapport = {
            status: 1,
            action: 'Calcul des montants dus',
            prc: ((100 * this.handle.bytesRead) / this.filesize).toFixed(2),
            noline: this.noline,
            time: Date.now() - this.debut,
          };
          fs.writeFileSync(`${this.pathname}.json`, JSON.stringify(rapport));

          // Commande de calcul du montant dû
          await this.amountDueService.execute(groupId);

          const TRIGGER_CHECKS = 'TRUE';
          await this.dataSource.query(
            `SET @TRIGGER_CHECKS = ${TRIGGER_CHECKS}`,
          );
          break;
        case 'F':
          await this.chPat('', groupId, t_dsio_tasks); // on est à la fin de F
          break;
        default: {
          if (this.importEtendu || this.actesMacDent) {
            switch (this.ESC) {
              case 'G':
                break; // on est à la fin de G ou fin de fichier
              case 'H': // on est à la fin de H
                if (this.curObj != null) {
                  await this.chFam(groupId);
                }
                break;
              case 'I': // on est à la fin de I
                if (this.curObj != null) {
                  // Il faut enregistrer un dernier acte
                  if (this.actesMacDent) {
                    await this.curObj.setLibraryMact(t_dsio_tasks, groupId);
                  } else {
                    await this.curObj.setLibraryAct(
                      t_dsio_tasks,
                      LFT_ASSOCIATED_ACTS,
                      groupId,
                    );
                  }
                  this.curObj = null;
                }
                // Il faut affecter les actes associés
                await this.assocAct(groupId, LFT_ASSOCIATED_ACTS, t_dsio_tasks);
                break;
              case 'J': // on est à la fin de J
                if (this.curObj != null) {
                  await this.chPat('', groupId, t_dsio_tasks);
                } else {
                  this.curObj = null;
                }
                break;
              default: {
                if (!this.importEtendu) {
                  return false;
                }

                switch (this.ESC) {
                  case 'K': //on est à la fin de K
                    if (this.curObj != null) {
                      await this.curObj.insertContraindication(groupId);
                    }
                    this.curObj = null;
                    break;
                  case 'L': // on est à la fin de L
                    if (this.curObj != null) {
                      await this.curObj.insertMedicamentFamily(groupId);
                    }
                    this.curObj = null;
                    break;
                  case 'M': // on est à la fin de M
                    if (this.curObj != null) {
                      await this.curObj.insertMedicament(groupId);
                    }
                    this.curObj = null;
                    break;
                  case 'N': // on est à la fin de N
                    if (this.curObj != null) {
                      await this.curObj.setCorrespondent(groupId);
                    }
                    this.curObj = null;
                    break;
                  case 'O': // on est à la fin de O
                    if (this.curObj != null) {
                      await this.curObj.setBnq(this.Id_prat, groupId);
                    }
                    this.curObj = null;
                    break;
                  default: // On ne devrait jamais passer par là
                    if (this.curObj != null) {
                      await this.chPat('', groupId, t_dsio_tasks);
                    }
                    return false;
                }
              }
            }
          }
        }
      }

      if (bname == 'H' && (this.importEtendu || this.actesMacDent)) {
        // On passe en bibliothèque d'actes : on supprime l'initiale
        await this.deleteLibrary(groupId, patient_number);
        this.curObj = null;
      }

      this.ESC = bname;

      return true;
    } catch (error) {
      throw error;
    }
  }

  // php/dsio/import_shell.php line 2021 -> 2072
  // Permet de mettre à jour l'adresse postale du groupe et de chaque compte utilisateur
  async updateAdr(bname: string, value: string, groupId: number) {
    const ar_adr_ids: number[] = [];
    const queries = [
      ['T_USER_USR', 'USR_ID', 'organization_id'],
      ['T_GROUP_GRP', 'GRP_ID', 'GRP_ID'],
    ];

    try {
      queries.forEach(async (query) => {
        const table = query[0];
        const field = query[1];
        const where = query[2];

        const res: { ADR_ID: number }[] = await this.dataSource.query(
          `select ${field}, ADR_ID from ${table} where ${where}=${groupId}`,
        );
        if (res && res.length > 0) {
          res.forEach(async (row) => {
            if (!row.ADR_ID) {
              // Il n'existe pas d'enregistrement d'adresse donc on le crée
              const newAdd = await this.dataSource.query(
                'insert into `T_ADDRESS_ADR` (ADR_ID) values (0)',
              );
              row['ADR_ID'] = newAdd.insertId;
              await this.dataSource.query(
                `update ${table} set ADR_ID=${row['ADR_ID']} where ${field}=${row[field]}`,
              );
            }
            ar_adr_ids.push(row.ADR_ID);
          });
        }
      });

      const ADR_ID = ar_adr_ids.join(',');
      bname = bname.substring(2);
      let set = '';
      if (bname === '1') {
        // Ligne d'adresse 1
        set = `ADR_STREET = SUBSTRING("${value}",1,255)`;
      } else if (bname === '2') {
        // Ligne d'adresse 2
        set = `ADR_STREET_COMP = SUBSTRING("${value}",1,255)`;
      } else if (bname === 'Z') {
        // Code postal
        set = `ADR_ZIP_CODE = SUBSTRING("${value}",1,6)`;
      } else if (bname === 'V') {
        // Ville
        set = `ADR_CITY = SUBSTRING("${value}",1,255)`;
      }

      if (set && ADR_ID) {
        const query = `UPDATE T_ADDRESS_ADR set ${set} where ADR_ID in (${ADR_ID})`;
        this.currentQuery = query;
        await this.dataSource.query(query);
      }
    } catch (error) {
      throw error;
    }
  }

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
  ) {
    try {
      if (!this.esc('B')) {
        return;
      }
      if (bname === 'PN1') {
        await this.chPrat('', groupId, t_dsio_tasks); // Nouveau praticien
        this.PC1 = '';
        this.Id_prat = 0;
        this.Id_agn = 0;
      } else if (bname === 'PC1') {
        this.PC1 = value;
        this.Id_prat = this.ar_prat[value] ? this.ar_prat[value] : 0;
      } else if (bname === 'PR1') {
        //this.Id_agn = isset(this.ar_agn[$value])?this.ar_agn[$value]:0;
      } else if (value && ['CA1', 'CA2', 'CAZ', 'CAV'].includes(bname)) {
        await this.updateAdr(bname, value, groupId); // Affectation de l'adresse au groupe et praticiens
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
  ) {
    try {
      if (this.curObj) {
        if ((this.esc('D') || this.esc('P')) && (this.Id_prat || this.Id_agn)) {
          // enregistrement du nouvel acte/rdv
          if (
            !this.curObj.SDA ||
            this.curObj.SDA === '00000000' ||
            !dayjs(this.curObj.SDA).isValid()
          ) {
            this.curObj.setInfo('SDA', '19700101');
          }
          this.curObj.setInfo('FRQ', this.FRQ);
          if (this.Id_agn) {
            const id_prat = !this.Id_prat ? this.Id_prat_defaut : this.Id_prat;
            await this.curObj.creatRdv(this.Id_agn, id_prat, this.Id_pat);
          } else {
            await this.curObj.creatActe(
              this.Id_prat,
              this.Id_pat,
              this.getNewHRDV(this.curObj.SDA),
              this.actesMacDent,
              this.actesAgatha,
              this.actesDentalOnLine,
              groupId,
              t_dsio_tasks,
            );
          }
          this.curObj = null;
        } else if (this.esc('E') && this.Id_prat && this.Id_pat) {
          // enregistrement du nouveau paiement
          await this.curObj.creatPaiement(this.Id_prat, this.Id_pat);
          this.curObj = null;
        } else if (this.esc('F') && this.Id_prat && this.Id_pat) {
          // Serge le 28/06/2013)
          // mise à jour du montant dû du patient
          this.curObj.setInfo('FRQ', this.FRQ);
          await this.curObj.setAmountDue(this.Id_prat, this.Id_pat);
          this.curObj = null;
        } else if (this.esc('J') && this.Id_pat) {
          let ar_ptt_user: number[] | { [key: number]: string } = [];
          if (this.Id_prat) {
            (ar_ptt_user as number[]).push(this.Id_prat);
          } else {
            ar_ptt_user = this.ar_prat;
          }
          this.curObj.setInfo('PTC', this.Id_pat + '');
          if (Array.isArray(ar_ptt_user)) {
            ar_ptt_user.forEach(async (Id_ptt_user) => {
              this.curObj.setInfo('PC1', Id_ptt_user + '');
              await this.curObj.setPostit();
            });
          } else {
            Object.keys(ar_ptt_user).forEach(async (key) => {
              this.curObj.setInfo('PC1', ar_ptt_user[key]);
              await this.curObj.setPostit();
            });
          }
        } else if (this.esc('N') && this.Id_prat) {
          // enregistrement d'un nouveau correspondant
          this.curObj.setInfo('PC1', `${this.Id_prat}`);
          await this.curObj.setCorrespondent(groupId);
        } else if (this.esc('O') && this.Id_prat) {
          // enregistrement d'un nouveau correspondant
          this.curObj.setInfo('PC1', this.Id_prat + '');
          await this.curObj.setBnq(this.Id_prat, groupId);
        }
      }
      this.Id_prat =
        !IDSIO || !this.ar_prat[IDSIO]
          ? this.Id_prat_defaut
          : this.ar_prat[IDSIO];
      this.Id_agn = 0;
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
  ) {
    try {
      if (!this.esc('C')) {
        return;
      }
      if (bname === 'PTN') {
        // Nouveau patient
        if (this.PTC) {
          // On enregistre d'abord le précédent et on récupère l'ID de l'enregistrement
          this.ar_pat[this.PTC] = await this.curObj.creatPatient(
            this.ar_fam,
            this.ar_prat,
            Object.keys(this.ar_pat).length + 1,
            groupId,
          ); // ID du patient créé.
          this.curObj = null; // Libération de la mémoire
        }

        // On prépare le suivant
        this.chPat('', groupId, t_dsio_tasks);
        if (value) {
          this.curObj = this.dsioElemService.construct(bname, value);
        }
      } else {
        if (!this.curObj) {
          this.curObj = this.dsioElemService.construct(bname, value);
        } else {
          this.curObj.setInfo(bname, value);
        }
        if (bname === 'PTC') {
          this.PTC = value;
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
  ) {
    try {
      this.chPrat('', groupId, t_dsio_tasks);
      if (IDSIO && !this.ar_pat[IDSIO]) {
        const conIds: { CON_ID: number }[] = await this.dataSource.query(
          `SELECT CON_ID from T_CONTACT_CON where organization_id = ? and CON_NBR = ? order by CON_ID asc limit 1`,
          [groupId, IDSIO],
        );
        const CON_ID = conIds[0].CON_ID;
        if (CON_ID) {
          this.ar_pat[IDSIO] = CON_ID;
        }
      }
      this.Id_pat = !IDSIO || !this.ar_pat[IDSIO] ? 0 : this.ar_pat[IDSIO];
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
  ) {
    try {
      if (!this.esc('D') && !this.esc('P')) {
        return;
      }
      if (this.curObj == null) {
        this.curObj = this.dsioElemService.construct(bname, value);
        if (this.esc('P')) {
          this.curObj.setInfo('STA', 'P');
        }
        if (bname === 'PTC') {
          this.Id_pat = !value || !this.ar_pat[value] ? 0 : this.ar_pat[value];
        } else if (bname === 'PC1') {
          this.Id_prat =
            !value || !this.ar_prat[value] ? 0 : this.ar_prat[value];
        } else if (bname === 'PR1') {
          this.Id_agn = this.ar_agn[value] ? this.ar_agn[value] : 0;
        }
      } else if (bname === 'PTC') {
        await this.chPat(value, groupId, t_dsio_tasks);
      } else if (bname === 'PC1') {
        await this.chPrat(value, groupId, t_dsio_tasks);
      } else {
        if (bname === 'PR1') {
          this.Id_agn = this.ar_agn[value] ? this.ar_agn[value] : 0;
        }
        this.curObj.setInfo(bname, value);
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
  ) {
    try {
      if (!this.esc('J')) {
        return;
      }
      if (this.curObj == null) {
        this.curObj = this.dsioElemService.construct(bname, value);
      }
      if (bname == 'PTC') {
        await this.chPat(value, groupId, t_dsio_tasks);
        this.curObj = this.dsioElemService.construct(bname, value);
      } else if (bname == 'PC1') {
        await this.chPrat(value, groupId, t_dsio_tasks);
        this.curObj = this.dsioElemService.construct(bname, value);
        this.curObj.setInfo('PTC', `${this.Id_pat}`);
      } else {
        this.curObj.setInfo(bname, value);
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
  ) {
    try {
      if (!this.esc('E')) {
        return;
      }
      if (this.curObj == null) {
        this.curObj = this.dsioElemService.construct(bname, value);
        if (bname === 'PTC') {
          this.Id_pat = !value || !this.ar_pat[value] ? 0 : this.ar_pat[value];
        } else if (bname === 'PC1') {
          this.Id_prat =
            !value || !this.ar_prat[value] ? 0 : this.ar_prat[value];
        }
      } else if (bname === 'PTC') {
        await this.chPat(value, groupId, t_dsio_tasks);
      } else if (bname === 'PC1') {
        await this.chPrat(value, groupId, t_dsio_tasks);
      } else {
        this.curObj.setInfo(bname, value);
      }
    } catch (error) {
      throw error;
    }
  }

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
  ) {
    try {
      if (!this.esc('F')) {
        return;
      }
      if (this.curObj == null) {
        this.curObj = this.dsioElemService.construct(bname, value);
        if (bname === 'PTC') {
          this.Id_pat = !value || !this.ar_pat[value] ? 0 : this.ar_pat[value];
        } else if (bname == 'PC1') {
          this.Id_prat =
            !value || !this.ar_prat[value] ? 0 : this.ar_prat[value];
        }
      } else if (bname === 'PTC') {
        await this.chPat(value, groupId, t_dsio_tasks);
      } else if (bname === 'PC1') {
        await this.chPrat(value, groupId, t_dsio_tasks);
      } else {
        this.curObj.setInfo(bname, value);
      }
    } catch (error) {
      throw error;
    }
  }

  /** php/dsio/import_shell.php line 2343 -> 2355
   * Permet d'affecter une valeur pour une balise à l'enregistrement d'une famille
   * en court de définition.
   */
  newFamily(bname: string, value: string, groupId: number) {
    try {
      if (!this.esc('H')) {
        return;
      }
      if (this.curObj == null) {
        this.curObj = this.dsioElemService.construct(bname, value);
      } else if (bname == 'FLI') {
        this.chFam(groupId);
        this.curObj = this.dsioElemService.construct(bname, value);
      } else {
        this.curObj.setInfo(bname, value);
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
      if (this.curObj != null) {
        await this.curObj.setLibraryFamily(groupId);
        this.curObj = null;
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
      if (!this.esc('I')) {
        return;
      }

      if (bname == 'FCF') {
        this.Id_Family_Tasks = Number(value);
      }
      if (this.curObj == null) {
        this.curObj = this.dsioElemService.construct(bname, value);
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
        this.curObj.setInfo(bname, value);
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
      if (this.actesMacDent) {
        await this.curObj.setLibraryMact(t_dsio_tasks, groupId);
      } else {
        await this.curObj.setLibraryAct(
          t_dsio_tasks,
          LFT_ASSOCIATED_ACTS,
          groupId,
        );
      }
      if (bname !== null) {
        this.curObj = this.dsioElemService.construct(bname, value);
        if (bname !== 'FCF') {
          this.curObj.setInfo('FCF', this.Id_Family_Tasks + '');
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
      Object.entries(LFT_ASSOCIATED_ACTS).forEach(async ([LFT_ID, assoc]) => {
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

        assoc = t_assocs.filter(Boolean).join(',');
        if (assoc.localeCompare(LFT_ID)) {
          const query = `UPDATE T_LIBRARY_FAMILY_TASK_LFT
          SET LFT_ASSOCIATED_ACTS = ?
          WHERE LFT_ID = ?
          AND GRP_ID = ?`;
          await this.dataSource.query(query, [assoc, LFT_ID, groupId]);
        }
      });
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
      if (!this.esc('K')) {
        return;
      }

      if (bname === 'ICI') {
        if (this.curObj != null) {
          await this.curObj.insertContraindication(groupId); // enregistrement de la contre-indication précédente
        } else {
          await this.deleteContraindications(groupId, max_CON_NBR); // première contre-indication => on supprime celles par défaut dans e.coo
        }
        this.curObj = this.dsioElemService.construct(bname, value);
      } else {
        this.curObj.setInfo(bname, value);
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
      if (!this.esc('L')) {
        return;
      }

      if (bname === 'DLI') {
        if (this.curObj != null) {
          await this.curObj.insertMedicamentFamily(groupId); // enregistrement de la contre-indication précédente
        } else {
          await this.deleteMedicamentFamilies(groupId); // première famille on supprime celles par défaut dans e.coo
        }
        this.curObj = this.dsioElemService.construct(bname, value);
      } else {
        this.curObj.setInfo(bname, value);
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
      if (!this.esc('M')) {
        return;
      }

      if (['DCD', 'MCM'].includes(bname)) {
        if (this.curObj != null) {
          await this.curObj.insertMedicament(groupId); // enregistrement de la contre-indication précédente
        }
        if (bname === 'MCM') {
          // nouveau médicament de la même famille
          const DCD = this.curObj.DCD;
          this.curObj = this.dsioElemService.construct('DCD', DCD);
          this.curObj.setInfo(bname, value);
        } else {
          // nouveau médicaent dans une nouvelle famille
          this.curObj = this.dsioElemService.construct(bname, value);
        }
      } else {
        this.curObj.setInfo(bname, value);
      }
    } catch (error) {
      throw error;
    }
  }

  // php/dsio/import_shell.php line 2582 -> 2596
  async newCorrespondent(bname: string, value: string, groupId: number) {
    try {
      if (!this.esc('N')) {
        return;
      }

      if (bname === 'RN1') {
        if (this.curObj != null) {
          await this.curObj.setCorrespondent(groupId); // Enregistrement du correspndant précédent
        }
        this.curObj = this.dsioElemService.construct(bname, value);
      } else if (bname === 'PC1') {
        value = this.Id_prat =
          !value || !this.ar_prat[value] ? 0 : this.ar_prat[value];
      }
      this.curObj.setInfo(bname, value);
    } catch (error) {
      throw error;
    }
  }

  // php/dsio/import_shell.php line 2598 -> 2612
  async newBnq(bname: string, value: number, groupId: number) {
    try {
      if (!this.esc('O')) {
        return;
      }

      if (bname === 'PC1') {
        if (this.curObj != null) {
          await this.curObj.setBnq(this.Id_prat, groupId); // Enregistrement du correspndant précédent
        }
        this.Id_prat =
          !value || !this.ar_prat[value] ? 0 : +this.ar_prat[value];
        value = this.Id_prat;
        this.curObj = this.dsioElemService.construct(bname, value.toString());
      }
      this.curObj.setInfo(bname, `${value}`);
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
        value = String(Math.floor(Number(value)) + max_CON_NBR);
      }

      if (this.esc('B')) {
        await this.newPrat(bname, value, groupId, t_dsio_tasks);
      } else if (this.esc('C')) {
        await this.newPat(bname, value, groupId, t_dsio_tasks);
      } else if (this.esc('D') || this.esc('P')) {
        await this.newActe(bname, value, groupId, t_dsio_tasks);
      } else if (this.esc('E')) {
        await this.newPaiement(bname, value, groupId, t_dsio_tasks);
      } else if (this.esc('F')) {
        // Serge le 28/06/2013
        await this.newAmountDue(bname, value, groupId, t_dsio_tasks);
      } else if (this.esc('H')) {
        // Serge le 01/07/2013
        this.newFamily(bname, value, groupId); // Alimentation d'une nouvelle famille d'actes
      } else if (this.esc('I')) {
        // Serge le 04/07/2013
        await this.newFamilyTask(
          bname,
          value,
          t_dsio_tasks,
          LFT_ASSOCIATED_ACTS,
          groupId,
        ); // Alimentation d'un nouvel acte de la bibliothèque
      } else if (this.esc('J')) {
        await this.newPostit(bname, value, groupId, t_dsio_tasks); // Alimentation d'un nouveau postit
      } else if (this.esc('K')) {
        await this.newCI(bname, value, groupId, max_CON_NBR); // Alimentation d'une nouvelle famille de médicaments
      } else if (this.esc('L')) {
        await this.newMedFam(bname, value, groupId); // Alimentation d'un nouvel acte de la bibliothèque
      } else if (this.esc('M')) {
        await this.newMed(bname, value, groupId); // Alimentation d'un
      } else if (this.esc('N')) {
        await this.newCorrespondent(bname, value, groupId); // Alimentation d'un nouveau correspondant
      } else if (this.esc('O')) {
        await this.newBnq(bname, Number(value), groupId); // Alimentation d'un nouveau compte bancaire
      }
    } catch (error) {
      throw error;
    }
  }

  // php/dsio/import_shell.php line 2665 -> 2751
  // Lancement de la procédure d'importation du fichier DSIO
  async import(
    filename: string,
    payload: ImporterDsioDto,
    groupId: number,
    utf8: boolean,
    LFT_ASSOCIATED_ACTS: Record<string, string>,
    t_dsio_tasks:
      | Record<string, string>
      | Record<string, Record<string, number>>,
  ) {
    try {
      this.debut = new Date().getTime();
      const rl = readline.createInterface({
        input: this.handle,
        crlfDelay: Infinity,
      });

      let buffer = '';
      mainLoop: for await (buffer of rl) {
        if (fs.existsSync(path.join(__dirname, 'STOP'))) {
          process.exit();
        }
        if (fs.existsSync(path.join(__dirname, 'PAUSE'))) {
          while (fs.existsSync(path.join(__dirname, 'PAUSE'))) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          // reconnect(1)
        }
        this.getLine(buffer, utf8);

        if (buffer) {
          switch (buffer[0]) {
            case String.fromCharCode(27): // on est en train de changer de section
              if (
                !this.newSection(
                  buffer[1],
                  groupId,
                  payload.patient_number,
                  LFT_ASSOCIATED_ACTS,
                  t_dsio_tasks,
                )
              ) {
                fs.writeFileSync(
                  `${filename}.json`,
                  JSON.stringify({
                    status: 1,
                    action: 'Lecture fichier terminée',
                    prc: 99.99,
                  }),
                );
                break mainLoop;
              }
              break;
            case '#': // une balise d'un enregistrement à créer
              this.checkDiezLine(
                buffer,
                payload.patient_number ?? 0,
                groupId,
                t_dsio_tasks,
                LFT_ASSOCIATED_ACTS,
              );
              break;
            default:
              if (this.esc('A')) {
                // entête : on ne fait rien de spécial sinon détecter un import étendu de pomdadent
                if (buffer.substring(0, 9) === 'POMDADENT') {
                  // On doit accepter l'import étendu
                  this.importEtendu = true;
                }
                if (buffer.substring(0, 7) === 'MacDent') {
                  // On doit importer les actes spécifiques de MacDent
                  this.actesMacDent = true;
                }
                if (buffer.substring(0, 6) === 'Agatha') {
                  // On doit importer les actes spécifiques de MacDent
                  this.actesAgatha = true;
                }
                if (buffer.substring(0, 14) === 'Dental-On-Line') {
                  // On doit importer les actes spécifiques de Dental-On-Line
                  this.actesDentalOnLine = true;
                }
                if (buffer.substring(0, 9) === 'visiodent') {
                  // On doit supprimer les accents dans les prénoms
                  this.importEtendu = true;
                }
              }
              if (this.esc('G')) {
                // compta : on ne fait rien de spécial
              }
          }
        }
      }
      const rapport = {
        status: 1,
        action: this.section[this.ESC],
        prc: 99.99,
        noline: ++this.noline,
        line: buffer,
        time: Date.now() - this.debut,
      };
      fs.writeFileSync(this.json.path, JSON.stringify(rapport));
      this.json = null;

      /* Fin de fichier */
      if (this.curObj != null) {
        if (this.esc('M')) {
          /* Il faut enregistrer un dernier médicament */
          await this.curObj.insertMedicament(groupId);
        } else if (this.esc('N')) {
          /* Il faut enregistrer un dernier correspondant */
          await this.curObj.setCorrespondent(groupId);
        } else if (this.esc('O')) {
          /* Il faut enregistrer un dernier compte bancaire */
          await this.curObj.setBnq(this.Id_prat, groupId);
        }
      }
    } catch (error) {
      fs.writeFileSync(`${filename}.err`, JSON.stringify(this));
      fs.writeFileSync(`${filename}.exc`, JSON.stringify(error));
      // @TODO mail("support@ecoodentist.com", "Erreur d'import DSIO", "Erreur lors de l'import DSIO du fichier " . this.pathname);
      const returnJson = JSON.stringify({
        status: -3,
        error:
          "Une erreur est survenue durant l'importation de votre fichier DSIO. Nous allons intervenir dessus le plus rapidement possible puis revenir vers vous.",
      });
      fs.writeFileSync(`${filename}.json`, returnJson);
      throw error;
    }
  }
}
