import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DsioConfigService {
  private t_gender_gen: { [key: string]: number };
  private t_phone_type_pty: { [key: string]: number };

  constructor(private dataSource: DataSource) {
    this.setGenderGen();
    this.setPhoneTypePTY();
  }

  get tGenderGen() {
    return this.t_gender_gen;
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

      this.t_gender_gen = t_gender_gen;
    } catch (error) {
      throw error;
    }
  }

  async setPhoneTypePTY() {
    try {
      // Récupération des types de téléphones
      const t_phone_type_pty = {};
      const phoneTypeResult: { PTY_NAME: number; PTY_ID: number }[] =
        await this.dataSource.query(
          'select PTY_NAME, PTY_ID from T_PHONE_TYPE_PTY',
        );
      phoneTypeResult.map((item) => {
        t_phone_type_pty[item.PTY_NAME] = item.PTY_ID;
      });
      this.t_phone_type_pty = t_phone_type_pty;
    } catch (error) {
      throw error;
    }
  }

  get tPhoneTypePTY() {
    return this.t_phone_type_pty;
  }

  async getNgapkeysByGroupId(groupId: number): Promise<Record<string, number>> {
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

    return ngapKeys;
  }
}
