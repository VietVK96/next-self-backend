import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, sheets_v4 as SheetsV4, Auth } from 'googleapis';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { parseJson } from 'src/common/util/json';
import * as flat from 'flat';
import { LocaleConfig } from '../interface/laguage.interface';
import { globSync } from 'fast-glob';
import { extract } from '@formatjs/cli-lib';
import { exec } from 'child_process';

@Injectable()
export class LanguageService {
  constructor(private configService: ConfigService) {}

  async updateStatus(sheetId: string, sheets: SheetsV4.Sheets, status: string) {
    const data = {
      range: 'Note!A8:A8',
      values: [[status]],
    };
    const resource = {
      spreadsheetId: sheetId,
      valueInputOption: 'USER_ENTERED',
      range: 'Note!A8:A8',
      requestBody: data,
    };
    await sheets.spreadsheets.values.update(resource);
  }

  async updateLang() {
    const folderFrontend = this.configService.get<string>('app.folderFrontend');
    if (!folderFrontend || folderFrontend === '') {
      throw new CBadRequestException('Can not found folder frontend');
    }

    const auth: Auth.GoogleAuth = new google.auth.GoogleAuth({
      keyFile: join(process.cwd(), './credentials.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets: SheetsV4.Sheets = google.sheets({
      version: 'v4',
      auth,
    });

    const files = globSync(`./src/**/*.{tsx,ts}`, {
      ignore: ['src/**/*.d.ts'],
    });
    const dlExtract = parseJson<Record<string, any>>(await extract(files, {}));

    const localeConfig: LocaleConfig = require(join(
      folderFrontend,
      './src/locales/locale.json',
    ));
    const localesMessage = require(join(
      folderFrontend,
      './src/locales/config-path.json',
    ));
    const defaultLanguage = localeConfig.lang.find((l) => l.isDefault);

    this.updateStatus(localeConfig.sheetRootId, sheets, 'updating');
    for (const lang of localeConfig.lang) {
      const jsonExtract = {
        ...dlExtract,
      };

      const rows = [['Title', 'Value']];

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: localeConfig.sheetRootId,
        range: lang.sheetName,
      });
      const oldRows = res.data?.values ?? [];
      if (oldRows && oldRows.length > 2) {
        oldRows.shift();
      }

      const jsonFlat: Record<string, string> = {};
      const jsonMessage: Record<string, string> = {};
      oldRows.map((row) => {
        const k = row[0];
        const v = row[1];
        jsonFlat[k] = v;
      });

      for (const [keyFileLang, fileLang] of Object.entries<string>(
        localesMessage,
      )) {
        const localeMessageDefault = require(join(
          folderFrontend,
          './src/locales',
          defaultLanguage.localeName,
          fileLang,
        ));
        const localeMessageDefaultFlat = flat.flatten<any, string>(
          localeMessageDefault,
        );
        const file = join(
          folderFrontend,
          './src/locales/',
          lang.localeName,
          fileLang,
        );
        const messages = require(file);
        const flatMessage = flat.flatten(messages);

        for (const [key, value] of Object.entries<string>(
          localeMessageDefaultFlat,
        )) {
          const keyOfGoole = `${keyFileLang}.${key}`;

          // If language don't exits load from default
          if (lang.localeName !== defaultLanguage.localeName) {
            if (!flatMessage[key]) {
              flatMessage[key] = value;
            }
          }

          if (jsonFlat[keyOfGoole]) {
            flatMessage[key] = jsonFlat[keyOfGoole];
            jsonMessage[keyOfGoole] = jsonFlat[keyOfGoole];
            delete jsonFlat[keyOfGoole];
          } else {
            jsonMessage[keyOfGoole] = flatMessage[key];
          }

          if (jsonExtract[keyOfGoole]) {
            delete jsonExtract[keyOfGoole];
          }
        }

        for (const [key, value] of Object.entries<string>(jsonFlat)) {
          const kFile = key.split('.');
          if (kFile[0] === keyFileLang) {
            const keyFile = kFile.slice(1).join('.');
            jsonMessage[key] = value;
            flatMessage[keyFile] = value;
            delete jsonFlat[key];
            if (jsonExtract[key]) {
              delete jsonExtract[key];
            }
          }
        }

        for (const [kFileDump, vDump] of Object.entries(jsonExtract)) {
          const kFile = kFileDump.split('.');
          if (kFile[0] === keyFileLang) {
            const keyFile = kFile.slice(1).join('.');
            jsonMessage[kFileDump] = vDump;
            flatMessage[keyFile] = vDump;
            delete jsonExtract[kFileDump];
          }
        }

        await this.formatFile(file, flatMessage as Record<string, string>);
      }

      for (const kLang in jsonMessage) {
        rows.push([kLang, jsonMessage[kLang]]);
      }

      const data = {
        range: lang.sheetName,
        values: rows,
      };
      const resource = {
        spreadsheetId: localeConfig.sheetRootId,
        valueInputOption: 'USER_ENTERED',
        range: lang.sheetName,
        requestBody: data,
      };

      await sheets.spreadsheets.values.update(resource);
    }

    try {
      await exec('./deploy.sh', { cwd: folderFrontend });
      this.updateStatus(localeConfig.sheetRootId, sheets, 'done');
    } catch (e) {
      console.error(e);
      this.updateStatus(localeConfig.sheetRootId, sheets, 'error');
    }
    console.log('localeConfig', localeConfig);
    return localeConfig;
  }

  async formatFile(fileName: string, messages: Record<string, string>) {
    writeFileSync(fileName, JSON.stringify(messages, null, 2));
  }
}
