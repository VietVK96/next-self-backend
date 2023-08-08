import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ImporterDsioDto } from '../dto/importer-dsio.dto';
import dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import * as fs from 'fs';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { DsioService } from './dsio.service';

/**
 * php/dsio/import_shell.php
 */
@Injectable()
export class ImporterService {
  constructor(
    private dataSource: DataSource,
    private dsioService: DsioService,
  ) {}

  /**
   * php/dsio/import_shell.php line 5 ->
   */
  async runImportShell(
    importerDsioDto: ImporterDsioDto,
    orgId: number,
    FRQ: number,
    HMD: string,
    HMF: string,
    HAD: string,
    HAF: string,
  ) {
    try {
      const filename = importerDsioDto.pathname;

      dayjs.extend(utc);
      dayjs.extend(timezone);
      dayjs.tz('Europe/Paris');

      // Récupération du groupe de travail
      const TRIGGER_CHECKS = 'FALSE';
      const groupId = orgId;
      await this.dataSource.query(`SET @groupid = ${groupId}`);
      await this.dataSource.query(`SET @TRIGGER_CHECKS = ${TRIGGER_CHECKS}`);

      // $em->getFilters()->enable('organization')->setParameter('organization_id', $groupId);

      // decodage utf-8
      const utf8 = true;

      // Gestion des familles patients
      const t_COF = [];

      // Récupération des types de téléphones
      const t_phone_type_pty = {};
      const phoneTypeResult: { PTY_NAME: number; PTY_ID: number }[] =
        await this.dataSource.query('select * from `T_PHONE_TYPE_PTY`');
      phoneTypeResult.map((item) => {
        t_phone_type_pty[item.PTY_NAME] = item.PTY_ID;
      });

      // Récupération des genres
      const t_gender_gen = {};
      const genderResult: { GEN_NAME: string; GEN_ID: number }[] =
        await this.dataSource.query('select * from `T_GENDER_GEN`');
      genderResult.map((item) => {
        t_gender_gen[item.GEN_NAME] = item.GEN_ID; // M, Mme, Mlle, M & Mme, Dr, Pr, Me
      });

      t_gender_gen['Mr'] = 1;
      t_gender_gen['M.'] = 1;
      t_gender_gen['Msieur'] = 1;
      t_gender_gen['Monsieur'] = 1;
      t_gender_gen['Madame'] = 2;
      t_gender_gen['Mademoiselle'] = 4;
      t_gender_gen['Melle'] = 4;
      t_gender_gen['Melle.'] = 4;
      t_gender_gen['Mlle.'] = 4;

      // Lien entre actes et bibliothèque d'actes
      const t_family_tasks = []; // Relation id familles d'actes DSIO => e.coo
      const t_library_family_task_lft = []; // Relation id actes DSIO => e.coo
      const t_dsio_tasks = {};
      const t_dsio_tasks_quantity = [];
      const t_dsio_dental_tasks_quantity = [];
      const LFT_ASSOCIATED_ACTS = {};
      const LFT_POS = 0;
      const LFY_ID = 0;
      const t_QD = {
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

      // Récupération des lettres clés
      const ngapKeys = {};
      const ngapKeyResult: { name: string; id: number }[] =
        await this.dataSource.query(
          'select * from ngap_key where organization_id = ?',
          [groupId],
        );
      ngapKeyResult.map((item) => {
        ngapKeys[item.name] = item.id;
      });

      const ccamStm = 'select id from ccam where code = ?';

      /**
       * Dernier rdv enregistré.
       * Si l'acte suivant appartient au même patient pour le même jour et le même praticien
       * on affecte ce nouvel acte à ce rdv.
       */
      const t_last_rdv = {
        EVT_START: '',
        CON_ID: 0,
        USR_ID: 0,
        EVT_ID: 0,
      };

      // Lien entre patients et contres-indications
      const T_CONTACT_CONTRAINDICATION_COC = [];
      const medicamentFamilies = [];

      // Liens sur les postits
      const T_POSTIT_PTT = [];

      // Décallage des dossiers patient pour fusion de plusieurs bases
      const max_CON_NBR = importerDsioDto.patient_number ?? 0;

      function reconnect(seconds = 5) {
        TRIGGER_CHECKS;

        // Import devenu très long
        // On tente de shunter cette fonction pour voir
        return;

        // $connection->close();
        // set_time_limit($seconds + 30);
        // sleep($seconds);
        // $connection->query("SET @groupid = $groupId");
        /*
          $connection->query("SET @TRIGGER_AFTER_INSERT_CHECKS = $TRIGGER_CHECKS");
          $connection->query("SET @TRIGGER_BEFORE_UPDATE_CHECKS = $TRIGGER_CHECKS");
          $connection->query("SET @TRIGGER_BEFORE_DELETE_CHECKS = $TRIGGER_CHECKS"); */
        // $connection->query("SET @TRIGGER_CHECKS = $TRIGGER_CHECKS");
        // $connection->query("SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0");
        // $connection->query("SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0");
        // $connection->query("SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL'");
      }

      function dsio_log(comment: string) {
        // global $filename;
        // file_put_contents("$filename.log", $comment, FILE_APPEND);
        fs.appendFileSync(`${filename}.log`, comment);
      }

      function detectUTF8(string: string): boolean {
        const pattern = new RegExp(
          `(?:
        (?:[\xC2-\xDF][\x80-\xBF]) # non-overlong 2-byte
        |(?:\xE0[\xA0-\xBF][\x80-\xBF]) # excluding overlongs
        |(?:[\xE1-\xEC\xEE\xEF][\x80-\xBF]{2}) # straight 3-byte
        |(?:\xE3\xA8) # è foireux
        |(?:\xED[\x80-\x9F][\x80-\xBF]) # excluding surrogates
        |(?:\xF0[\x90-\xBF][\x80-\xBF]{2}) # planes 1-3
        |(?:[\xF1-\xF3][\x80-\xBF]{3}) # planes 4-15
        |(?:\xF4[\x80-\x8F][\x80-\xBF]{2}) # plane 16
        )`,
          'gs',
        );

        return pattern.test(string);
      }

      const nth_record = 0;

      const handle_query: fs.WriteStream = fs.createWriteStream(
        `${filename}.json`,
      );

      function query_log(query: string) {
        handle_query.write(`${query};\n`);
      }

      // php/dsio/import_shell.php line 2755 ->
      // Lancement de l'importation
      //$connection->beginTransaction();
      await this.dataSource.query(
        'SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0',
      );
      await this.dataSource.query(
        'SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0',
      );
      await this.dataSource.query(
        "SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL'",
      );

      const dsio = {};
      try {
        this.dsioService.construct(
          filename,
          importerDsioDto,
          groupId,
          utf8,
          FRQ,
          HMD,
          HMF,
          HAD,
          HAF,
        );
        this.dsioService.import(
          filename,
          importerDsioDto,
          groupId,
          utf8,
          LFT_ASSOCIATED_ACTS,
          t_dsio_tasks,
        );

        // Mise à jour du numéro de dossier patient max.
        await this.dataSource.query(
          `
          UPDATE T_GROUP_GRP
          SET customer_max_number = (
            SELECT MAX(CON_NBR)
            FROM T_CONTACT_CON
            WHERE T_CONTACT_CON.organization_id = T_GROUP_GRP.GRP_ID
          )
          WHERE T_GROUP_GRP.GRP_ID = ?`,
          [groupId],
        );

        let i = 0;
        for (const family of t_COF) {
          fs.writeFileSync(
            `${filename}.json`,
            JSON.stringify({
              status: 1,
              action: 'Traitement des familles des patients',
              prc: (100 * i++) / t_COF.length,
            }),
          );

          if (family.length > 1) {
            // @TODO set_time_limit(60);
            const insertQuery = await this.dataSource.query(
              'INSERT /* LOW_PRIORITY */ INTO `T_CONTACT_FAMILY_COF` (`COF_ID`) VALUES (0)',
            );
            const COF_ID = insertQuery?.insertId;
            await this.dataSource.query(
              `UPDATE T_CONTACT_CON set COF_ID=${COF_ID} WHERE CON_ID in (${family.join(
                ',',
              )})`,
            );
          }
        }
      } catch (error) {
        fs.writeFileSync(`${filename}.err`, JSON.stringify(dsio));
        fs.writeFileSync(`${filename}.exc`, error);
        // @TODO: mail("support@ecoodentist.com", "Erreur d'import DSIO", "Erreur lors de l'import DSIO du fichier " . $filename . " a la ligne " . $dsio->noline . "\n" . file_get_contents($filename . ".json") . "\n\n$e");
        fs.writeFileSync(
          `${filename}.json`,
          JSON.stringify({
            status: -3,
            error:
              "Une erreur est survenue durant l'importation de votre fichier DSIO. Nous allons intervenir dessus le plus rapidement possible puis revenir vers vous.",
          }),
        );
        throw error;
        // @TODO die();
      }

      fs.writeFileSync(
        `${filename}.json`,
        JSON.stringify({
          status: 1,
          action: 'Validation des données',
          prc: 99.99,
        }),
      );
      //@TODO set_time_limit(30);
      await this.dataSource.query('SET SQL_MODE=@OLD_SQL_MODE');
      await this.dataSource.query(
        'SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS',
      );
      await this.dataSource.query('SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS');

      //@TODO set_time_limit(300);
      //$connection->commit();
      fs.writeFileSync(
        `${filename}.json`,
        JSON.stringify({
          status: 1,
          action: 'Opération terminée',
          prc: 100,
        }),
      );
    } catch (error) {
      throw new CBadRequestException(error);
    }
  }
}
