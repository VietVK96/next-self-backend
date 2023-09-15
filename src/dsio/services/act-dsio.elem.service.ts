import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
import * as utc from 'dayjs/plugin/utc';
import * as timezonePlugin from 'dayjs/plugin/timezone';
import * as duration from 'dayjs/plugin/duration';
import { InjectRepository } from '@nestjs/typeorm';
import { CcamEntity } from 'src/entities/ccam.entity';
import { DataSource, Repository } from 'typeorm';
import { LibraryActQuantityEntity } from 'src/entities/library-act-quantity.entity';
import { InitDsioElemService } from './init-dsio.elem.service';

@Injectable()
export class ActDsioElemService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(CcamEntity)
    private ccamRepo: Repository<CcamEntity>,
    @InjectRepository(LibraryActQuantityEntity)
    private libraryActQuantityRepo: Repository<LibraryActQuantityEntity>,
    private initDsioElemService: InitDsioElemService,
  ) {}

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
    t_dsio_tasks:
      | Record<string, string>
      | Record<string, Record<string, number>>,
    ngapKeys: Record<string, number>,
  ) {
    try {
      if (id_prat) {
        const timezone = 'Europe/Paris';
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
          this.initDsioElemService.SDE &&
          this.initDsioElemService.SDE.length > 0 &&
          dayjs(this.initDsioElemService.SDE, 'HH:mm:ss', true)
            .tz(timezone)
            .isValid()
        ) {
          date = dayjs(
            `${this.initDsioElemService.SDA}${this.initDsioElemService.SDE}`,
          )
            .tz(timezone)
            .format('YYYYMMDDHH:mm:ss');
        }

        let FRQ = this.initDsioElemService.FRQ;
        if (
          this.initDsioElemService?.SDU &&
          this.initDsioElemService.SDU?.length > 0 &&
          this.initDsioElemService.SDU !== '00:00:00' &&
          dayjs(this.initDsioElemService.SDU, 'HH:mm:ss').isValid()
        ) {
          const ar_SDU = this.initDsioElemService.SDU.split(':');
          dayjs.extend(duration);
          FRQ = dayjs.duration(`PT${ar_SDU[0]}H${ar_SDU[1]}M`);
        }

        // Type d'acte : "I"nitial, "A"ctuel ou "P"révu
        let STA = null;
        if (
          this.initDsioElemService.STA &&
          this.initDsioElemService.STA.length > 0
        ) {
          STA = this.initDsioElemService.STA;
        } else if (typeof date === 'string' && dayjs(date).isAfter(dayjs())) {
          STA = 'P';
        } else {
          STA = 'A';
        }

        // Affectation du $LFT_ID
        if (
          this.initDsioElemService.SCA &&
          /^[A-Z]{4}[0-9]{3}$/.test(this.initDsioElemService.SCA) &&
          !this.initDsioElemService.SCC
        ) {
          // Code CCAM
          this.initDsioElemService.SCC = this.initDsioElemService.SCA;
        }

        const ETK_AMOUNT: number = this.initDsioElemService.SSA
          ? Number(
              this.initDsioElemService.SSA.replace(/,/g, '.').replace(/ /g, ''),
            )
          : 0;

        if (
          !this.initDsioElemService.SCC &&
          (!this.initDsioElemService.SLC ||
            !ngapKeys[this.initDsioElemService.SLC.toUpperCase()]) &&
          ETK_AMOUNT === 0 &&
          STA !== 'P'
        ) {
          // Il s'agit d'un soin commentaire
          if (this.initDsioElemService.SLI) {
            let SLI = this.initDsioElemService.SLI.replace(/\t/g, '\n');
            if (
              this.initDsioElemService.SCO &&
              this.initDsioElemService.SCO.length > 0
            ) {
              SLI =
                `${this.initDsioElemService.SLI} - ${this.initDsioElemService.SCO}`.replace(
                  /\t/g,
                  '\n',
                );
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
          let LFT_ID = null;
          if (
            this.initDsioElemService.SCC &&
            /^[A-Z]{4}[0-9]{3}$/.test(this.initDsioElemService.SCC)
          ) {
            LFT_ID = !t_dsio_tasks[this.initDsioElemService.SCC]
              ? null
              : (t_dsio_tasks[this.initDsioElemService.SCC] as string);
            if (LFT_ID === null) {
              const ccam: CcamEntity = await this.ccamRepo.findOne({
                where: { code: this.initDsioElemService.SCC },
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
          } else if (!this.initDsioElemService.SCA) {
            LFT_ID = null;
          } else if (!t_dsio_tasks[this.initDsioElemService.SCA]) {
            LFT_ID = null;
          } else {
            if (t_dsio_tasks[this.initDsioElemService.SCA]) {
              // Import traditionnel
              LFT_ID = t_dsio_tasks[this.initDsioElemService.SCA] as string;
            } else {
              // Import MacDent
              // On prend l'ID du premier élément
              LFT_ID = t_dsio_tasks[this.initDsioElemService.SCA][0];
            }
          }

          let SLI = ''; //Acte importé du DSIO';
          if (agatha) {
            if (this.initDsioElemService.SLI) {
              SLI = this.initDsioElemService.SLI;
            } else {
              SLI = this.initDsioElemService.SCA;
            }
            if (this.initDsioElemService.SCA !== this.initDsioElemService.SDT) {
              SLI += ' - ' + this.initDsioElemService.SCA;
            }
          } else if (this.initDsioElemService.SLI) {
            SLI = this.initDsioElemService.SLI;
          }

          let DET_TOOTH = null;
          let DET = false;
          if (
            this.initDsioElemService.SDT &&
            /^[0-7][0-8](,[0-7][0-8])*$/.test(this.initDsioElemService.SDT)
          ) {
            DET = true;
            DET_TOOTH = this.initDsioElemService.SDT;
          }

          let EVT_STATE = 5;
          let ETK_STATE = 1;
          let dateDeb = null;
          let dateEnd = null;
          if (
            this.initDsioElemService.STA &&
            this.initDsioElemService.STA === 'I'
          ) {
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
            if (
              this.initDsioElemService.SRV &&
              this.initDsioElemService.SRV === 'O'
            ) {
              // Pour rendez-vous à afficher dans l'agenda
              HIDE = 0;
              STA = 'P';
              if (this.initDsioElemService.SRE) {
                EVT_STATE = +this.initDsioElemService.SRE;
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

          const SCL =
            this.initDsioElemService.SCL && this.initDsioElemService.SCL <= 0
              ? this.initDsioElemService.SCL
              : -12303; // couleur du rdv
          const SNL = this.initDsioElemService.SNL
            ? String(
                Math.min(2147483647, parseInt(this.initDsioElemService.SNL)),
              )
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
              if (
                !SLI &&
                this.initDsioElemService.PNO &&
                this.initDsioElemService.PNO.length > 0
              ) {
                SLI = this.initDsioElemService.PNO;
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
                  dateDeb !== null ? dateDeb : null,
                  'UTC',
                  dateEnd !== null ? dateEnd : null,
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

          let SCO = this.initDsioElemService.STR
            ? `Traçabilité : ${this.initDsioElemService.STR}\n`.replace(
                /\t/g,
                '\n',
              )
            : ''; // traçabilité liée au soin
          SCO += this.initDsioElemService.SCO
            ? this.initDsioElemService.SCO.replace(/\t/g, '\n')
            : ''; // commentaire lié au soin

          if (SCO === '') {
            SCO = null;
          }

          if (EVT_ID == null || LFT_ID != null) {
            if (
              SLI ||
              SCO !== null ||
              ETK_AMOUNT !== 0 ||
              (this.initDsioElemService.SLC &&
                this.initDsioElemService.SLC.length > 0)
            ) {
              let ETK_DATE =
                typeof date === 'string'
                  ? dayjs(date).format('YYYY-MM-DD')
                  : null;
              const ETK_DURATION = dayjs()
                .startOf('day')
                .add(FRQ.asMilliseconds())
                .format('HH:mm:ss');
              if (EVT_ID) {
                ETK_DATE = t_last_rdv['EVT_START']
                  ? `DATE('${t_last_rdv['EVT_START']}')`
                  : null;
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
                  if (!this.initDsioElemService.SNC) {
                    delete this.initDsioElemService.SLC;
                  } else {
                    const SLC = this.initDsioElemService.SNC;
                    if (!this.initDsioElemService.SLC) {
                      this.initDsioElemService.SNC = '0';
                    } else {
                      this.initDsioElemService.SNC =
                        this.initDsioElemService.SLC;
                    }
                    this.initDsioElemService.SLC = SLC;
                  }
                }

                let ccamId = null;
                let ngapKeyId = null;
                let CCAM_CODE = null;
                let CCAM_MODIFIER = null;
                let DET_TYPE = null;
                if (
                  this.initDsioElemService.SLC &&
                  /^[A-Z]{4}[0-9]{3}$/.test(this.initDsioElemService.SLC)
                ) {
                  //sh le 22/09/2017 : dans certains DSIO le code CCAM est placé dans le champ de la lettre clé NGAP
                  this.initDsioElemService.SCC = this.initDsioElemService.SLC;
                  delete this.initDsioElemService.SLC;
                }
                if (this.initDsioElemService.SLC) {
                  this.initDsioElemService.SLC =
                    this.initDsioElemService.SLC.toUpperCase();

                  // On transforme les lettres clés HN+ en HN
                  if (/^HN.+$/.test(this.initDsioElemService.SLC)) {
                    this.initDsioElemService.SLC = 'HN';
                  }

                  if (ngapKeys[this.initDsioElemService.SLC]) {
                    // il s'agit d'un acte dentaire car il existe une lettre clé
                    DET_TYPE = 'NGAP';
                    ngapKeyId = ngapKeys[this.initDsioElemService.SLC] + '';
                    DET = true;
                  }
                } else if (
                  this.initDsioElemService.SCC &&
                  /^[A-Z]{4}[0-9]{3}$/.test(this.initDsioElemService.SCC)
                ) {
                  this.initDsioElemService.SCC =
                    this.initDsioElemService.SCC.toUpperCase();

                  const ccamRes: { id: number }[] = await this.dataSource.query(
                    ccamStm,
                    [this.initDsioElemService.SCC],
                  );
                  ccamId = ccamRes[0].id ? `${ccamRes[0].id}` : null;

                  if (ccamId) {
                    // il s'agit d'un acte dentaire car il existe un code CCAM
                    DET_TYPE = 'CCAM';
                    CCAM_CODE = this.initDsioElemService.SCC;
                    if (
                      this.initDsioElemService.SCM &&
                      /^[NFAEU]+$/.test(this.initDsioElemService.SCM)
                    ) {
                      CCAM_MODIFIER = this.initDsioElemService.SCM;
                    }
                    DET = true;
                  } else {
                    ccamId = null;
                  }
                }
                if (DET) {
                  // Facturé
                  if (
                    this.initDsioElemService.SSS &&
                    (!isNaN(Number(this.initDsioElemService.SSS)) ||
                      this.initDsioElemService.SSS === 'O')
                  ) {
                    await this.dataSource.query(
                      `UPDATE T_EVENT_TASK_ETK SET ETK_STATE = 2 WHERE ETK_ID = ?`,
                      [ETK_ID],
                    );
                  }

                  const SNC = this.initDsioElemService.SNC
                    ? this.initDsioElemService.SNC.replace(/,/g, '.')
                    : '1.00';

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

      const date = dayjs(
        `${this.initDsioElemService.SDA}${this.initDsioElemService.SDE}`,
        'YYYYMMDDHH:mm:ss',
      ).tz(timezone);
      if (!date.isValid()) {
        return;
      }

      const ar_SDU = this.initDsioElemService.SDU.split(':');
      const FRQ: duration.Duration = dayjs.duration({
        hours: Number(ar_SDU[0]),
        minutes: Number(ar_SDU[1]),
      });

      const dateDeb = date.format('YYYY-MM-DD HH:mm:ss');
      const dateEnd = date.add(FRQ).format('YYYY-MM-DD HH:mm:ss');
      const SLI = this.initDsioElemService.SLI
        ? this.initDsioElemService.SLI
        : '';
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
          dateDeb !== null ? dateDeb : null,
          'UTC',
          dateEnd !== null ? dateEnd : null,
          'UTC',
          this.initDsioElemService.SCL,
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
}
