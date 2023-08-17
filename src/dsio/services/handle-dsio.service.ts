import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as duration from 'dayjs/plugin/duration';
import { DataSource } from 'typeorm';
import { ImporterDsioDto } from '../dto/importer-dsio.dto';
import * as fs from 'fs';
import { AmountDueService } from 'src/command/services/amount.due.services';
import { PreDataDsioService } from './pre-data-dsio.service';
import { AmountDsioService } from './amount-dsio.service';
import { LibraryDsioElemService } from './library-dsio.elem.service';
import { PaymentDsioElemService } from './payment-dsio.elem.service';
import { MedicaDsioElemService } from './medica-dsio.elem.service';

@Injectable()
export class HandleDsioService {
  currentQuery: string;
  pathname = ''; // nom du fichier
  filesize: number; // taille du fichier
  handle: fs.ReadStream = null; // ressource du fichier DSIO
  json: fs.WriteStream = null; //ressource du fichier json d'état d'avancement
  debut = 0;
  ESC = 'A'; // section courante
  PC1: string;
  Id_prat = 0; // Id dans C&W
  Id_prat_defaut = 0; // Id par défaut si aucun sélectionné alors qu'il en faut un (rdv)
  Id_agn = 0; // Id de la ressource de l'agenda sans praticien
  PTC = ''; // Id dsio du patient en cours de création
  Id_pat = 0; // Id dans C&W
  Id_Family_Tasks = 0; // Id d'une famille de tâche
  ar_pat: Record<string, number> = {}; // tableau [Id_DSIO] => Id_C&W pour les patients
  ar_prat: { [key: number]: string } = {}; // tableau [Id_DSIO] => Id_C&W pour les praticiens
  ar_agn: Record<number, string> = {}; // tableau [Id_DSIO] => id_ecoo pour les ressources d'agenda
  ar_fam: Record<string, number> = {}; // tableau [Id_DSIO] => Id_C&W pour les familles
  curObj: boolean = null; // DSIO_ELEM
  FRQ: duration.Duration;
  HMD: string;
  HMF: string;
  HAD: string;
  HAF: string;
  AR_HRDV: Record<string, Record<string, string>> = {};
  section = {
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
  importEtendu = false;
  actesMacDent = false;
  actesAgatha = false;
  actesDentalOnLine = false;

  constructor(
    private dataSource: DataSource,
    private amountDueService: AmountDueService,
    private preDataDsioService: PreDataDsioService,
    private amountDsioService: AmountDsioService,
    private libraryDsioElemService: LibraryDsioElemService,
    private paymentDsioElemService: PaymentDsioElemService,
    private medicaDsioElemService: MedicaDsioElemService,
  ) {}

  init() {
    this.currentQuery = null;
    this.pathname = '';
    this.filesize = null;
    this.handle = null;
    this.json = null;
    this.debut = 0;
    this.ESC = 'A';
    this.PC1 = null;
    this.Id_prat = 0;
    this.Id_prat_defaut = 0;
    this.Id_agn = 0;
    this.PTC = '';
    this.Id_pat = 0;
    this.Id_Family_Tasks = 0;
    this.ar_pat = {};
    this.ar_prat = {};
    this.ar_agn = {};
    this.ar_fam = {};
    this.curObj = null;
    this.FRQ = null;
    this.HMD = null;
    this.HMF = null;
    this.HAD = null;
    this.HAF = null;
    this.AR_HRDV = {};
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
      this.init();
      this.pathname = pathname;
      if (fs.existsSync(pathname)) {
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
  getLine(buffer: string, utf8: boolean, linePos: number) {
    try {
      /* On est pas encore à la fin du fichier */
      // @TODO set_time_limit(30);
      const rapport = {
        status: 1,
        action: this.section[this.ESC],
        prc: ((100 * linePos) / this.filesize).toFixed(2),
        noline: ++this.noline,
        line: buffer,
        time: Date.now() * 1000 - this.debut,
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
    linePos: number,
    patient_number: number,
    LFT_ASSOCIATED_ACTS: Record<string, string>,
    t_dsio_tasks:
      | Record<string, string>
      | Record<string, Record<string, number>>,
    t_COF: Record<string, number[]>,
    t_gender_gen: Record<string, number>,
    t_phone_type_pty: Record<string, number>,
    ngapKeys: Record<string, number>,
  ) {
    try {
      const TRIGGER_CHECKS = 'FALSE';
      await this.dataSource.query(`SET @TRIGGER_CHECKS = ${TRIGGER_CHECKS}`);

      switch (this.ESC) {
        case 'A':
          break;
        case 'B':
          await this.preDataDsioService.newPrat(
            'PN1',
            '',
            groupId,
            t_dsio_tasks,
            t_gender_gen,
            ngapKeys,
          ); // on est à la fin de B
          break;
        case 'C': // on est à la fin de C
          await this.preDataDsioService.newPat(
            'PTN',
            '',
            groupId,
            t_dsio_tasks,
            t_COF,
            t_gender_gen,
            t_phone_type_pty,
            ngapKeys,
          );
          break;
        case 'D':
        case 'P':
          await this.preDataDsioService.chPat(
            '',
            groupId,
            t_dsio_tasks,
            t_gender_gen,
            ngapKeys,
          ); // on est à la fin de D
          break;
        case 'E':
          await this.preDataDsioService.chPat(
            '',
            groupId,
            t_dsio_tasks,
            t_gender_gen,
            ngapKeys,
          ); // on est à la fin de E
          const rapport = {
            status: 1,
            action: 'Calcul des montants dus',
            prc: ((100 * linePos) / this.filesize).toFixed(2),
            noline: this.noline,
            time: Date.now() * 1000 - this.debut,
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
          await this.preDataDsioService.chPat(
            '',
            groupId,
            t_dsio_tasks,
            t_gender_gen,
            ngapKeys,
          ); // on est à la fin de F
          break;
        default: {
          if (this.importEtendu || this.actesMacDent) {
            switch (this.ESC) {
              case 'G':
                break; // on est à la fin de G ou fin de fichier
              case 'H': // on est à la fin de H
                if (this.curObj != null) {
                  await this.amountDsioService.chFam(groupId);
                }
                break;
              case 'I': // on est à la fin de I
                if (this.curObj != null) {
                  // Il faut enregistrer un dernier acte
                  if (this.actesMacDent) {
                    await this.libraryDsioElemService.setLibraryMact(
                      t_dsio_tasks,
                      groupId,
                    );
                  } else {
                    await this.paymentDsioElemService.setLibraryAct(
                      t_dsio_tasks,
                      LFT_ASSOCIATED_ACTS,
                      groupId,
                    );
                  }
                  this.curObj = null;
                }
                // Il faut affecter les actes associés
                await this.amountDsioService.assocAct(
                  groupId,
                  LFT_ASSOCIATED_ACTS,
                  t_dsio_tasks,
                );
                break;
              case 'J': // on est à la fin de J
                if (this.curObj != null) {
                  await this.preDataDsioService.chPat(
                    '',
                    groupId,
                    t_dsio_tasks,
                    t_gender_gen,
                    ngapKeys,
                  );
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
                      await this.libraryDsioElemService.insertContraindication(
                        groupId,
                      );
                    }
                    this.curObj = null;
                    break;
                  case 'L': // on est à la fin de L
                    if (this.curObj != null) {
                      await this.medicaDsioElemService.insertMedicamentFamily(
                        groupId,
                      );
                    }
                    this.curObj = null;
                    break;
                  case 'M': // on est à la fin de M
                    if (this.curObj != null) {
                      await this.medicaDsioElemService.insertMedicament(
                        groupId,
                      );
                    }
                    this.curObj = null;
                    break;
                  case 'N': // on est à la fin de N
                    if (this.curObj != null) {
                      await this.medicaDsioElemService.setCorrespondent(
                        groupId,
                        t_gender_gen,
                      );
                    }
                    this.curObj = null;
                    break;
                  case 'O': // on est à la fin de O
                    if (this.curObj != null) {
                      await this.medicaDsioElemService.setBnq(
                        this.Id_prat,
                        groupId,
                      );
                    }
                    this.curObj = null;
                    break;
                  default: // On ne devrait jamais passer par là
                    if (this.curObj != null) {
                      await this.preDataDsioService.chPat(
                        '',
                        groupId,
                        t_dsio_tasks,
                        t_gender_gen,
                        ngapKeys,
                      );
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
        await this.amountDsioService.deleteLibrary(groupId, patient_number);
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
      for (const query of queries) {
        const table = query[0];
        const field = query[1];
        const where = query[2];

        const res = await this.dataSource.query(
          `select ${field}, ADR_ID from ${table} where ${where}=${groupId}`,
        );
        if (res && res.length > 0) {
          for (const row of res) {
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
          }
        }
      }

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
}
