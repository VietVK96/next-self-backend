import * as fs from 'fs';
import * as readline from 'readline';
import * as events from 'events';
import { SectionsDto } from '../dto/sections.dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';

/**
 * php/dsio/sections.php
 */
export class SectionsDsio {
  private ar_list: SectionsDto = {};
  private Flag_new_prat = 'PN1';
  private Flag_resource = 'PR1';

  /**
   * php/dsio/sections.php line 44 -> 117
   */
  async getList(filename: string): Promise<SectionsDto> {
    if (!fs.existsSync(filename)) return null;

    // Practitioner Chapter Beginning and Ending Tags
    let ESCB = false;
    let ESCC = false;
    // file read buffers
    let CHP = '';
    let VAL = '';
    let RSR = false; // is the designated entity a practitioner or a calendar resource
    let ar_prat_cur = {}; // prat data buffer

    try {
      const fileStream = fs.createReadStream(filename);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
        terminal: false,
      });

      rl.on('line', (line) => {
        if (ESCC) rl.close();

        const buffer = line;
        if (!buffer) ESCC = true; // Reading issue
        else {
          switch (buffer[0]) {
            // Check line type
            case String.fromCharCode(27): // Chapter start
              if (buffer[1] !== 'A') {
                ESCB = buffer[1] === 'B'; // Chapter practitioners: start to gather info
                ESCC = buffer[1] !== 'B'; // Next chapter, stop looping
              }
              break;
            case '#': // Data line
              CHP = buffer.substring(1, 4); // Type of data
              VAL = buffer.substring(4).trim(); // Data
              if (CHP === this.Flag_resource) {
                RSR = true;
              }
              break;
            default: // Unknown line
              CHP = '';
              VAL = '';
          }
          if (ESCB) {
            // We have a line to process in the chapter
            if (CHP === this.Flag_new_prat) {
              this.newEntitie(ar_prat_cur, RSR);
              ar_prat_cur = {};
              RSR = false;
            }
            ar_prat_cur[CHP] = VAL; // We save the data
          }
        }
      });

      rl.on('close', () => {
        fileStream.close();
      });

      await events.once(rl, 'close');

      this.newEntitie(ar_prat_cur, RSR);
      return this.ar_list;
    } catch (error) {
      throw new CBadRequestException(error.message);
    }
  }

  /**
   * php/dsio/sections.php line 17-> 42
   */
  public newEntitie(ar_prat_cur: { [key: string]: string }, RSR: boolean) {
    if (ar_prat_cur['PN1']) {
      // the entity is a practitioner
      if (!RSR) {
        // Check for the existence of the PC1 tag
        if (ar_prat_cur['PC1']) {
          // Initialize Praticiens if it doesn't exist
          if (!this.ar_list['Praticiens']) {
            this.ar_list['Praticiens'] = { sources: [], targets: [] };
          }

          this.ar_list['Praticiens']['sources'].push({
            id: ar_prat_cur['PC1'],
            name:
              ar_prat_cur['PN1'] +
              ' ' +
              ar_prat_cur['PP1'] +
              ' ' +
              ar_prat_cur['PO1'],
          });
        }
      } else {
        // the entity is an agenda resource

        // Initialize Agendas if it doesn't exist
        if (!this.ar_list['Agendas']) {
          this.ar_list['Agendas'] = { sources: [], targets: [] };
        }

        this.ar_list['Agendas']['sources'].push({
          id: ar_prat_cur['PR1'],
          name: ar_prat_cur['PN1'],
        });
      }
    }
  }
}
