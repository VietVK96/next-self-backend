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
   * php/dsio/import_shell.php line 5 -> 205, line 2755 -> 2814
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

      // decodage utf-8
      const utf8 = true;

      // Gestion des familles patients
      const t_COF = [];

      // Lien entre actes et bibliothèque d'actes
      const t_dsio_tasks = {};
      const LFT_ASSOCIATED_ACTS = {};

      // php/dsio/import_shell.php line 2755 -> 2814
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
        await this.dsioService.construct(
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
        await this.dsioService.import(
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
