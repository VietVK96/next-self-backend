import { Injectable } from '@nestjs/common';
import { ConfigService } from './config.service';
import { DataSource } from 'typeorm';

@Injectable()
export class DsioElemService {
  private currentQuery = '';
  private utf8 = true;
  private ATE: string[] = []; // tableau des numéro s de téléphne supplémentaire dans MacDent
  private nth_record = 0;

  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  construct(bname: string, value: string) {
    this.setInfo(bname, value);
  }

  setInfo(bname: string, value: any) {
    const utf8 = this.configService.utf8Setting;
    this.configService.utf8Setting = true;
    if (!value) {
      if (bname === 'FCF') {
        this[bname] = '0';
      } else if (bname === 'SNC') {
        this[bname] = '0';
      } else if (bname === 'ATE') {
        this.ATE.push(value);
      }
    } else {
      if (typeof value === 'string' && value.indexOf('\r') !== -1) {
        value = value.substring(0, value.indexOf('\r'));
      }
      this[bname] = value;
    }
  }
}
