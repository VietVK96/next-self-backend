import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ConfigService {
  private _utf8Setting = true;
  private _t_gender_gen: { [key: string]: number };

  constructor(private dataSource: DataSource) {
    this.setGenderGen();
  }

  get utf8Setting(): boolean {
    return this._utf8Setting;
  }

  set utf8Setting(value: boolean) {
    this._utf8Setting = value;
  }

  get tGenderGen(): any {
    return this._t_gender_gen;
  }

  async setGenderGen() {
    try {
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

      this._t_gender_gen = t_gender_gen;
    } catch (error) {}
  }
}
