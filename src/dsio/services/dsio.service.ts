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
  private currentQuery = '';
  private pathname = ''; // nom du fichier
  private filesize: number; // taille du fichier
  private handle: fs.ReadStream = null; // ressource du fichier DSIO
  private json: fs.WriteStream = null; //ressource du fichier json d'état d'avancement
  private debut = 0;
  private ESC = 'A'; // section courante
  private PC1 = ''; // Id dsio du praticien en cours de création
  private Id_prat = 0; // Id dans C&W
  private Id_prat_defaut = 0; // Id par défaut si aucun sélectionné alors qu'il en faut un (rdv)
  private Id_agn = 0; // Id de la ressource de l'agenda sans praticien
  private PTC = ''; // Id dsio du patient en cours de création
  private Id_pat = 0; // Id dans C&W
  private Id_Family_Tasks = 0; // Id d'une famille de tâche
  private ar_pat = {}; // tableau [Id_DSIO] => Id_C&W pour les patients
  private ar_prat: number[] | { [key: number]: string } = []; // tableau [Id_DSIO] => Id_C&W pour les praticiens
  private ar_agn = {}; // tableau [Id_DSIO] => id_ecoo pour les ressources d'agenda
  private ar_fam = {}; // tableau [Id_DSIO] => Id_C&W pour les familles
  private curObj = null; // DSIO_ELEM
  private patients = 0;
  private FRQ: duration.Duration;
  private HMD: string;
  private HMF: string;
  private HAD: string;
  private HAF: string;
  private AR_HRDV = [];
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
  private usedContraindications = []; // tableau des ID de contre-indications utilisées
  public noline = 0;
  private importEtendu = false;
  private actesMacDent = false;
  private actesAgatha = false;
  private actesDentalOnLine = false;
  private prenomsVisiodent = false;

  constructor(
    private dataSource: DataSource,
    private amountDueService: AmountDueService,
    private dsioElemService: DsioElemService,
  ) {}

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
  }

  // Initialise certaines données de l'objet pour la gestion des rdvs à créer
  async initHorraires(
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

  /**
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

  /**
   * Permet de savoir si nous sommes dans la bonne section.
   *
   * @param string $bname nom de la section à tester
   * @return boolean TRUE si la section à tester est la section courante, sinon FALSE
   */
  esc(bname: string) {
    return !this.ESC.localeCompare(bname);
  }

  /**
   * Récupère une nouvelle ligne du fichier DSIO et met à jour l'état
   * d'avancement.
   */
  async getLine(buffer: string, utf8: boolean) {
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
  }

  /**
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
    t_dsio_tasks: Record<string, string>,
  ) {
    const TRIGGER_CHECKS = 'FALSE';
    await this.dataSource.query(`SET @TRIGGER_CHECKS = ${TRIGGER_CHECKS}`);

    switch (this.ESC) {
      case 'A':
        break;
      case 'B':
        this.newPrat('PN1', '', groupId); // on est à la fin de B
        break;
      case 'C': // on est à la fin de C
        this.newPat('PTN', '', groupId);
        break;
      case 'D':
      case 'P':
        this.chPat('', groupId); // on est à la fin de D
        break;
      case 'E':
        this.chPat('', groupId); // on est à la fin de E
        // On va passer en section F (définition des montants dûs
        // avant d'entamer cette section, on initialise les montants
        // dus de l'ensemble des patients.
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
        await this.dataSource.query(`SET @TRIGGER_CHECKS = ${TRIGGER_CHECKS}`);
        break;
      case 'F':
        this.chPat('', groupId); // on est à la fin de F
        break;
      default: {
        if (this.importEtendu || this.actesMacDent) {
          switch (this.ESC) {
            case 'G':
              break; // on est à la fin de G ou fin de fichier
            case 'H': // on est à la fin de H
              if (this.curObj != null) {
                this.chFam();
              }
              break;
            case 'I': // on est à la fin de I
              if (this.curObj != null) {
                // Il faut enregistrer un dernier acte
                if (this.actesMacDent) {
                  this.curObj.setLibraryMact();
                } else {
                  this.curObj.setLibraryAct();
                }
                this.curObj = null;
              }
              // Il faut affecter les actes associés
              this.assocAct(groupId, LFT_ASSOCIATED_ACTS, t_dsio_tasks);
              break;
            case 'J': // on est à la fin de J
              if (this.curObj != null) {
                this.chPat('', groupId);
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
                    this.curObj.insertContraindication();
                  }
                  this.curObj = null;
                  break;
                case 'L': // on est à la fin de L
                  if (this.curObj != null) {
                    this.curObj.insertMedicamentFamily();
                  }
                  this.curObj = null;
                  break;
                case 'M': // on est à la fin de M
                  if (this.curObj != null) {
                    this.curObj.insertMedicament();
                  }
                  this.curObj = null;
                  break;
                case 'N': // on est à la fin de N
                  if (this.curObj != null) {
                    this.curObj.setCorrespondent();
                  }
                  this.curObj = null;
                  break;
                case 'O': // on est à la fin de O
                  if (this.curObj != null) {
                    this.curObj.setBnq(this.Id_prat);
                  }
                  this.curObj = null;
                  break;
                default: // On ne devrait jamais passer par là
                  if (this.curObj != null) {
                    this.chPat('', groupId);
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
  }

  // Permet de mettre à jour l'adresse postale du groupe et de chaque compte utilisateur
  async updateAdr(bname: string, value: string, groupId: number) {
    const ar_adr_ids: number[] = [];
    const queries = [
      ['T_USER_USR', 'USR_ID', 'organization_id'],
      ['T_GROUP_GRP', 'GRP_ID', 'GRP_ID'],
    ];
    // Pour chaque table on vérifie qu'il existe un enregistrement d'adresse
    // puis ou récupère l'identifiant de cet enregistrement
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
  }

  /**
   * Permet d'affecter une valeur pour une balise à l'enregistrement d'un praticien
   * en court de définition.
   *
   * @param string $bname nom de la balise
   * @param string value valeur de la balise
   */
  newPrat(bname: string, value: string, groupId: number) {
    if (!this.esc('B')) {
      return;
    }
    if (bname === 'PN1') {
      this.chPrat(''); // Nouveau praticien
      this.PC1 = '';
      this.Id_prat = 0;
      this.Id_agn = 0;
    } else if (bname === 'PC1') {
      this.PC1 = value;
      this.Id_prat = this.ar_prat[value] ? this.ar_prat[value] : 0;
    } else if (bname === 'PR1') {
      //this.Id_agn = isset(this.ar_agn[$value])?this.ar_agn[$value]:0;
    } else if (value && ['CA1', 'CA2', 'CAZ', 'CAV'].includes(bname)) {
      this.updateAdr(bname, value, groupId); // Affectation de l'adresse au groupe et praticiens
    }
  }

  /**
   * Dans une section, le fait de changer de praticien indique la fin de définition
   * d'un enregistrement : il faut donc appeler à créer l'enregistrement avant d'en
   * entammer un nouveau.
   *
   * @param string $IDSIO l'identifiant DSIO du nouveau praticien sélectionné
   */
  chPrat(IDSIO: string) {
    if (this.curObj) {
      if ((this.esc('D') || this.esc('P')) && (this.Id_prat || this.Id_agn)) {
        // enregistrement du nouvel acte/rdv
        if (
          !this.curObj.SDA ||
          this.curObj.SDA === '00000000' ||
          !dayjs(this.curObj.SDA, 'YYYYMMDD', true).isValid()
        ) {
          this.curObj.setInfo('SDA', '19700101');
        }
        this.curObj.setInfo('FRQ', this.FRQ);
        if (this.Id_agn) {
          const id_prat = !this.Id_prat ? this.Id_prat_defaut : this.Id_prat;
          this.curObj.creatRdv(this.Id_agn, id_prat, this.Id_pat);
        } else {
          this.curObj.creatActe(
            this.Id_prat,
            this.Id_pat,
            this.getNewHRDV(this.curObj.SDA),
            this.actesMacDent,
            this.actesAgatha,
            this.actesDentalOnLine,
          );
        }
        this.curObj = null;
      } else if (this.esc('E') && this.Id_prat && this.Id_pat) {
        // enregistrement du nouveau paiement
        this.curObj.creatPaiement(this.Id_prat, this.Id_pat);
        this.curObj = null;
      } else if (this.esc('F') && this.Id_prat && this.Id_pat) {
        // Serge le 28/06/2013)
        // mise à jour du montant dû du patient
        this.curObj.setInfo('FRQ', this.FRQ);
        this.curObj.setAmountDue(this.Id_prat, this.Id_pat);
        this.curObj = null;
      } else if (this.esc('J') && this.Id_pat) {
        let ar_ptt_user: number[] | { [key: number]: string } = [];
        if (this.Id_prat) {
          (ar_ptt_user as number[]).push(this.Id_prat);
        } else {
          ar_ptt_user = this.ar_prat;
        }
        this.curObj.setInfo('PTC', this.Id_pat);
        if (Array.isArray(ar_ptt_user)) {
          ar_ptt_user.forEach((Id_ptt_user) => {
            this.curObj.setInfo('PC1', Id_ptt_user);
            this.curObj.setPostit();
          });
        } else {
          Object.keys(ar_ptt_user).forEach((key) => {
            this.curObj.setInfo('PC1', ar_ptt_user[key]);
            this.curObj.setPostit();
          });
        }
      } else if (this.esc('N') && this.Id_prat) {
        // enregistrement d'un nouveau correspondant
        this.curObj.setInfo('PC1', this.Id_prat);
        this.curObj.setCorrespondent();
      } else if (this.esc('O') && this.Id_prat) {
        // enregistrement d'un nouveau correspondant
        this.curObj.setInfo('PC1', this.Id_prat);
        this.curObj.setBnq(this.Id_prat);
      }
    }
    this.Id_prat =
      !IDSIO || !this.ar_prat[IDSIO]
        ? this.Id_prat_defaut
        : this.ar_prat[IDSIO];
    this.Id_agn = 0;
  }

  /**
   * Permet d'affecter une valeur pour une balise à l'enregistrement d'un patient
   * en court de définition.
   * @param string $bname nom de la balise
   * @param string $value valeur de la balise
   */
  newPat(bname: string, value: string, groupId: number) {
    if (!this.esc('C')) {
      return;
    }
    if (bname === 'PTN') {
      // Nouveau patient
      if (this.PTC) {
        // On enregistre d'abord le précédent et on récupère l'ID de l'enregistrement
        this.ar_pat[this.PTC] = this.curObj.creatPatient(
          this.ar_fam,
          this.ar_prat,
          Object.keys(this.ar_pat).length + 1,
        ); // ID du patient créé.
        this.curObj = null; // Libération de la mémoire
      }

      // On prépare le suivant
      this.chPat('', groupId);
      if (value) {
        // il y a un prochain patient
        // On passe au patient suivant
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
  }

  /**
   * Permet d'affecter une valeur pour une balise à l'enregistrement de soin
   * en court de définition.
   *
   * @param string $bname nom de la balise
   * @param string $value valeur de la balise
   */
  newActe(bname: string, value: string, groupId: number) {
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
        this.Id_prat = !value || !this.ar_prat[value] ? 0 : this.ar_prat[value];
      } else if (bname === 'PR1') {
        this.Id_agn = this.ar_agn[value] ? this.ar_agn[value] : 0;
      }
    } else if (bname === 'PTC') {
      this.chPat(value, groupId);
    } else if (bname === 'PC1') {
      this.chPrat(value);
    } else {
      if (bname === 'PR1') {
        this.Id_agn = this.ar_agn[value] ? this.ar_agn[value] : 0;
      }
      this.curObj.setInfo(bname, value);
    }
  }

  /**
   * Permet d'affecter une valeur pour une balise à l'enregistrement d'un postit
   * en cours de définition.
   */
  newPostit(bname: string, value: string, groupId: number) {
    if (!this.esc('J')) {
      return;
    }
    if (this.curObj == null) {
      this.curObj = this.dsioElemService.construct(bname, value);
    }
    if (bname == 'PTC') {
      this.chPat(value, groupId);
      this.curObj = this.dsioElemService.construct(bname, value);
    } else if (bname == 'PC1') {
      this.chPrat(value);
      this.curObj = this.dsioElemService.construct(bname, value);
      this.curObj.setInfo('PTC', this.Id_pat);
    } else {
      this.curObj.setInfo(bname, value);
    }
  }

  /**
   * Permet d'affecter une valeur pour une balise à l'enregistrement de paiement
   * en court de définition.
   *
   * @param string $bname nom de la balise
   * @param string $value valeur de la balise
   */
  newPaiement(bname: string, value: string, groupId: number) {
    if (!this.esc('E')) {
      return;
    }
    if (this.curObj == null) {
      this.curObj = this.dsioElemService.construct(bname, value);
      if (bname === 'PTC') {
        this.Id_pat = !value || !this.ar_pat[value] ? 0 : this.ar_pat[value];
      } else if (bname === 'PC1') {
        this.Id_prat = !value || !this.ar_prat[value] ? 0 : this.ar_prat[value];
      }
    } else if (bname === 'PTC') {
      this.chPat(value, groupId);
    } else if (bname === 'PC1') {
      this.chPrat(value);
    } else {
      this.curObj.setInfo(bname, value);
    }
  }

  /**
   * Permet d'affecter une valeur pour une balise à l'enregistrement d'un montant dû
   * en court de définition.
   *
   * @param string $bname nom de la balise
   * @param string $value valeur de la balise
   */
  newAmountDue(bname: string, value: string, groupId: number) {
    if (!this.esc('F')) {
      return;
    }
    if (this.curObj == null) {
      this.curObj = this.dsioElemService.construct(bname, value);
      if (bname === 'PTC') {
        this.Id_pat = !value || !this.ar_pat[value] ? 0 : this.ar_pat[value];
      } else if (bname == 'PC1') {
        this.Id_prat = !value || !this.ar_prat[value] ? 0 : this.ar_prat[value];
      }
    } else if (bname === 'PTC') {
      this.chPat(value, groupId);
    } else if (bname === 'PC1') {
      this.chPrat(value);
    } else {
      this.curObj.setInfo(bname, value);
    }
  }

  /**
   * Permet d'affecter une valeur pour une balise à l'enregistrement d'une famille
   * en court de définition.
   *
   * @param string $bname nom de la balise
   * @param string $value valeur de la balise
   */
  newFamily(bname: string, value: string) {
    if (!this.esc('H')) {
      return;
    }
    if (this.curObj == null) {
      this.curObj = this.dsioElemService.construct(bname, value);
    } else if (bname == 'FLI') {
      this.chFam();
      this.curObj = this.dsioElemService.construct(bname, value);
    } else {
      this.curObj.setInfo(bname, value);
    }
  }

  /**
   * Comme pour le chnagement de praticien (cf fonction chPrat), le fait de changer
   * de patient indique la fin de définition d'un enregistrement : il faut donc
   * appeler à créer l'enregistrement avant d'en entammer un nouveau.
   *
   * @param string $IDSIO l'identifiant DSIO du nouveau praticien sélectionné
   */
  async chPat(IDSIO: string, groupId: number) {
    this.chPrat('');
    if (IDSIO && (!this.ar_pat[IDSIO] || this.ar_pat[IDSIO].length === 0)) {
      const conIds: { CON_ID: number }[] = await this.dataSource.query(
        `SELECT CON_ID from T_CONTACT_CON where organization_id = ${groupId} and CON_NBR = ${IDSIO} order by CON_ID asc limit 1`,
      );
      const CON_ID = conIds[0].CON_ID;
      if (CON_ID) {
        this.ar_pat[IDSIO] = CON_ID;
      }
    }
    this.Id_pat =
      !IDSIO || !this.ar_pat[IDSIO] || this.ar_pat[IDSIO].length === 0
        ? 0
        : this.ar_pat[IDSIO];
  }

  /**
   * Dans la section, le fait de changer de famille indique la fin d'une autre que
   * l'on doit enregistrer.
   */
  chFam() {
    if (this.curObj != null) {
      this.curObj.setLibraryFamily();
      this.curObj = null;
    }
  }

  /**
   * Permet d'affecter une valeur pour une balise à l'enregistrement d'une famille
   * en court de définition.
   *
   * @param string $bname nom de la balise
   * @param string $value valeur de la balise
   */
  newFamilyTask(bname: string, value: string) {
    if (!this.esc('I')) {
      return;
    }

    if (bname == 'FCF') {
      this.Id_Family_Tasks = Number(value);
    }
    if (this.curObj == null) {
      this.curObj = this.dsioElemService.construct(bname, value);
    } else if (bname === 'FCF') {
      this.chLibAct(bname, value);
    } else if (bname === 'ACA') {
      this.chLibAct(bname, value);
    } else {
      this.curObj.setInfo(bname, value);
    }
  }

  /**
   * Dans la section, le fait de changer d'acte indique la fin d'un autre que l'on
   * doit enregistrer.
   *
   * @param string $bname nom de la balise :
   */
  chLibAct(bname: string = null, value: string = null) {
    // Création de l'acte + affectation aux tâches des rdv concernés
    if (this.actesMacDent) {
      this.curObj.setLibraryMact();
    } else {
      this.curObj.setLibraryAct();
    }
    if (bname !== null) {
      this.curObj = this.dsioElemService.construct(bname, value);
      if (bname !== 'FCF') {
        this.curObj.setInfo('FCF', this.Id_Family_Tasks);
      }
    }
  }

  /**
   * Fonction de suppression de la bibliothèque d'actes (fournie de base) du groupe.
   * Le but est qu'elle soit remplacée par la bibliothèque extraite du DSIO
   */
  async deleteLibrary(groupId: number, max_CON_NBR: number) {
    if (max_CON_NBR > 0) {
      // dans le cadre d'une fusion, on laisse la biblio déjà en place
      return;
    }

    // const query = `INSERT INTO `T_LIBRARY_FAMILY_LFY` (`LFY_ID`,`GRP_ID`, `LFY_USABLE`)
    //     (SELECT `LFY_ID`,$groupId,0 FROM `T_LIBRARY_FAMILY_LFY` WHERE `GRP_ID` IN (0,$groupId) and (LFY_CCAM IS NULL OR LFY_CCAM = 0))
    // ON DUPLICATE KEY UPDATE `LFY_USABLE`=0`;
    const query =
      'INSERT INTO `T_LIBRARY_FAMILY_LFY` (`LFY_ID`,`GRP_ID`, `LFY_USABLE`, `LFY_POS`)' +
      `(SELECT \`LFY_ID\`,${groupId},0,\`LFY_POS\`+200 FROM \`T_LIBRARY_FAMILY_LFY\` WHERE \`GRP_ID\` IN (0,${groupId}) and (LFY_CCAM IS NULL OR LFY_CCAM = 0))
      ON DUPLICATE KEY UPDATE \`LFY_USABLE\`=0`;
    await this.dataSource.query(query);
  }

  async assocAct(
    groupId: number,
    LFT_ASSOCIATED_ACTS: Record<string, string>,
    t_dsio_tasks: Record<string, string>,
  ) {
    Object.entries(LFT_ASSOCIATED_ACTS).forEach(async ([LFT_ID, assoc]) => {
      const t_assocs: (string | boolean)[] = assoc.split(',');
      for (let i = 0; i < t_assocs.length; i++) {
        if (t_dsio_tasks[t_assocs[i] as string]) {
          t_assocs[i] = t_dsio_tasks[t_assocs[i] as string];
        } else if (t_assocs[i] === '') {
          t_assocs[i] = LFT_ID;
        } else {
          t_assocs[i] = false;
        }
      }

      assoc = t_assocs.filter(Boolean).join(',');
      if (assoc.localeCompare(LFT_ID)) {
        const query = `UPDATE T_LIBRARY_FAMILY_TASK_LFT
          SET LFT_ASSOCIATED_ACTS = '${assoc}'
          WHERE LFT_ID = ${LFT_ID}
          AND GRP_ID = ${groupId}`;
        await this.dataSource.query(query);
      }
    });
  }

  newCI(bname: string, value: string, groupId: number, max_CON_NBR: number) {
    // contres-indications
    if (!this.esc('K')) {
      return;
    }

    if (bname === 'ICI') {
      if (this.curObj != null) {
        this.curObj.insertContraindication(); // enregistrement de la contre-indication précédente
      } else {
        this.deleteContraindications(groupId, max_CON_NBR); // première contre-indication => on supprime celles par défaut dans e.coo
      }
      this.curObj = this.dsioElemService.construct(bname, value);
    } else {
      this.curObj.setInfo(bname, value);
    }
  }

  async deleteContraindications(groupId: number, max_CON_NBR: number) {
    if (max_CON_NBR > 0) {
      // en cas de fusion on ne supprime pas la bibliothèque de l'autre utilisateur
      return;
    }

    await this.dataSource.query(
      `
      UPDATE T_MEDICAL_LIBRARY_CONTRAINDICATION_MLC
      SET deleted_at = CURRENT_TIMESTAMP()
      WHERE organization_id = ?
    `,
      [groupId],
    );
  }

  newMedFam(bname: string, value: string, groupId: number) {
    if (!this.esc('L')) {
      return;
    }

    if (bname === 'DLI') {
      if (this.curObj != null) {
        this.curObj.insertMedicamentFamily(); // enregistrement de la contre-indication précédente
      } else {
        this.deleteMedicamentFamilies(groupId); // première famille on supprime celles par défaut dans e.coo
      }
      this.curObj = this.dsioElemService.construct(bname, value);
    } else {
      this.curObj.setInfo(bname, value);
    }
  }

  async deleteMedicamentFamilies(groupId: number) {
    await this.dataSource.query(
      `
      UPDATE T_MEDICAL_PRESCRIPTION_TYPE_MDT
      SET deleted_at = CURRENT_TIMESTAMP()
      WHERE organization_id = ?
    `,
      [groupId],
    );
  }

  newMed(bname: string, value: string) {
    if (!this.esc('M')) {
      return;
    }

    if (['DCD', 'MCM'].includes(bname)) {
      if (this.curObj != null) {
        this.curObj.insertMedicament(); // enregistrement de la contre-indication précédente
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
  }

  newCorrespondent(bname: string, value: string) {
    if (!this.esc('N')) {
      return;
    }

    if (bname === 'RN1') {
      if (this.curObj != null) {
        this.curObj.setCorrespondent(); // Enregistrement du correspndant précédent
      }
      this.curObj = this.dsioElemService.construct(bname, value);
    } else if (bname === 'PC1') {
      value = this.Id_prat =
        !value || !this.ar_prat[value] ? 0 : this.ar_prat[value];
    }
    this.curObj.setInfo(bname, value);
  }

  newBnq(bname: string, value: number) {
    if (!this.esc('O')) {
      return;
    }

    if (bname === 'PC1') {
      if (this.curObj != null) {
        this.curObj.setBnq(this.Id_prat); // Enregistrement du correspndant précédent
      }
      this.Id_prat = !value || !this.ar_prat[value] ? 0 : +this.ar_prat[value];
      value = this.Id_prat;
      this.curObj = this.dsioElemService.construct(bname, value.toString());
    }
    this.curObj.setInfo(bname, value);
  }

  /**
   * récupération de la valeur d'un élément en vue d'alimenter
   * le prochain enregistrement à créer
   *
   * @param string $buffer ligne contenant la balise et sa valeur
   */
  checkDiezLine(buffer: string, max_CON_NBR: number, groupId: number) {
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
      this.newPrat(bname, value, groupId);
    } else if (this.esc('C')) {
      this.newPat(bname, value, groupId);
    } else if (this.esc('D') || this.esc('P')) {
      this.newActe(bname, value, groupId);
    } else if (this.esc('E')) {
      this.newPaiement(bname, value, groupId);
    } else if (this.esc('F')) {
      // Serge le 28/06/2013
      this.newAmountDue(bname, value, groupId);
    } else if (this.esc('H')) {
      // Serge le 01/07/2013
      this.newFamily(bname, value); // Alimentation d'une nouvelle famille d'actes
    } else if (this.esc('I')) {
      // Serge le 04/07/2013
      this.newFamilyTask(bname, value); // Alimentation d'un nouvel acte de la bibliothèque
    } else if (this.esc('J')) {
      this.newPostit(bname, value, groupId); // Alimentation d'un nouveau postit
    } else if (this.esc('K')) {
      this.newCI(bname, value, groupId, max_CON_NBR); // Alimentation d'une nouvelle famille de médicaments
    } else if (this.esc('L')) {
      this.newMedFam(bname, value, groupId); // Alimentation d'un nouvel acte de la bibliothèque
    } else if (this.esc('M')) {
      this.newMed(bname, value); // Alimentation d'un
    } else if (this.esc('N')) {
      this.newCorrespondent(bname, value); // Alimentation d'un nouveau correspondant
    } else if (this.esc('O')) {
      this.newBnq(bname, Number(value)); // Alimentation d'un nouveau compte bancaire
    }
  }

  // Lancement de la procédure d'importation du fichier DSIO
  async import(
    filename: string,
    payload: ImporterDsioDto,
    groupId: number,
    utf8: boolean,
    LFT_ASSOCIATED_ACTS: Record<string, string>,
    t_dsio_tasks: Record<string, string>,
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
              this.checkDiezLine(buffer, payload.patient_number ?? 0, groupId);
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
          this.curObj.insertMedicament();
        } else if (this.esc('N')) {
          /* Il faut enregistrer un dernier correspondant */
          this.curObj.setCorrespondent();
        } else if (this.esc('O')) {
          /* Il faut enregistrer un dernier compte bancaire */
          this.curObj.setBnq(this.Id_prat);
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
      // die();
      throw error;
    }
  }
}
