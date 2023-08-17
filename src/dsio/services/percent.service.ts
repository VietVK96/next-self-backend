import { Injectable } from '@nestjs/common';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from 'src/constants/error';

@Injectable()
export class PercentService {
  constructor(private configService: ConfigService) {}

  /**
   * File php/dsio/percent.php -> full
   */
  async getPercent(pathname: string) {
    try {
      if (pathname) {
        pathname = `${pathname}.json`;

        if (!fs.existsSync(pathname)) {
          const dir = await this.configService.get('app.uploadDir');
          pathname = path.join(dir, pathname);
        }

        const time = Math.floor(Date.now() / 1000) + 3;

        while (
          Math.floor(Date.now() / 1000) < time &&
          !fs.existsSync(pathname)
        ) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        if (fs.existsSync(pathname)) {
          let content: string;
          while (!content) {
            content = fs.readFileSync(pathname, 'utf8');
          }

          return JSON.parse(content);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 2000));

          if (fs.existsSync(pathname)) {
            let content: string;
            while (!content) {
              content = fs.readFileSync(pathname, 'utf8');
            }

            return JSON.parse(content);
          } else {
            return {
              status: -2,
              error: "Problème d'accès au fichier DSIO",
              pathname: pathname,
            };
          }
        }
      } else {
        return {
          status: -1,
          error: 'Pathname indéfini',
        };
      }
    } catch (error) {
      throw new CBadRequestException(ErrorCode.ERROR_GET_PERCENT_IMPORT, {
        status: -1,
        error: error?.response?.msg,
      });
    }
  }
}
