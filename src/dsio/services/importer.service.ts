import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ImporterDsioDto } from '../dto/importer-dsio.dto';
import * as fs from 'fs';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ImportDsioService } from './import-dsio.service';
import { HandleDsioService } from './handle-dsio.service';

/**
 * php/dsio/import_shell.php
 */
@Injectable()
export class ImporterService {
  constructor(
    private dataSource: DataSource,
    private dsioService: ImportDsioService,
    private handleDsioService: HandleDsioService,
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

      // Récupération du groupe de travail
      const TRIGGER_CHECKS = 'FALSE';
      const groupId = orgId;
      await this.dataSource.query(`SET @groupid = ${groupId}`);
      await this.dataSource.query(`SET @TRIGGER_CHECKS = ${TRIGGER_CHECKS}`);

      // decodage utf-8
      const utf8 = true;

      // Gestion des familles patients
      const t_COF: Record<string, number[]> = {};

      // php/dsio/import_shell.php line 63 -> 69
      // Récupération des types de téléphones
      const t_phone_type_pty: Record<string, number> = {};
      const phoneTypeResult: { PTY_NAME: string; PTY_ID: number }[] =
        await this.dataSource.query(
          'select PTY_NAME, PTY_ID from T_PHONE_TYPE_PTY',
        );
      phoneTypeResult.forEach((item) => {
        t_phone_type_pty[item.PTY_NAME] = item.PTY_ID;
      });

      // php/dsio/import_shell.php line 71 -> 86
      // Récupération des genres
      const t_gender_gen: Record<string, number> = {};
      const genderResult: { GEN_NAME: string; GEN_ID: number }[] =
        await this.dataSource.query('select * from `T_GENDER_GEN`');
      genderResult.forEach((item) => {
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
      const t_dsio_tasks:
        | Record<string, string>
        | Record<string, Record<string, number>> = {};
      const LFT_ASSOCIATED_ACTS: Record<string, string> = {};

      // Récupération des lettres clés
      const ngapKeys: Record<string, number> = {};
      const ngapKeyResult: { name: string; id: number }[] =
        await this.dataSource.query(
          'select * from ngap_key where organization_id = ?',
          [groupId],
        );
      ngapKeyResult.forEach((item) => {
        ngapKeys[item.name] = item.id;
      });

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

      try {
        await this.handleDsioService.construct(
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
        await this.dsioService.importShell(
          filename,
          importerDsioDto,
          groupId,
          utf8,
          LFT_ASSOCIATED_ACTS,
          t_dsio_tasks,
          t_COF,
          t_gender_gen,
          t_phone_type_pty,
          ngapKeys,
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

        const tCOFLength = Object.keys(t_COF).length;
        let i = 0;
        for (const family of Object.values(t_COF)) {
          fs.writeFileSync(
            `${filename}.json`,
            JSON.stringify({
              status: 1,
              action: 'Traitement des familles des patients',
              prc: (100 * i++) / tCOFLength,
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
        fs.writeFileSync(`${filename}.exc`, JSON.stringify(error.message));
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
      console.log(error?.response?.msg || error?.sqlMessage);
      throw new CBadRequestException(error?.response?.msg || error?.sqlMessage);
    }
  }
}
