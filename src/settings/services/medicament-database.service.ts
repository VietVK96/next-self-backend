import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as soap from 'soap';
import { tabConversion } from 'src/constants/medicament-database';
import { UserEntity } from 'src/entities/user.entity';
import { FindMedicamentDatabaseDto } from '../dtos/medicament-database.dto';
import {
  FindMedicamentDatabaseContraindicationRes,
  FindMedicamentDatabaseRes,
} from '../res/medicament-database.res';

@Injectable()
export class MedicamentDatabaseService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  private _generateKey(codeEditeur: string, idPS: string) {
    const currentDate = new Date();
    const curYear = currentDate.getFullYear();
    const curMonth = currentDate.getMonth() + 1;
    const curDay = currentDate.getDate();
    const chaineACoder = curMonth + codeEditeur + idPS + curYear + curDay;
    let chaineCodee = '';
    let codeSecurite = '';

    for (let i = 0; i < chaineACoder.length; i++) {
      chaineCodee += tabConversion[chaineACoder.charCodeAt(i)];
    }

    for (let i = 2; i < chaineCodee.length; i += 3) {
      codeSecurite += chaineCodee.charAt(i);
    }

    return codeSecurite;
  }

  async connnectMedicamentDatabase(userId: number) {
    const wsdlUrl =
      'https://www.bcbdexther.fr/wsdl/BCBDexther-integrateurs-full.wsdl';
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const claudeBernardLicence = user?.bcbLicense;
    const claudeBernard = await soap.createClientAsync(wsdlUrl);
    const resultTest = await claudeBernard?.testConnexionAsync({
      key: {
        codeEditeur: process.env.CLAUDE_BERNARD_CODE_EDITEUR,
        idPS: claudeBernardLicence,
        secretEditeur: this._generateKey(
          process.env.CLAUDE_BERNARD_CODE_EDITEUR,
          claudeBernardLicence,
        ),
      },
    });
    return {
      claudeBernardStatutConnexion:
        resultTest[0]?.result?.statutConnexion === 1,
      claudeBernardStatutConnexionLibelle:
        resultTest[0]?.result?.statutConnexionLibelle,
    };
  }

  async findMedicamentDatabase(
    userId: number,
    query: FindMedicamentDatabaseDto,
  ): Promise<
    FindMedicamentDatabaseContraindicationRes[] | FindMedicamentDatabaseRes[]
  > {
    const wsdlUrl =
      'https://www.bcbdexther.fr/wsdl/BCBDexther-integrateurs-full.wsdl';
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const claudeBernardLicence = user?.bcbLicense;
    const claudeBernard = await soap.createClientAsync(wsdlUrl);
    const resultTest = await claudeBernard.testConnexionAsync({
      key: {
        codeEditeur: process.env.CLAUDE_BERNARD_CODE_EDITEUR,
        idPS: claudeBernardLicence,
        secretEditeur: this._generateKey(
          process.env.CLAUDE_BERNARD_CODE_EDITEUR,
          claudeBernardLicence,
        ),
      },
    });

    if (resultTest[0]?.result?.statutConnexion < 1) {
      throw new BadRequestException(
        resultTest[0]?.result?.statutConnexionLibelle,
      );
    }

    const claudeBernardSearchResult = await claudeBernard?.rechercheBCBAsync({
      key: {
        codeEditeur: process.env.CLAUDE_BERNARD_CODE_EDITEUR,
        idPS: claudeBernardLicence,
        secretEditeur: this._generateKey(
          process.env.CLAUDE_BERNARD_CODE_EDITEUR,
          claudeBernardLicence,
        ),
      },
      query: query?.query,
      type: query?.type ?? 53248,
      baseLocation: query?.baseLocation ?? 2,
    });

    const data: any[] = [];

    for (const [key, value] of Object.entries(
      claudeBernardSearchResult[0]?.searchResult,
    )) {
      if (Array.isArray(value)) {
        value.forEach((x) => {
          data.push({
            ...x,
            listName: key,
          });
        });
      } else if (typeof value === 'object') {
        data.push({
          ...value,
          listName: key,
        });
      }
    }

    return data;
  }
}
