import { Injectable } from '@nestjs/common';
import { ImporterDsioDto } from '../dto/importer-dsio.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { HandleDsioService } from './handle-dsio.service';
import { AmountDsioService } from './amount-dsio.service';

/**
 * php/dsio/import_shell.php line 1697 ->
 */
@Injectable()
export class ImportDsioService {
  constructor(
    private handleDsioService: HandleDsioService,
    private amountDsioService: AmountDsioService,
  ) {}

  // php/dsio/import_shell.php line 2665 -> 2751
  // Lancement de la procédure d'importation du fichier DSIO
  async importShell(
    filename: string,
    payload: ImporterDsioDto,
    groupId: number,
    utf8: boolean,
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
      this.handleDsioService.debut = Date.now() * 1000;
      const rl = readline.createInterface({
        input: this.handleDsioService.handle,
        crlfDelay: Infinity,
      });

      let linePos = 0;
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
        linePos += Buffer.from(buffer).length + 1;
        this.handleDsioService.getLine(buffer, utf8, linePos);

        if (buffer) {
          switch (buffer[0]) {
            case String.fromCharCode(27): // on est en train de changer de section
              if (
                !(await this.handleDsioService.newSection(
                  buffer[1],
                  linePos,
                  groupId,
                  payload.patient_number,
                  LFT_ASSOCIATED_ACTS,
                  t_dsio_tasks,
                  t_COF,
                  t_gender_gen,
                  t_phone_type_pty,
                  ngapKeys,
                ))
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
              await this.amountDsioService.checkDiezLine(
                buffer,
                payload.patient_number ?? 0,
                groupId,
                t_dsio_tasks,
                LFT_ASSOCIATED_ACTS,
                t_COF,
                t_gender_gen,
                t_phone_type_pty,
                ngapKeys,
              );
              break;
            default:
              if (this.handleDsioService.esc('A')) {
                // entête : on ne fait rien de spécial sinon détecter un import étendu de pomdadent
                if (buffer.substring(0, 9) === 'POMDADENT') {
                  // On doit accepter l'import étendu
                  this.handleDsioService.importEtendu = true;
                }
                if (buffer.substring(0, 7) === 'MacDent') {
                  // On doit importer les actes spécifiques de MacDent
                  this.handleDsioService.actesMacDent = true;
                }
                if (buffer.substring(0, 6) === 'Agatha') {
                  // On doit importer les actes spécifiques de MacDent
                  this.handleDsioService.actesAgatha = true;
                }
                if (buffer.substring(0, 14) === 'Dental-On-Line') {
                  // On doit importer les actes spécifiques de Dental-On-Line
                  this.handleDsioService.actesDentalOnLine = true;
                }
                if (buffer.substring(0, 9) === 'visiodent') {
                  // On doit supprimer les accents dans les prénoms
                  this.handleDsioService.importEtendu = true;
                }
              }
              if (this.handleDsioService.esc('G')) {
                // compta : on ne fait rien de spécial
              }
          }
        }
      }
      const rapport = {
        status: 1,
        action: this.handleDsioService.section[this.handleDsioService.ESC],
        prc: 99.99,
        noline: ++this.handleDsioService.noline,
        line: buffer,
        time: Date.now() * 1000 - this.handleDsioService.debut,
      };
      fs.writeFileSync(
        this.handleDsioService.json.path,
        JSON.stringify(rapport),
      );
      this.handleDsioService.json = null;

      /* Fin de fichier */
      if (this.handleDsioService.curObj != null) {
        if (this.handleDsioService.esc('M')) {
          /* Il faut enregistrer un dernier médicament */
          await this.handleDsioService.curObj.insertMedicament(groupId);
        } else if (this.handleDsioService.esc('N')) {
          /* Il faut enregistrer un dernier correspondant */
          await this.handleDsioService.curObj.setCorrespondent(
            groupId,
            t_gender_gen,
          );
        } else if (this.handleDsioService.esc('O')) {
          /* Il faut enregistrer un dernier compte bancaire */
          await this.handleDsioService.curObj.setBnq(
            this.handleDsioService.Id_prat,
            groupId,
          );
        }
      }
    } catch (error) {
      fs.writeFileSync(`${filename}.exc`, JSON.stringify(error.message));
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
