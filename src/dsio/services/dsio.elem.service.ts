import { Injectable } from '@nestjs/common';
import { DsioConfigService } from './dsio.config.service';
import { DataSource, Repository } from 'typeorm';
import dayjs from 'dayjs';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
import * as utc from 'dayjs/plugin/utc';
import * as timezonePlugin from 'dayjs/plugin/timezone';
import * as duration from 'dayjs/plugin/duration';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { CcamEntity } from 'src/entities/ccam.entity';
import { LibraryActQuantityEntity } from 'src/entities/library-act-quantity.entity';
import { ContactService } from 'src/contact/services/contact.service';
import { LibraryBankEntity } from 'src/entities/library-bank.entity';

/**
 * php/dsio/import_shell.php line 211 -> 1695
 */
@Injectable()
export class DsioElemService {
  private currentQuery = '';
  private ATE: string[] = []; // tableau des numéro s de téléphne supplémentaire dans MacDent
  private ACA: string;
  private T_CONTACT_CONTRAINDICATION_COC: Record<string, number[]>;
  private t_COF: Record<string, number[]>;
  private FRQ: duration.Duration;
  private t_library_family_lfy: Record<string, number>;
  private t_library_family_task_lft: Record<string, string[]>;
  private t_dsio_tasks_quantity: Record<string, Record<string, number[]>>;
  private t_dsio_dental_tasks_quantity: Record<string, boolean>;
  private LFT_POS = 0;
  private LFY_ID = 0;
  private DLK: Record<string, string>;
  private t_QD: Record<string, string> = {
    ED: 'D',
    EP: 'E',
    DE: 'E',
    DP: 'F',
    AG: 'G',
    AN: 'N',
    DA: 'A',
    DM: 'M',
    'DA+ED': 'B',
    'DM+EP': 'C',
  };
  private T_POSTIT_PTT: Record<string, string>;
  private medicamentFamilies: Record<string, string>;
  SDA: string;
  DCD: string;
  private AA1: string;
  private AA2: string;
  private ACP: string;
  private AVI: string;
  private PTC: string;
  private PNO: string;
  private PTN: string;
  private PTP: string;
  private PTG: string;
  private PTD: string;
  private PTF: string;
  private PTB: string;
  private AEM: string;
  private AMA: string;
  private PAL: string;
  private PAA: string;
  private PAC: string;
  private PTM: string;
  private PTI: string;
  private ATD: string;
  private ATM: string;
  private ATT: string;
  private PCM: string;
  private SDE: string;
  private SDU: string;
  private STA: string;
  private SCA: string;
  private SCC: string;
  private SSA: string;
  private SLC: string;
  private SLI: string;
  private SCO: string;
  private SDT: string;
  private SRV: string;
  private SRE: string;
  private SNL: string;
  private SCL: number;
  private STR: string;
  private SNC: string;
  private SCM: string;
  private SSS: string;
  private $DP: string;
  private $DE: string;
  private $SS: string;
  private $LI: string;
  private $MP: string;
  private $BO: string;
  private $BD: string;
  private $BB: string;
  private $TD: string;
  private FCF: string;
  private FLI: string;
  private FCO: number;
  private ALI: string;
  private AAB: string;
  private AAS: string;
  private ADU: string;
  private ASA: string;
  private ASE: string;
  private ACL: number;
  private ACV: string;
  private ARV: string;
  private AZV: string;
  private AZI: string;
  private ADI: string;
  private ACO: string;
  private ACE: string;
  private AQD: string;
  private APA: string;
  private NCN: string;
  private PC1: string;
  private NCO: string;
  private NCL: string;
  private NPA: string;
  private NGA: string;
  private NHA: string;
  private NDR: string;
  private NBA: string;
  private DLI: string;
  private MLI: string;
  private MAB: string;
  private MTX: string;
  private ATA: string;
  private AQT: string;
  private ALC: string;
  private ILI: string;
  private ICI: string;
  private RN1: string;
  private RF1: string;
  private RT1: string;
  private RM1: string;
  private RN2: string;
  private RA1: string;
  private RA2: string;
  private RA3: string;
  private RT2: string;
  private RT3: string;
  private BAB: string;
  private BAD: string;
  private BCP: string;
  private BVI: string;
  private BNO: string;
  private BCO: string;
  private BGU: string;
  private BNU: string;
  private BRI: string;
  private BNB: string;

  constructor(
    private dataSource: DataSource,
    private configService: DsioConfigService,
    private contactService: ContactService,
    @InjectRepository(ContactEntity)
    private contactRepo: Repository<ContactEntity>,
    @InjectRepository(OrganizationEntity)
    private organizationRepo: Repository<OrganizationEntity>,
    @InjectRepository(CcamEntity)
    private ccamRepo: Repository<CcamEntity>,
    @InjectRepository(LibraryActQuantityEntity)
    private libraryActQuantityRepo: Repository<LibraryActQuantityEntity>,
    @InjectRepository(LibraryBankEntity)
    private libraryBankRepo: Repository<LibraryBankEntity>,
  ) {}

  /**
   * php/dsio/import_shell.php line 217 -> 249
   */
  construct(bname: string, value: string): DsioElemService {
    this.setInfo(bname, value);
    return this;
  }

  /**
   * php/dsio/import_shell.php line 259 -> 282
   * Affectation d'une nouvelle propriété à l'élément
   *
   * @param string $bname nom de la propriété
   * @param string $value valeur de la propriété
   *
   */
  setInfo(bname: string, value: string | duration.Duration) {
    if (value || this.ACA) {
      if (typeof value === 'string') {
        const pos = value.indexOf('\r');
        if (pos !== -1) {
          value = value.substr(0, pos);
        }
      }
      this[bname] = value;
    } else if (bname === 'FCF') {
      this[bname] = '0';
    } else if (bname === 'SNC') {
      this[bname] = '0';
    } else if (bname === 'ATE') {
      this.ATE.push(value as string);
    }
  }

  /**
   * php/dsio/import_shell.php line 284 -> 290
   */
  getDateFrom(dsioDate: string) {
    if (
      isNaN(Number(dsioDate)) ||
      dsioDate.length !== 8 ||
      dsioDate === '00000000' ||
      !dayjs(dsioDate).isValid()
    ) {
      return '19700101';
    }
    return dayjs(dsioDate).format('YYYY-MM-DD');
  }

  /**
   * php/dsio/import_shell.php line 292 -> 297
   */
  async query(query: string) {
    this.currentQuery = query;
    return this.dataSource.query(query);
  }

  /**
   * php/dsio/import_shell.php line 307 -> 571
   * Crée une fiche contact avec les propriétés récupérées depuis
   * le fichier DSIO
   * @return number l'identifiant de la nouvelle fiche contact
   */
  async creatPatient(ar_fam, ar_prat, PTC_SUBST = 0, groupId: number) {
    try {
      let ID_ADR = null;
      /* Enregistrement de l'adresse */
      const AA1 = this.hasOwnProperty('AA1') && this.AA1;
      const AA2 = this.hasOwnProperty('AA2') && this.AA2;
      const ACP = this.hasOwnProperty('ACP') && this.ACP;
      const AVI = this.hasOwnProperty('AVI') && this.AVI;

      if (AA1 || AA2 || ACP || AVI) {
        let street = null;
        let zipCode = null;
        let city = null;
        if (AA1) {
          if (AA2) {
            street = `${this.AA1}\n${this.AA2}`;
          } else {
            street = this.AA1;
          }
        } else if (AA2) {
          street = this.AA2;
        }

        if (ACP) {
          zipCode = this.ACP.substr(0, 6);
        }
        if (AVI) {
          city = this.AVI;
        }

        const insertStm = await this.dataSource.query(
          `
          INSERT INTO T_ADDRESS_ADR (ADR_STREET, ADR_ZIP_CODE, ADR_CITY, ADR_COUNTRY, ADR_COUNTRY_ABBR)
          VALUES (SUBSTRING(?, 1, 255), ?, ?, 'FRANCE', 'FR')
        `,
          [street, zipCode, city],
        );

        ID_ADR = insertStm.insertId;
      } /* Fin d'enregistrement de l'adresse */

      /* Importation des notes du patient */
      let CON_MSG = '';

      /* Importation de la référence patient du fichier DSIO */
      let PTC: string | number = 'NULL';
      if (
        this.hasOwnProperty(this.PTC) &&
        this.PTC &&
        !isNaN(Number(this.PTC))
      ) {
        /* La référence est un entier, on l'affecte directement au numéro de dossier patient */
        PTC = this.PTC;
      } else if (this.hasOwnProperty(this.PTC) && this.PTC) {
        // référence de dossier au lieu d'un numéro...
        // On place la référence du dossier dans les commentaires de la fiche patient
        CON_MSG = `Référence DSIO : "${this.PTC}"\n"${CON_MSG}`;
        // On crée un numéro de dossier
        PTC = PTC_SUBST;
      }

      // Importation des notes du patient
      if (this.hasOwnProperty(this.PNO) && this.PNO && this.PNO.length > 0) {
        CON_MSG += '\n' + this.PNO.replace(/\t/g, '\n');
      }

      if (!this.PTN) {
        this.PTN = 'Patient DSIO sans nom n°' + PTC;
      } else {
        this.PTN = this.PTN.toUpperCase();
      }

      if (!this.PTP) {
        this.PTP = 'Patient DSIO sans prenom n°' + PTC;
      } else {
        this.PTP = this.PTP.toLowerCase().replace(
          /\b[a-z]/g,
          function (letter) {
            return letter.toUpperCase();
          },
        );
      }

      let PTG = 1;
      if (this.PTG && this.configService.tGenderGen[this.PTG]) {
        PTG = this.configService.tGenderGen[this.PTG];
      }

      let PTD = null;
      if (this.PTD && this.PTD.length === 8 && this.PTD !== '00000000') {
        PTD = dayjs(this.PTD).isValid()
          ? dayjs(this.PTD).format('YYYYMMDD')
          : null;
      }

      if (this.PTF) {
        this.PTB = this.PTF;
      }

      let AEM = null; // adresse email
      if (this.AEM && this.AEM.length > 0) {
        AEM = this.AEM;
      } else if (this.AMA && this.AMA.length > 0) {
        AEM = this.AMA;
      }

      let PAL = null;
      let PAC = null;
      let PAA = null;
      if (this.PAL && this.PAL.length > 0) {
        PAL = this.PAL;
        if (this.PAC && this.PAC.length > 0) {
          PAC = this.PAC;
        }
        if (this.PAA && this.PAA.length > 0) {
          PAA = this.PAA === 'O' ? 1 : 0;
        }
      }

      let PTM = null;
      if (this.PTM) {
        PTM = this.PTM;
      }

      let patient = new ContactEntity();
      patient.group = await this.organizationRepo.findOne({
        where: { id: groupId },
      });
      patient.nbr = +PTC;
      patient.lastname = this.PTN;
      patient.firstname = this.PTP;

      patient = await this.contactRepo.save(patient);

      const CON_ID = patient.id;

      await this.dataSource.query(
        `
        UPDATE T_CONTACT_CON
        SET ADR_ID = ?,
            GEN_ID = ?,
            CON_BIRTHDAY = ?,
            CON_MAIL = ?,
            CON_NOTIFICATION_MSG = ?,
            CON_COLOR = ?,
            CON_NOTIFICATION_ENABLE = ?,
            CON_PROFESSION = ?,
            CON_MSG = ?
        WHERE CON_ID = ?
      `,
        [
          ID_ADR ? ID_ADR : null,
          PTG ? PTG : null,
          PTD ? dayjs(PTD).format('YYYY-MM-DD') : null,
          AEM ? AEM.substr(0, 50) : null,
          PAL ? PAL : null,
          PAC ? PAC : -3840,
          PAA ? PAA : 0,
          PTM ? PTM : null,
          CON_MSG ? CON_MSG : null,
          CON_ID,
        ],
      );

      /* gestion des familles de patients */
      if (this.PTB && this.PTB.length > 0) {
        if (!this.t_COF[this.PTB]) {
          this.t_COF[this.PTB] = [CON_ID];
        } else {
          this.t_COF[this.PTB].push(CON_ID);
        }
      }

      if (this.PTI) {
        const DCO_INSEE = this.PTI.substr(0, 13);
        const DCO_INSEE_KEY = this.PTI.substr(13, 2);
        if (
          DCO_INSEE &&
          DCO_INSEE.length > 0 &&
          !isNaN(Number(DCO_INSEE_KEY))
        ) {
          await this.dataSource.query(
            `
            UPDATE /* LOW_PRIORITY */ T_CONTACT_CON
            SET CON_INSEE = ?,
                CON_INSEE_KEY = ?
            WHERE CON_ID = ?`,
            [DCO_INSEE, DCO_INSEE_KEY, CON_ID],
          );
        }
        if (!PTG) {
          if (this.PTI.substr(0, 1) === '1') {
            PTG = this.configService.tGenderGen['M'];
          } else if (this.PTI.substr(0, 1) === '2') {
            PTG = this.configService.tGenderGen['Mme'];
          } else {
            PTG = this.configService.tGenderGen['M & Mme'];
          }
        }
      } else if (!PTG) {
        PTG = this.configService.tGenderGen['M & Mme'];
      }

      if (this.ATD && this.ATD.length > 0) {
        let ATD = this.ATD.replace(/[^0-9\(\)\+]/g, '');
        if (ATD.length === 20) {
          // Adaptation MacDent
          if (!(this.hasOwnProperty('ATM') && this.ATM)) {
            this.ATM = ATD.substr(10);
          }
          ATD = ATD.substr(0, 10);
        }
        ATD = ATD.substr(0, 15);
        const phoneStm = await this.dataSource.query(
          `INSERT /* LOW_PRIORITY */ INTO T_PHONE_PHO (PTY_ID, PHO_NBR) VALUES (?, ?)`,
          [this.configService.tPhoneTypePTY['home'], ATD],
        );
        const PHO_ID = phoneStm.insertId;
        await this.dataSource.query(
          `INSERT /* LOW_PRIORITY */ INTO T_CONTACT_PHONE_COP (CON_ID, PHO_ID) VALUES (?, ?)`,
          [CON_ID, PHO_ID],
        );
      }

      if (this.ATT && !isNaN(Number(this.ATT))) {
        let ATT = this.ATT.replace(/[^0-9\(\)\+]/g, '');
        if (ATT.length === 20) {
          // Adaptation MacDent
          if (!(this.ATM && !isNaN(Number(this.ATM)))) {
            ATT = ATT.substr(10);
          }
          ATT = ATT.substr(0, 10);
        }
        ATT = ATT.substr(0, 15);
        const phoneStm = await this.dataSource.query(
          `INSERT /* LOW_PRIORITY */ INTO T_PHONE_PHO (PTY_ID, PHO_NBR) VALUES (?, ?)`,
          [this.configService.tPhoneTypePTY['office'], ATT],
        );
        const PHO_ID = phoneStm.insertId;
        await this.dataSource.query(
          `INSERT /* LOW_PRIORITY */ INTO T_CONTACT_PHONE_COP (CON_ID, PHO_ID) VALUES (?, ?)`,
          [CON_ID, PHO_ID],
        );
      }

      if (this.ATM && !isNaN(Number(this.ATM))) {
        const ATM = this.ATM.replace(/[^0-9\(\)\+]/g, '').substr(0, 15);
        for (const PTY_TYPE of ['mobile', 'sms']) {
          const phoneStm = await this.dataSource.query(
            `INSERT /* LOW_PRIORITY */ INTO T_PHONE_PHO (PTY_ID, PHO_NBR) VALUES (?, ?)`,
            [this.configService.tPhoneTypePTY[PTY_TYPE], ATM],
          );
          const PHO_ID = phoneStm.insertId;
          await this.dataSource.query(
            `INSERT /* LOW_PRIORITY */ INTO T_CONTACT_PHONE_COP (CON_ID, PHO_ID) VALUES (?, ?)`,
            [CON_ID, PHO_ID],
          );
        }
      }

      if (Array.isArray(this.ATE)) {
        for (let ATE of this.ATE) {
          // Téléphones supplémentaires MacDent
          ATE = ATE.replace(/[^0-9\(\)\+]/g, '').substr(0, 15);
          const type = [6, 7].includes(Number(ATE[1]))
            ? this.configService.tPhoneTypePTY['sms']
            : this.configService.tPhoneTypePTY['home'];
          const phoneStm = await this.dataSource.query(
            `INSERT /* LOW_PRIORITY */ INTO T_PHONE_PHO (PTY_ID,PHO_NBR) VALUES (?, ?)`,
            [type, ATE],
          );
          const PHO_ID = phoneStm.insertId;
          await this.dataSource.query(
            `INSERT /* LOW_PRIORITY */ INTO T_CONTACT_PHONE_COP (CON_ID,PHO_ID) VALUES (?, ?)`,
            [CON_ID, PHO_ID],
          );
        }
      }

      if (this.PCM && this.PCM.length > 0) {
        const ar_CONTR: string[] = this.PCM.split('\t');
        for (const code of ar_CONTR) {
          if (
            !this.T_CONTACT_CONTRAINDICATION_COC[code] ||
            this.T_CONTACT_CONTRAINDICATION_COC[code].length === 0
          ) {
            this.T_CONTACT_CONTRAINDICATION_COC[code] = [CON_ID];
          } else {
            this.T_CONTACT_CONTRAINDICATION_COC[code].push(CON_ID);
          }
        }
      }

      return CON_ID;
    } catch (error) {
      throw error;
    }
  }

  /**
   * php/dsio/import_shell.php line 584 -> 912
   * Crée un rendez-vous avec un acte dentaire dont les propriétés
   * ont été récupérées dans le fichier DSIO.
   * Ce rendez-vous n'est créé que si la fiche contact correspondante existe
   */
  async creatActe(
    id_prat: number,
    id_pat: number,
    date: string | boolean,
    macDent = false,
    agatha = false,
    dentalOnLine = false,
    groupId: number,
    t_dsio_tasks:
      | Record<string, string>
      | Record<string, Record<string, number>>,
  ) {
    try {
      if (id_prat) {
        const timezone = 'Europe/Paris';
        const ngapKeys: Record<string, number> =
          await this.configService.getNgapkeysByGroupId(groupId);
        const ccamStm = 'select id from ccam where code = ?';

        let libraryActId = null;
        let libraryActQuantityId = null;

        if (!id_pat) {
          id_pat = null;
        }

        let HIDE = 1;
        dayjs.extend(customParseFormat);
        dayjs.extend(utc);
        dayjs.extend(timezonePlugin);
        if (
          this.SDE &&
          this.SDE.length > 0 &&
          dayjs(this.SDE, 'HH:mm:ss', true).tz(timezone).isValid()
        ) {
          date = dayjs(`${this.SDA}${this.SDE}`)
            .tz(timezone)
            .format('YYYYMMDDHH:mm:ss');
        }

        let FRQ = this.FRQ;
        if (
          this.SDU &&
          this.SDU.length > 0 &&
          this.SDU !== '00:00:00' &&
          dayjs(this.SDU, 'HH:mm:ss').isValid()
        ) {
          const ar_SDU = this.SDU.split(':');
          dayjs.extend(duration);
          FRQ = dayjs.duration(`PT${ar_SDU[0]}H${ar_SDU[1]}M`);
        }

        // Type d'acte : "I"nitial, "A"ctuel ou "P"révu
        let STA = null;
        if (this.STA && this.STA.length > 0) {
          STA = this.STA;
        } else if (typeof date === 'string' && dayjs(date).isAfter(dayjs())) {
          STA = 'P';
        } else {
          STA = 'A';
        }

        // Affectation du $LFT_ID
        if (this.SCA && /^[A-Z]{4}[0-9]{3}$/.test(this.SCA) && !this.SCC) {
          // Code CCAM
          this.SCC = this.SCA;
        }

        const ETK_AMOUNT: number = this.SSA
          ? Number(this.SSA.replace(/,/g, '.').replace(/ /g, ''))
          : 0;

        if (
          !this.SCC &&
          (!this.SLC || !ngapKeys[this.SLC.toUpperCase()]) &&
          ETK_AMOUNT === 0 &&
          STA !== 'P'
        ) {
          // Il s'agit d'un soin commentaire
          if (this.SLI) {
            let SLI = this.SLI.replace(/\t/g, '\n');
            if (this.SCO && this.SCO.length > 0) {
              SLI = `${this.SLI} - ${this.SCO}`.replace(/\t/g, '\n');
            }
            const dateDeb =
              typeof date === 'string'
                ? dayjs(date).format('YYYY-MM-DD HH:mm:ss')
                : null;
            const query = `INSERT /* LOW_PRIORITY */ INTO T_CONTACT_NOTE_CNO (user_id, CON_ID, CNO_MESSAGE, CNO_DATE)
              VALUES (?,?,?,?)`;
            await this.dataSource.query(query, [id_prat, id_pat, SLI, dateDeb]);
          }
        } else {
          let LFT_ID = 'NULL';
          if (this.SCC && /^[A-Z]{4}[0-9]{3}$/.test(this.SCC)) {
            LFT_ID = !t_dsio_tasks[this.SCC]
              ? 'NULL'
              : (t_dsio_tasks[this.SCC] as string);
            if (LFT_ID === 'NULL') {
              const ccam: CcamEntity = await this.ccamRepo.findOne({
                where: { code: this.SCC },
              });

              const libraryActQuantities: LibraryActQuantityEntity[] =
                await this.libraryActQuantityRepo.find({
                  relations: {
                    act: true,
                  },
                  where: {
                    ccam: ccam,
                  },
                });

              if (libraryActQuantities && libraryActQuantities.length > 0) {
                // ON PREND LE PREMIER ACTE DE LA BIBLIOTHÈQUE TROUVÉ.
                libraryActId = libraryActQuantities[0].act.id;
                libraryActQuantityId = libraryActQuantities[0].id;
              }
            }
          } else if (!this.SCA) {
            LFT_ID = 'NULL';
          } else if (!t_dsio_tasks[this.SCA]) {
            LFT_ID = 'NULL';
          } else {
            if (t_dsio_tasks[this.SCA]) {
              // Import traditionnel
              LFT_ID = t_dsio_tasks[this.SCA] as string;
            } else {
              // Import MacDent
              // On prend l'ID du premier élément
              LFT_ID = t_dsio_tasks[this.SCA][0];
            }
          }

          let SLI = ''; //Acte importé du DSIO';
          if (agatha) {
            if (this.SLI) {
              SLI = this.SLI;
            } else {
              SLI = this.SCA;
            }
            if (this.SCA !== this.SDT) {
              SLI += ' - ' + this.SCA;
            }
          } else if (this.SLI) {
            SLI = this.SLI;
          }

          let DET_TOOTH = 'NULL';
          let DET = false;
          if (this.SDT && /^[0-7][0-8](,[0-7][0-8])*$/.test(this.SDT)) {
            DET = true;
            DET_TOOTH = this.SDT;
          }

          let EVT_STATE = 5;
          let ETK_STATE = 1;
          let dateDeb = null;
          let dateEnd = null;
          if (this.STA && this.STA === 'I') {
            // Acte initial
            await this.dataSource.query(
              `
                INSERT INTO T_DENTAL_INITIAL_DIN (CON_ID, library_act_id, library_act_quantity_id, DIN_NAME, DIN_TOOTH)
                VALUES (?, ?, ?, ?, ?)
            `,
              [id_pat, libraryActId, libraryActQuantityId, SLI, DET_TOOTH],
            );

            return;
          } else if (date) {
            // Acte réalisé / prévu
            dateDeb =
              typeof date === 'string'
                ? dayjs(date).format('YYYY-MM-DD HH:mm:ss')
                : null;
            dateEnd =
              typeof date === 'string'
                ? dayjs(date).add(FRQ).format('YYYY-MM-DD HH:mm:ss')
                : null;
            if (this.SRV && this.SRV === 'O') {
              // Pour rendez-vous à afficher dans l'agenda
              HIDE = 0;
              STA = 'P';
              if (this.SRE) {
                EVT_STATE = +this.SRE;
              }
            } else if (
              dayjs(date as string, 'YYYYMMDD').isAfter(dayjs()) ||
              STA === 'P'
            ) {
              // Rdv futur
              EVT_STATE = 0;
              ETK_STATE = 0;
              HIDE = 0;
              STA = 'P';
            }
          } else {
            // Acte prévu
            dateDeb = null;
            dateEnd = null;
            EVT_STATE = 0;
            ETK_STATE = 0;
          }

          const SCL = this.SCL && this.SCL <= 0 ? this.SCL : -12303; // couleur du rdv
          const SNL = this.SNL
            ? String(Math.min(2147483647, parseInt(this.SNL)))
            : '0';
          let EVT_ID = null;
          let t_last_rdv = {
            EVT_START: '',
            CON_ID: 0,
            USR_ID: 0,
            EVT_ID: 0,
          };

          if (STA !== 'P' || HIDE === 1) {
            EVT_ID = null;
          } else {
            // Acte de type RDV -> affectation
            // Doit-on créer un nouveau rendez-vous pour cet acte ?
            EVT_ID = t_last_rdv['EVT_ID'];
            if (
              dateDeb !== t_last_rdv['EVT_START'] ||
              id_pat !== t_last_rdv['CON_ID'] ||
              id_prat !== t_last_rdv['USR_ID']
            ) {
              if (!SLI && this.PNO && this.PNO.length > 0) {
                SLI = this.PNO;
              }

              const res: { resource_id: number }[] =
                await this.dataSource.query(
                  `
                SELECT resource_id
                FROM T_USER_USR
                WHERE USR_ID = ?
              `,
                  [id_prat],
                );
              const resourceId = res[0]?.resource_id;

              const eventsInsert = await this.dataSource.query(
                `
                INSERT /* LOW_PRIORITY */ INTO T_EVENT_EVT (resource_id, USR_ID, CON_ID, EVT_NAME, EVT_START, EVT_START_TZ, EVT_END, EVT_END_TZ, EVT_COLOR, EVT_STATE, created_by)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)
              `,
                [
                  resourceId,
                  id_prat,
                  id_pat,
                  SLI.substring(1, 81),
                  dateDeb !== null ? dateDeb : 'NULL',
                  'UTC',
                  dateEnd !== null ? dateEnd : 'NULL',
                  'UTC',
                  SCL,
                  EVT_STATE,
                  'dsio',
                ],
              );

              EVT_ID = eventsInsert.insertId;

              t_last_rdv = {
                EVT_START: dateDeb,
                CON_ID: id_pat,
                USR_ID: id_prat,
                EVT_ID: EVT_ID,
              };

              if (dateDeb != null) {
                await this.dataSource.query(
                  `
                  INSERT INTO event_occurrence_evo (evt_id, resource_id, evo_date)
                  VALUES (?, ?, DATE(?))
                `,
                  [EVT_ID, resourceId, t_last_rdv.EVT_START],
                );
              }
            }
          }

          let SCO = this.STR
            ? `Traçabilité : ${this.STR}\n`.replace(/\t/g, '\n')
            : ''; // traçabilité liée au soin
          SCO += this.SCO ? this.SCO.replace(/\t/g, '\n') : ''; // commentaire lié au soin

          if (SCO === '') {
            SCO = 'NULL';
          }

          if (EVT_ID == null || LFT_ID != 'NULL') {
            if (
              SLI ||
              SCO !== 'NULL' ||
              ETK_AMOUNT !== 0 ||
              (this.SLC && this.SLC.length > 0)
            ) {
              let ETK_DATE =
                typeof date === 'string'
                  ? dayjs(date).format('YYYY-MM-DD')
                  : null;
              const ETK_DURATION = dayjs()
                .startOf('day')
                .add(FRQ.asMilliseconds())
                .format('HH:mm:ss');
              if (EVT_ID && EVT_ID !== 'NULL') {
                ETK_DATE = t_last_rdv['EVT_START']
                  ? `DATE('${t_last_rdv['EVT_START']}')`
                  : 'NULL';
                id_pat = t_last_rdv['CON_ID'] ? t_last_rdv['CON_ID'] : id_pat;
                id_prat = t_last_rdv['USR_ID'] ? t_last_rdv['USR_ID'] : id_prat;
              }

              // Dans les DSIO MacDent, les devis sont considérés comme des actes,
              // ce qui engendre des problèmes de soldes.
              // On transforme donc les actes commençant par "Devis" en commentaire.
              // Attention : $SLI est quoté d'où l'ajout d'une quote dans le masque.
              if (macDent && /^\'devis/i.test(SLI)) {
                await this.dataSource.query(
                  `
                  INSERT INTO T_CONTACT_NOTE_CNO (user_id, CON_ID, CNO_DATE, CNO_MESSAGE)
                  VALUES (?, ?, ?, SUBSTRING(CONCAT_WS(' - ', ?, ?, ?), 1, 255))
                `,
                  [id_prat, id_pat, ETK_DATE, SLI, SCO, ETK_AMOUNT],
                );
              } else {
                const eventTaskInsert = await this.dataSource.query(
                  `
                  INSERT INTO T_EVENT_TASK_ETK (EVT_ID, USR_ID, CON_ID, library_act_id, library_act_quantity_id, ETK_NAME, ETK_DATE, ETK_MSG, ETK_POS, ETK_AMOUNT, ETK_DURATION, ETK_STATE)
                  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                `,
                  [
                    EVT_ID,
                    id_prat,
                    id_pat,
                    libraryActId,
                    libraryActQuantityId,
                    SLI.substring(1, 255),
                    ETK_DATE,
                    SCO,
                    SNL,
                    ETK_AMOUNT,
                    ETK_DURATION,
                    ETK_STATE,
                  ],
                );

                const ETK_ID = eventTaskInsert.insertId;

                if (dentalOnLine) {
                  // On doit échanger les valeurs de SNC et SLC
                  if (!this.SNC) {
                    delete this.SLC;
                  } else {
                    const SLC = this.SNC;
                    if (!this.SLC) {
                      this.SNC = '0';
                    } else {
                      this.SNC = this.SLC;
                    }
                    this.SLC = SLC;
                  }
                }

                let ccamId = 'NULL';
                let ngapKeyId = 'NULL';
                let CCAM_CODE = 'NULL';
                let CCAM_MODIFIER = 'NULL';
                let DET_TYPE = 'NULL';
                if (this.SLC && /^[A-Z]{4}[0-9]{3}$/.test(this.SLC)) {
                  //sh le 22/09/2017 : dans certains DSIO le code CCAM est placé dans le champ de la lettre clé NGAP
                  this.SCC = this.SLC;
                  delete this.SLC;
                }
                if (this.SLC) {
                  this.SLC = this.SLC.toUpperCase();

                  // On transforme les lettres clés HN+ en HN
                  if (/^HN.+$/.test(this.SLC)) {
                    this.SLC = 'HN';
                  }

                  if (ngapKeys[this.SLC]) {
                    // il s'agit d'un acte dentaire car il existe une lettre clé
                    DET_TYPE = 'NGAP';
                    ngapKeyId = ngapKeys[this.SLC] + '';
                    DET = true;
                  }
                } else if (this.SCC && /^[A-Z]{4}[0-9]{3}$/.test(this.SCC)) {
                  this.SCC = this.SCC.toUpperCase();

                  const ccamRes: { id: number }[] = await this.dataSource.query(
                    ccamStm,
                    [this.SCC],
                  );
                  ccamId = ccamRes[0].id ? `${ccamRes[0].id}` : null;

                  if (ccamId) {
                    // il s'agit d'un acte dentaire car il existe un code CCAM
                    DET_TYPE = 'CCAM';
                    CCAM_CODE = this.SCC;
                    if (this.SCM && /^[NFAEU]+$/.test(this.SCM)) {
                      CCAM_MODIFIER = this.SCM;
                    }
                    DET = true;
                  } else {
                    ccamId = 'NULL';
                  }
                }
                if (DET) {
                  // Facturé
                  if (
                    this.SSS &&
                    (!isNaN(Number(this.SSS)) || this.SSS === 'O')
                  ) {
                    await this.dataSource.query(
                      `UPDATE T_EVENT_TASK_ETK SET ETK_STATE = 2 WHERE ETK_ID = ?`,
                      [ETK_ID],
                    );
                  }

                  const SNC = this.SNC ? this.SNC.replace(/,/g, '.') : '1.00';

                  await this.dataSource.query(
                    `
                      INSERT /* LOW_PRIORITY */ INTO T_DENTAL_EVENT_TASK_DET (ETK_ID, ccam_id, ngap_key_id, DET_TOOTH, DET_COEF, DET_TYPE, DET_CCAM_CODE, DET_CODE, DET_CCAM_MODIFIER)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `,
                    [
                      ETK_ID,
                      ccamId,
                      ngapKeyId,
                      DET_TOOTH,
                      SNC,
                      DET_TYPE,
                      CCAM_CODE,
                      CCAM_CODE,
                      CCAM_MODIFIER,
                    ],
                  );
                }
              }
            }
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * php/dsio/import_shell.php line 914 -> 953
   */
  async creatRdv(resourceId: number, id_prat: number, id_pat: number) {
    try {
      // Acte de type RDV -> affectation
      const timezone = 'Europe/Paris';
      dayjs.extend(customParseFormat);
      dayjs.extend(utc);
      dayjs.extend(timezonePlugin);
      dayjs.extend(duration);

      const date = dayjs(`${this.SDA}${this.SDE}`, 'YYYYMMDDHH:mm:ss').tz(
        timezone,
      );
      if (!date.isValid()) {
        return;
      }

      const ar_SDU = this.SDU.split(':');
      const FRQ: duration.Duration = dayjs.duration({
        hours: Number(ar_SDU[0]),
        minutes: Number(ar_SDU[1]),
      });

      const dateDeb = date.format('YYYY-MM-DD HH:mm:ss');
      const dateEnd = date.add(FRQ).format('YYYY-MM-DD HH:mm:ss');
      const SLI = this.SLI ? this.SLI : '';
      if (!id_pat) {
        id_pat = null;
      }

      const eventInsert = await this.dataSource.query(
        `
      INSERT INTO T_EVENT_EVT (resource_id, USR_ID, CON_ID, EVT_NAME, EVT_START, EVT_START_TZ, EVT_END, EVT_END_TZ, EVT_COLOR, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
          resourceId,
          id_prat,
          id_pat,
          SLI.substring(1, 81),
          dateDeb !== null ? dateDeb : 'NULL',
          'UTC',
          dateEnd !== null ? dateEnd : 'NULL',
          'UTC',
          this.SCL,
          'dsio',
        ],
      );

      const EVT_ID = eventInsert.insertId;

      const t_last_rdv = {
        EVT_START: dateDeb,
        CON_ID: id_pat,
        USR_ID: id_prat,
        EVT_ID: EVT_ID,
      };

      if (dateDeb != null) {
        await this.dataSource.query(
          `
        INSERT INTO event_occurrence_evo (evt_id, resource_id, evo_date)
        VALUES (?, ?, DATE(?))
      `,
          [EVT_ID, resourceId, t_last_rdv.EVT_START],
        );
      }
    } catch (error) {
      throw error;
    }
  }

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
      if (this.$DP) {
        DP = this.getDateFrom(this.$DP);
      } else {
        return;
      }

      let DE = '$DE'; // date d'échéance
      if (this.$DE) {
        DE = this.getDateFrom(this.$DE);
      } else {
        DE = DP;
      }

      let SS = '$SS';
      if (!this.$SS || this.$SS.length === 0) {
        return;
      }
      let LI = '$LI';
      LI = this.$LI ? this.$LI : 'Import DSIO'; // libellé
      SS =
        '' +
        Math.round(
          parseFloat(this.$SS.replace(',', '.').replace(/ /g, '')) * 100,
        ) /
          100; // somme payée
      let MP = '$MP';
      MP = this.$MP ? this.$MP : ''; // mode de paiement
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

      let SLC_ID = 'NULL';
      if (MP === 'cheque') {
        let BO = '$BO';
        if (this.$BO && this.$BO.length > 0 && !isNaN(Number(this.$BO))) {
          BO = this.$BO;
          let BD = '$BD';
          BD = this.$BD ? this.getDateFrom(this.$BD) : DE;

          if (!this.$BB) {
            return;
          }
          let BB = '$BB';
          BB = this.$BB;
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
      if (!this.$TD) {
        TD = 0;
      } else {
        TD = this.$TD.replace(/,/g, '.').replace(/ /g, '');
        if (isNaN(Number(TD))) {
          TD = 0;
        }
      }

      try {
        await this.contactService.setAmountDue(id_pat, id_prat, Number(TD));
      } catch (error) {
        throw error;
      }
    }
  }

  /**
   * php/dsio/import_shell.php line 1123 -> 1138
   */
  async setLibraryFamily(groupId: number) {
    if (!this.FCF) return;

    try {
      const FCF = this.FCF;
      const FLI =
        !this.FLI || this.FLI.length === 0 ? 'Famille $FCF' : this.FLI;
      const FCO = !this.FCO ? -12303 : this.FCO;

      const pos = Object.keys(this.t_library_family_lfy).length;

      const queryStm = `
        INSERT /* LOW_PRIORITY */ INTO T_LIBRARY_FAMILY_LFY (GRP_ID, LFY_NAME, LFY_COLOR, LFY_POS, LFY_DELETABLE, LFY_USABLE)
        VALUES (?, ?, ?, ?, 1, 0)`;
      const insertRes = await this.dataSource.query(queryStm, [
        groupId,
        FLI,
        FCO,
        pos + 200,
      ]);
      this.t_library_family_lfy[FCF] = insertRes.insertId;
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
    if (!this.FCF || !this.t_library_family_lfy[this.FCF]) {
      return;
    }
    if (!this.ACA) {
      return;
    }
    if (!this.ALI || this.ALI.length === 0) {
      return;
    }
    if (!this.AAB || this.AAB.length === 0) {
      return;
    }

    try {
      this.FCF = this.t_library_family_lfy[this.FCF] + '';
      if (Number(this.FCF) != this.LFY_ID) {
        this.LFT_POS = 0;
        this.LFY_ID = Number(this.FCF);
      }

      const LFT_NAME = this.ALI;
      const LFQ_NAME = this.ALI;

      let query = `INSERT /* LOW_PRIORITY */ INTO T_LIBRARY_FAMILY_TASK_LFT (GRP_ID, LFY_ID, LFT_NAME, LFT_POS, LFT_DELETABLE)
        VALUES (?,?,?,?, 1)`;
      let insertRes = await this.dataSource.query(query, [
        groupId,
        this.LFY_ID,
        LFT_NAME,
        this.LFT_POS++,
      ]);
      const LFT_ID = insertRes.insertId;
      t_dsio_tasks[this.ACA] = LFT_ID; // Relation des ID des actes entre DSIO et e.coo

      if (this.AAS && this.AAS.length > 0) {
        LFT_ASSOCIATED_ACTS[LFT_ID] = this.AAS;
      }

      const LFQ_ABBR = this.AAB;
      let LFQ_DURATION =
        this.ADU && this.ADU.length > 0 && this.ADU.substr(0, 5) != '00:00'
          ? this.ADU.substr(0, 5)
          : '00:15:00';
      if (LFQ_DURATION.length == 5) {
        LFQ_DURATION += ':00';
      }
      const LFQ_AMOUNT =
        this.ASA && this.ASA.length > 0 ? this.ASA.replace(',', '.') : 0;
      const LFQ_AMOUNT_CHILD =
        this.ASE && this.ASE.length > 0 ? this.ASE.replace(',', '.') : 0;
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

      if (this['ALC'] && this.DLK[this['ALC']]) {
        /* Acte dentaire */
        const DLK_ID = this.DLK[this['ALC']];
        const DLT_COLOR = this['ACL'] ? this.ACL : -3840;
        const DLT_CROWN_VISIBLE =
          this['ACV'] && this.ACV.length > 0 && this.ACV === 'N' ? 0 : 1;
        const DLT_ROOT_VISIBLE =
          this['ARV'] && this.ARV.length > 0 && this.ARV === 'N' ? 0 : 1;
        const DLT_ZONE_VISIBLE =
          this['AZV'] && this.AZV.length > 0 ? this.AZV : 'NULL';
        const DLT_ZONE_INVISIBLE =
          this['AZI'] && this.AZI.length > 0 ? this.AZI : 'NULL';
        const DLT_TOOTH_DISABLE =
          this['ADI'] && this.ADI.length > 0 ? this.ADI : 'NULL';
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
          this.ACO && this.ACO.length > 0 ? Number(this.ACO) % 2147483647 : 1;
        const DLQ_COEF_CHILD =
          this.ACE && this.ACE.length > 0 ? Number(this.ACE) % 2147483647 : 1;
        const DLQ_EXCEEDING =
          this.AQD && this.AQD.length > 0 && this.t_QD[this.AQD]
            ? this.t_QD[this.AQD]
            : 'NULL';
        const DLQ_PURCHASE_PRICE =
          this.APA && this.APA.length > 0
            ? Number(this.APA.replace(',', '.'))
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

      if (false) {
        if (this.t_library_family_task_lft[this.ACA]) {
          // Mise à jour des actes des rdvs
          const etk_list = this.t_library_family_task_lft[this.ACA].join(',');
          const query = `UPDATE T_EVENT_TASK_ETK ETK
            SET ETK.LFT_ID = ?
            WHERE ETK.ETK_ID in (?)`;
          await this.dataSource.query(query, [LFT_ID, etk_list]);
          delete this.t_library_family_task_lft[this.ACA];
        }
      }
    } catch (error) {
      throw error;
    }
  }

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
    if (!this.FCF || !this.t_library_family_lfy[this.FCF]) {
      return;
    }
    if (!this.ACA) {
      return;
    }
    if (!this.ALI || this.ALI.length === 0) {
      return;
    }
    if (!this.AAB || this.AAB.length === 0) {
      return;
    }

    this.FCF = this.t_library_family_lfy[this.FCF] + '';
    if (Number(this.FCF) !== this.LFY_ID) {
      this.LFT_POS = 0;
      this.LFY_ID = Number(this.FCF);
    }
    const ATA = this.ATA && this.ATA.length > 0 ? this.ATA : ATA_DE_BASE;
    const LFQ_ABBR = this.AAB;

    if (!t_dsio_tasks[this.ACA] || t_dsio_tasks[this.ACA].length === 0) {
      t_dsio_tasks[this.ACA] = {};
    }

    try {
      let LFT_ID: number = null;
      if (!t_dsio_tasks[this.ACA][ATA]) {
        const query = `INSERT /* LOW_PRIORITY */ INTO T_LIBRARY_FAMILY_TASK_LFT (GRP_ID, LFY_ID, LFT_POS, LFT_NAME)
          VALUES(?, ?, ?, ?)`;
        const insertRes = await this.dataSource.query(query, [
          groupId,
          this.LFY_ID,
          this.LFT_POS++,
          LFQ_ABBR,
        ]);
        LFT_ID = insertRes.insertId;
        t_dsio_tasks[this.ACA][ATA] = LFT_ID; // Relation des ID des actes entre DSIO et e.coo
      } else {
        LFT_ID = t_dsio_tasks[this.ACA][ATA];
      }

      const LFQ_NAME = this.ALI;
      let LFQ_DURATION =
        this.ADU && this.ADU.length > 0 && this.ADU.substr(0, 5) !== '00:00'
          ? this.ADU.substr(0, 5)
          : '00:15:00';
      if (LFQ_DURATION.length === 5) {
        LFQ_DURATION += ':00';
      }

      let LFQ_AMOUNT =
        this.ASA && this.ASA.length > 0 ? this.ASA.replace(/,/g, '.') : 0;
      let LFQ_AMOUNT_CHILD =
        this.ASE && this.ASE.length > 0 ? this.ASE.replace(/,/g, '.') : 0;
      const LFQ_QUANTITY =
        this.AQT && this.AQT.length > 0 && !isNaN(Number(this.AQT))
          ? this.AQT
          : 1;

      if (LFQ_AMOUNT !== null || LFQ_AMOUNT_CHILD !== null) {
        let LFQ_ID = null;

        if (!this.t_dsio_tasks_quantity[LFT_ID]) {
          this.t_dsio_tasks_quantity[LFT_ID] = {};
        }

        if (LFQ_QUANTITY != 1 && !this.t_dsio_tasks_quantity[LFT_ID][1]) {
          this.t_dsio_tasks_quantity[LFT_ID][1] = [];
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
          this.t_dsio_tasks_quantity[LFT_ID][1][ATA] = insertRes.insertId;
        }

        if (!this.t_dsio_tasks_quantity[LFT_ID][LFQ_QUANTITY]) {
          this.t_dsio_tasks_quantity[LFT_ID][LFQ_QUANTITY] = [];
        }

        if (!this.t_dsio_tasks_quantity[LFT_ID][LFQ_QUANTITY][ATA]) {
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
          this.t_dsio_tasks_quantity[LFT_ID][LFQ_QUANTITY][ATA] = LFQ_ID;
        } else if (ATA == ATA_DE_BASE) {
          LFQ_ID = this.t_dsio_tasks_quantity[LFT_ID][LFQ_QUANTITY][ATA];
          if (LFQ_AMOUNT == null) {
            const query = `UPDATE T_LIBRARY_FAMILY_TASK_QUANTITY_LFQ set LFQ_AMOUNT_CHILD = ? where LFQ_ID = ?`;
            await this.dataSource.query(query, [LFQ_AMOUNT_CHILD, LFQ_ID]);
          } else {
            const query = `UPDATE T_LIBRARY_FAMILY_TASK_QUANTITY_LFQ set LFQ_AMOUNT = ? where LFQ_ID = ?`;
            await this.dataSource.query(query, [LFQ_AMOUNT, LFQ_ID]);
          }
        } else {
          LFQ_ID = this.t_dsio_tasks_quantity[LFT_ID][LFQ_QUANTITY][ATA];
        }

        if (this.ALC && this.DLK[this.ALC]) {
          /* Acte dentaire */
          const DLK_ID = this.DLK[this.ALC];
          const DLT_COLOR = this.ACL ? this.ACL : -3840;
          const DLT_CROWN_VISIBLE =
            this.ACV && this.ACV.length > 0 && this.ACV === 'N' ? 0 : 1;
          const DLT_ROOT_VISIBLE =
            this.ARV && this.ARV.length > 0 && this.ARV === 'N' ? 0 : 1;
          const DLT_ZONE_VISIBLE =
            this.AZV && this.AZV.length > 0 ? this.AZV : 'NULL';
          const DLT_ZONE_INVISIBLE =
            this.AZI && this.AZI.length > 0 ? this.AZI : 'NULL';
          const DLT_TOOTH_DISABLE =
            this.ADI && this.ADI.length > 0 ? this.ADI : 'NULL';
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

          let DLQ_COEF = this.ACO ? Number(this.ACO) % 2147483647 : null;
          let DLQ_COEF_CHILD = this.ACE ? Number(this.ACE) % 2147483647 : null;
          const DLQ_EXCEEDING =
            this.AQD && this.AQD.length > 0 && this.t_QD[this.AQD]
              ? this.t_QD[this.AQD]
              : 'NULL';
          const DLQ_PURCHASE_PRICE =
            this.APA && this.APA.length > 0 ? this.APA.replace(/,/g, '.') : 0;

          if (!this.t_dsio_dental_tasks_quantity[LFQ_ID]) {
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
            this.t_dsio_dental_tasks_quantity[LFQ_ID] = true;
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
    if (!this.NCN || this.NCN.length === 0) {
      return;
    }
    if (!this.PTC || this.PTC.length === 0) {
      return;
    }
    if (!this.PC1) {
      return;
    }
    if (!this.NCO || this.NCO.length === 0) {
      return;
    }

    let NCN = this.NCN;
    const PTC = this.PTC;
    const PC1 = this.PC1;
    const NCO = this.NCO.replace(/\t/g, '\n');
    const NCL = this.NCL && this.NCL.length > 0 ? this.NCL : null;
    const NPA = this.NPA && this.NPA.length > 0 && this.NPA === 'N' ? 0 : 1;
    const NGA = this.NGA && this.NGA.length > 0 ? this.NGA : null;
    const NHA = this.NHA && this.NHA.length > 0 ? this.NHA : null;
    const NDR = this.NDR && this.NDR.length > 0 ? this.NDR : null;
    const NBA = this.NBA && this.NBA.length > 0 ? this.NBA : null;
    try {
      if (!this.T_POSTIT_PTT[NCN]) {
        const query = `REPLACE /* LOW_PRIORITY */ INTO T_POSTIT_PTT (
        ${NCL ? 'PTT_COLOR,' : ''}
        ${NPA ? 'PTT_SHARED,' : ''}
        USR_ID,CON_ID,PTT_MSG) VALUES (
        ${NCL ? NCL + ',' : ''}
        ${NPA ? NPA + ',' : ''}
        ?,?,?)`;
        const res = await this.dataSource.query(query, [PC1, PTC, NCO]);
        this.T_POSTIT_PTT[NCN] = res.insertId;
      }
      NCN = this.T_POSTIT_PTT[NCN];

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
      'PTT_ID,USR_ID) VALUES (
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
    if (!this.ICI || this.ICI.length === 0) {
      return;
    }
    if (!this.ILI || this.ILI.length === 0) {
      return;
    }

    const contraindicationName = this.ILI;
    try {
      const insertRes = await this.dataSource.query(
        `
        INSERT INTO T_MEDICAL_LIBRARY_CONTRAINDICATION_MLC (organization_id, MLC_LABEL)
        VALUES (?, ?)
      `,
        [groupId, contraindicationName],
      );

      const contraindicationId = insertRes.insertId;

      if (this.T_CONTACT_CONTRAINDICATION_COC[this.ICI]) {
        const values = this.T_CONTACT_CONTRAINDICATION_COC[this.ICI]
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

  /**
   * php/dsio/import_shell.php line 1519 -> 1544
   */
  async insertMedicamentFamily(groupId: number) {
    if (!this.DLI || this.DLI.length === 0) {
      return;
    }
    if (!this.DCD || this.DCD.length === 0) {
      return;
    }

    const medicamentFamilyId = this.DCD;
    const medicamentFamilyName = this.DLI;

    try {
      const insertRes = await this.dataSource.query(
        `
        INSERT INTO T_MEDICAL_PRESCRIPTION_TYPE_MDT (organization_id, MDT_NAME)
        VALUES (?, ?)
      `,
        [groupId, medicamentFamilyName],
      );

      this.medicamentFamilies[medicamentFamilyId] = insertRes.insertId;
    } catch (error) {
      throw error;
    }
  }

  /** php/dsio/import_shell.php line 1553 -> 1597
   * Permet de créer une prescription
   */
  async insertMedicament(groupId: number) {
    if (!this.DCD || this.DCD.length === 0) {
      return;
    }

    if (groupId !== 280) {
      if (!this.MLI || this.MLI.length === 0) {
        this.MLI = '';
      }
      if (!this.MAB || this.MAB.length === 0) {
        this.MAB = '';
      }
      if (!this.MTX || this.MTX.length === 0) {
        this.MTX = '';
      }
    } else if (
      (!this.MLI || this.MLI.length === 0) &&
      (!this.MAB || this.MAB.length === 0) &&
      (!this.MTX || this.MTX.length === 0)
    ) {
      return;
    }

    if (!this.medicamentFamilies[this.DCD]) {
      return;
    }

    const medicamentFamilyId = this.medicamentFamilies[this.DCD];
    const medicamentShortName =
      !this.MAB || this.MAB.length === 0 ? '' : this.MAB;
    const medicamentName = !this.MLI || this.MLI.length === 0 ? '' : this.MLI;
    const medicamentPosologie =
      !this.MTX || this.MTX.length === 0 ? '' : this.MTX.replace(/\t/g, '\n');

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
  async setCorrespondent(groupId: number) {
    const LASTNAME = this.RN1 ? this.RN1 : ''; // T_CORRESPONDENT_CPD.CPD_LASTNAME VARCHAR(50)
    const TYPE = this.RF1 ? this.RF1 : 'NULL'; // T_CORRESPONDENT_CPD.CPD_TYPE VARCHAR(50)
    const GEN_ID =
      this.RT1 && this.configService.tGenderGen[this.RT1]
        ? this.configService.tGenderGen[this.RT1]
        : 'NULL'; // T_CORRESPONDENT_CPD.GEN_ID INT(11)
    const MAIL = this.RM1 ? this.RM1 : 'NULL'; // T_CORRESPONDENT_CPD.CPD_MAIL VARCHAR(50)
    const MSG = this.RN2 ? this.RN2.replace(/\t/g, '\n') : 'NULL'; // T_CORRESPONDENT_CPD.CPD_MSG TEXT

    const STREET = this.RA1 ? this.RA1.replace(/\t/g, ', ') : 'NULL'; // T_ADDRESS_ADR.ADR_STREET VARCHAR(255)
    const ZIP_CODE = this.RA2 ? this.RA2 : 'NULL'; // T_ADDRESS_ADR.ADR_ZIP_CODE VARCHAR(6)
    const CITY = this.RA3 ? this.RA3 : 'NULL'; // T_ADDRESS_ADR.ADR_CITY VARCHAR(255)

    const RT = {
      1: 'home',
      2: 'mobile',
      4: 'fax',
    };
    RT[1] = this.RT1 && this.RT1.length > 0 ? this.RT1.replace(/ /g, '') : null; // Tel T_PHONE_PHO.PHO_NBR
    RT[4] = this.RT2 && this.RT2.length > 0 ? this.RT2.replace(/ /g, '') : null; // Tel T_PHONE_PHO.PHO_NBR
    RT[2] = this.RT3 && this.RT3.length > 0 ? this.RT3.replace(/ /g, '') : null; // Tel T_PHONE_PHO.PHO_NBR

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
        !this.BAB ||
        this.BAB.length === 0 ||
        !this.PC1 ||
        this.PC1.length === 0
      ) {
        return;
      }

      const USR_ID = idPrat;
      const LBK_ABBR = this.BAB ? this.BAB : '';

      const numRows = await this.libraryBankRepo.count({
        where: {
          usrId: USR_ID,
          abbr: LBK_ABBR,
        },
      });

      if (numRows > 0) {
        return;
      }

      const STREET = this.BAD ? this.BAD : '';
      const ZIP_CODE = this.BCP ? this.BCP : '';
      const CITY = this.BVI ? this.BVI : '';

      let ADR_ID = 'NULL';
      if (STREET + ZIP_CODE + CITY !== '') {
        const insertRes = await this.dataSource.query(
          `
        INSERT INTO T_ADDRESS_ADR (ADR_STREET, ADR_ZIP_CODE, ADR_CITY)
        VALUES(?, ?, ?)`,
          [STREET, ZIP_CODE, CITY],
        );
        ADR_ID = insertRes.insertId;
      }

      const LBK_NAME = this.BNO ? this.BNO : '';
      const LBK_BANK_CODE = this.BCO ? this.BCO : '';
      const LBK_BRANCH_CODE = this.BGU ? this.BGU : '';
      const LBK_ACCOUNT_NBR = this.BNU ? this.BNU : '';
      const LBK_BANK_DETAILS = this.BRI ? this.BRI : '';
      const LBK_SLIP_CHECK_NBR = this.BNB ? this.BNB : '1';

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
