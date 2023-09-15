import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as duration from 'dayjs/plugin/duration';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ContactEntity } from 'src/entities/contact.entity';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { metaphone } from 'src/common/util/metaphone';

@Injectable()
export class InitDsioElemService {
  currentQuery = '';
  ATE: string[] = []; // tableau des numéro s de téléphne supplémentaire dans MacDent
  ACA: string;
  T_CONTACT_CONTRAINDICATION_COC: Record<string, number[]> = {};
  FRQ: duration.Duration;
  t_library_family_lfy: Record<string, number> = {};
  t_library_family_task_lft: Record<string, string[]> = {};
  t_dsio_tasks_quantity: Record<string, Record<string, number[]>> = {};
  t_dsio_dental_tasks_quantity: Record<string, boolean> = {};
  LFT_POS = 0;
  LFY_ID = 0;
  DLK: Record<string, string> = {};
  t_QD: Record<string, string> = {
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
  T_POSTIT_PTT: Record<string, string> = {};
  medicamentFamilies: Record<string, string> = {};
  SDA: string;
  DCD: string;
  AA1: string;
  AA2: string;
  ACP: string;
  AVI: string;
  PTC: string;
  PNO: string;
  PTN: string;
  PTP: string;
  PTG: string;
  PTD: string;
  PTF: string;
  PTB: string;
  AEM: string;
  AMA: string;
  PAL: string;
  PAA: string;
  PAC: string;
  PTM: string;
  PTI: string;
  ATD: string;
  ATM: string;
  ATT: string;
  PCM: string;
  SDE: string;
  SDU: string;
  STA: string;
  SCA: string;
  SCC: string;
  SSA: string;
  SLC: string;
  SLI: string;
  SCO: string;
  SDT: string;
  SRV: string;
  SRE: string;
  SNL: string;
  SCL: number;
  STR: string;
  SNC: string;
  SCM: string;
  SSS: string;
  $DP: string;
  $DE: string;
  $SS: string;
  $LI: string;
  $MP: string;
  $BO: string;
  $BD: string;
  $BB: string;
  $TD: string;
  FCF: string;
  FLI: string;
  FCO: number;
  ALI: string;
  AAB: string;
  AAS: string;
  ADU: string;
  ASA: string;
  ASE: string;
  ACL: number;
  ACV: string;
  ARV: string;
  AZV: string;
  AZI: string;
  ADI: string;
  ACO: string;
  ACE: string;
  AQD: string;
  APA: string;
  NCN: string;
  PC1: string;
  NCO: string;
  NCL: string;
  NPA: string;
  NGA: string;
  NHA: string;
  NDR: string;
  NBA: string;
  DLI: string;
  MLI: string;
  MAB: string;
  MTX: string;
  ATA: string;
  AQT: string;
  ALC: string;
  ILI: string;
  ICI: string;
  RN1: string;
  RF1: string;
  RT1: string;
  RM1: string;
  RN2: string;
  RA1: string;
  RA2: string;
  RA3: string;
  RT2: string;
  RT3: string;
  BAB: string;
  BAD: string;
  BCP: string;
  BVI: string;
  BNO: string;
  BCO: string;
  BGU: string;
  BNU: string;
  BRI: string;
  BNB: string;

  constructor(
    private dataSource: DataSource,
    @InjectRepository(ContactEntity)
    private contactRepo: Repository<ContactEntity>,
    @InjectRepository(OrganizationEntity)
    private organizationRepo: Repository<OrganizationEntity>,
  ) {}

  init() {
    this.currentQuery = '';
    this.ATE = [];
    this.ACA = null;
    this.T_CONTACT_CONTRAINDICATION_COC = {};
    this.FRQ = null;
    this.t_library_family_lfy = {};
    this.t_library_family_task_lft = {};
    this.t_dsio_tasks_quantity = {};
    this.t_dsio_dental_tasks_quantity = {};
    this.LFT_POS = 0;
    this.LFY_ID = 0;
    this.DLK = {};
    this.T_POSTIT_PTT = {};
    this.medicamentFamilies = {};
    this.SDA = null;
    this.DCD = null;
    this.AA1 = null;
    this.AA2 = null;
    this.ACP = null;
    this.AVI = null;
    this.PTC = null;
    this.PNO = null;
    this.PTN = null;
    this.PTP = null;
    this.PTG = null;
    this.PTD = null;
    this.PTF = null;
    this.PTB = null;
    this.AEM = null;
    this.AMA = null;
    this.PAL = null;
    this.PAA = null;
    this.PAC = null;
    this.PTM = null;
    this.PTI = null;
    this.ATD = null;
    this.ATM = null;
    this.ATT = null;
    this.PCM = null;
    this.SDE = null;
    this.SDU = null;
    this.STA = null;
    this.SCA = null;
    this.SCC = null;
    this.SSA = null;
    this.SLC = null;
    this.SLI = null;
    this.SCO = null;
    this.SDT = null;
    this.SRV = null;
    this.SRE = null;
    this.SNL = null;
    this.SCL = null;
    this.STR = null;
    this.SNC = null;
    this.SCM = null;
    this.SSS = null;
    this.$DP = null;
    this.$DE = null;
    this.$SS = null;
    this.$LI = null;
    this.$MP = null;
    this.$BO = null;
    this.$BD = null;
    this.$BB = null;
    this.$TD = null;
    this.FCF = null;
    this.FLI = null;
    this.FCO = null;
    this.ALI = null;
    this.AAB = null;
    this.AAS = null;
    this.ADU = null;
    this.ASA = null;
    this.ASE = null;
    this.ACL = null;
    this.ACV = null;
    this.ARV = null;
    this.AZV = null;
    this.AZI = null;
    this.ADI = null;
    this.ACO = null;
    this.ACE = null;
    this.AQD = null;
    this.APA = null;
    this.NCN = null;
    this.PC1 = null;
    this.NCO = null;
    this.NCL = null;
    this.NPA = null;
    this.NGA = null;
    this.NHA = null;
    this.NDR = null;
    this.NBA = null;
    this.DLI = null;
    this.MLI = null;
    this.MAB = null;
    this.MTX = null;
    this.ATA = null;
    this.AQT = null;
    this.ALC = null;
    this.ILI = null;
    this.ICI = null;
    this.RN1 = null;
    this.RF1 = null;
    this.RT1 = null;
    this.RM1 = null;
    this.RN2 = null;
    this.RA1 = null;
    this.RA2 = null;
    this.RA3 = null;
    this.RT2 = null;
    this.RT3 = null;
    this.BAB = null;
    this.BAD = null;
    this.BCP = null;
    this.BVI = null;
    this.BNO = null;
    this.BCO = null;
    this.BGU = null;
    this.BNU = null;
    this.BRI = null;
    this.BNB = null;
  }

  /**
   * php/dsio/import_shell.php line 217 -> 249
   */
  construct(bname: string, value: string) {
    this.init();
    this.setInfo(bname, value);
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
  async creatPatient(
    ar_fam: Record<string, number>,
    ar_prat: Record<number, string>,
    PTC_SUBST = 0,
    groupId: number,
    t_COF: Record<string, number[]>,
    t_gender_gen: Record<string, number>,
    t_phone_type_pty: Record<string, number>,
  ) {
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
      let PTC: string | number = null;
      if (this.hasOwnProperty('PTC') && this.PTC && !isNaN(Number(this.PTC))) {
        /* La référence est un entier, on l'affecte directement au numéro de dossier patient */
        PTC = this.PTC;
      } else if (this.hasOwnProperty('PTC')) {
        // référence de dossier au lieu d'un numéro...
        // On place la référence du dossier dans les commentaires de la fiche patient
        CON_MSG = `Référence DSIO : "${this.PTC}"\n"${CON_MSG}`;
        // On crée un numéro de dossier
        PTC = PTC_SUBST;
      }

      // Importation des notes du patient
      if (this.hasOwnProperty('PNO') && this.PNO && this.PNO.length > 0) {
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
      if (this.PTG && t_gender_gen[this.PTG]) {
        PTG = t_gender_gen[this.PTG];
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
      patient.organizationId = groupId;
      patient.nbr = +PTC;
      patient.lastname = this.PTN;
      patient.firstname = this.PTP;
      patient.lastNamePhonetic = metaphone(this.PTN).substring(0, 10);
      patient.firstNamePhonetic = metaphone(this.PTP).substring(0, 10);

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
        if (!t_COF[this.PTB]) {
          t_COF[this.PTB] = [CON_ID];
        } else {
          t_COF[this.PTB].push(CON_ID);
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
            PTG = t_gender_gen['M'];
          } else if (this.PTI.substr(0, 1) === '2') {
            PTG = t_gender_gen['Mme'];
          } else {
            PTG = t_gender_gen['M & Mme'];
          }
        }
      } else if (!PTG) {
        PTG = t_gender_gen['M & Mme'];
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
          [t_phone_type_pty['home'], ATD],
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
          [t_phone_type_pty['office'], ATT],
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
            [t_phone_type_pty[PTY_TYPE], ATM],
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
            ? t_phone_type_pty['sms']
            : t_phone_type_pty['home'];
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
}
