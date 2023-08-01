import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as path from 'path';
import {
  MOUTH_NUMBER,
  MOUTH_TEETH,
  MAXILLARY_NUMBER,
  MAXILLARY_TEETH,
  MANDIBULAR_NUMBER,
  MANDIBULAR_TEETH,
} from 'src/common/util/dental-format';
import { parseJson } from 'src/common/util/json';
import { checkNumber } from 'src/common/util/number';
import { CcamEntity } from 'src/entities/ccam.entity';
import { DentalQuotationEntity } from 'src/entities/dental-quotation.entity';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { UserEntity } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import {
  TherapeuticAlternativesJsonRes,
  TherapeuticAlternatives0Res,
  OrderByMaterialsMadeByPratitionerRes,
  TherapeuticAlternativesDataRes,
  MedicalTherapeuticAlternativeJsonRes,
  GetTherapeuticAlternativeRes,
} from '../res/therapeuticAlternative.res';
import * as fs from 'fs';

@Injectable()
export class TherapeuticAlternativeService {
  constructor(
    @InjectRepository(CcamEntity)
    private ccamRepository: Repository<CcamEntity>,
  ) {}
  /**
   * ecoophp/application/Service/TherapeuticAlternativeService.php 38 - 156
   * @param quote : DentalQuotationEntity
   * @returns
   */
  async getTherapeuticAlternative(
    quote: DentalQuotationEntity,
  ): Promise<GetTherapeuticAlternativeRes> {
    try {
      const jsonFile = fs.readFileSync(
        path.join(
          process.cwd(),
          'resources/json',
          'therapeutic_alternatives.json',
        ),
      );
      const therapeuticAlternatives = parseJson<TherapeuticAlternativesJsonRes>(
        jsonFile.toString(),
      );

      const therapeuticAlternatives0: TherapeuticAlternatives0Res[] = [];
      const therapeuticAlternativesM: TherapeuticAlternatives0Res[] = [];

      // On filtre les actes sur le nombre de dents ou sur le montant
      // de remboursement AMO ( Remboursable ).
      const actsFiltered = quote?.acts
        ? quote?.acts?.filter((act) => {
            return !act?.location || act?.secuAmount === null ? false : true;
          })
        : [];
      for await (const act of actsFiltered) {
        let therapeuticAlternativeZero: OrderByMaterialsMadeByPratitionerRes | null =
          null;
        let therapeuticAlternativeModere: OrderByMaterialsMadeByPratitionerRes =
          null;
        let therapeuticAlternative = {} as TherapeuticAlternativesDataRes;

        const toothNumbers = act?.location.split(',');

        toothNumbers.map((teeth, i, array) => {
          if (teeth == MOUTH_NUMBER) {
            array[i] = MOUTH_TEETH[0];
          }
          if (teeth == MAXILLARY_NUMBER) {
            array[i] = MAXILLARY_TEETH[0];
          }
          if (teeth == MANDIBULAR_NUMBER) {
            array[i] = MANDIBULAR_TEETH[0];
          }
        });

        const toothNumber = toothNumbers[0];
        const toothNumberPosition = toothNumbers[1];

        // ON VERIFIE SI IL EXISTE UNE ALTERNATIVE THERAPEUTIQUE
        if (!therapeuticAlternatives?.[toothNumberPosition]?.[act?.ngapCode]) {
          continue;
        } else {
          therapeuticAlternative =
            therapeuticAlternatives?.[toothNumberPosition]?.[act?.ngapCode];
        }

        if (therapeuticAlternative?.rac0) {
          const colection = await this.orderByMaterialsMadeByPratitioner(
            quote?.user,
            therapeuticAlternative?.rac0,
            checkNumber(toothNumberPosition),
          );
          therapeuticAlternativeZero = colection[0];
          const ccam = therapeuticAlternativeZero?.ccam;
          const actesDirecteurs =
            therapeuticAlternatives?.[toothNumberPosition]?.[ccam?.code]
              ?.Actes_Directeurs ?? [];

          therapeuticAlternatives0.push({
            act: act,
            ccam,
            tooth: toothNumber,
            position: toothNumberPosition,
            actesDirecteurs: actesDirecteurs,
            materialCode: therapeuticAlternativeZero.materialCode,
          });
        }

        if (therapeuticAlternative?.racm) {
          const colection = await this.orderByMaterialsMadeByPratitioner(
            quote?.user,
            therapeuticAlternative?.racm,
            checkNumber(toothNumberPosition),
          );
          therapeuticAlternativeModere = colection[0];
          if (
            this.isAlwaysShowModerateAlternative(quote) ||
            !therapeuticAlternativeZero ||
            (!therapeuticAlternativeZero.hasMaterialCode &&
              therapeuticAlternativeModere?.hasMaterialCode)
          ) {
            const ccam = therapeuticAlternativeModere?.ccam;
            const actesDirecteurs =
              therapeuticAlternatives?.[toothNumberPosition]?.[ccam?.code]
                ?.Actes_Directeurs ?? [];

            therapeuticAlternativesM.push({
              act: act,
              ccam,
              tooth: toothNumber,
              position: toothNumberPosition,
              actesDirecteurs: actesDirecteurs,
              materialCode: therapeuticAlternativeModere.materialCode,
            });
          }
        }
      }

      const data = {} as GetTherapeuticAlternativeRes;
      const therapeuticAlternatives0Filtered = this.filterByActesDirecteurs(
        therapeuticAlternatives0,
      );
      console.log(
        '🚀 ~ file: therapeuticAlternative.service.ts:152 ~ TherapeuticAlternativeService ~ therapeuticAlternatives0Filtered:',
        therapeuticAlternatives0Filtered,
      );
      if (!therapeuticAlternatives0Filtered.length) {
        this.indicatesIfMadeByPractitioner(
          quote,
          therapeuticAlternatives0Filtered,
        );
        data.rac0 = therapeuticAlternatives0Filtered;
      }

      const therapeuticAlternativesMFiltered = this.filterByActesDirecteurs(
        therapeuticAlternativesM,
      );
      if (!therapeuticAlternativesMFiltered.length) {
        this.indicatesIfMadeByPractitioner(
          quote,
          therapeuticAlternativesMFiltered,
        );
        data.racm = therapeuticAlternativesMFiltered;
      }

      return data;
    } catch (error) {}
  }

  /**
   * ecoophp/application/Service/TherapeuticAlternativeService.php 167 - 199
   * @param user : UserEntity
   * @param colections : string[]
   * @param toothNumberPosition : number
   * @returns
   */
  async orderByMaterialsMadeByPratitioner(
    user: UserEntity,
    colections: string[],
    toothNumberPosition: number,
  ): Promise<OrderByMaterialsMadeByPratitionerRes[]> {
    const therapeuticAlternative =
      this.getTherapeuticAlternativeMaterialsByPosition(
        user?.medical,
        toothNumberPosition,
      );
    let materialCode: number | null = null;
    const result: OrderByMaterialsMadeByPratitionerRes[] = [];
    for await (const [i, ccamCode] of colections.entries()) {
      const ccam = await this.ccamRepository.findOne({
        where: {
          code: ccamCode,
        },
        relations: {
          material: true,
          teeth: {
            material: true,
          },
          family: true,
        },
      });

      if (ccam?.material) {
        materialCode = ccam?.material?.code;
      } else if (ccam?.teeth && ccam?.teeth[0].material) {
        materialCode = ccam?.teeth[0]?.material?.code;
      }
      result.push({
        ccam,
        materialCode,
        hasMaterialCode: therapeuticAlternative.includes(`${materialCode}`),
      });
    }
    result.sort((a, b) => {
      return b.materialCode - a.materialCode;
    });
    return result;
  }

  /**
   * ecoophp/application/Service/TherapeuticAlternativeService.php  208 - 233
   * @param therapeuticAlternatives : TherapeuticAlternatives0Res[]
   * @returns TherapeuticAlternatives0Res[]
   */
  filterByActesDirecteurs(
    therapeuticAlternatives: TherapeuticAlternatives0Res[],
  ): TherapeuticAlternatives0Res[] {
    return therapeuticAlternatives.filter((item) => {
      const ccamCode = item?.ccam?.code;
      const actesDirecteurs = item?.actesDirecteurs;
      const tooth = item?.tooth;
      if (!this.hasActesDirecteurs(actesDirecteurs, ccamCode)) {
        return true;
      }

      return therapeuticAlternatives.reduce(
        (exists, therapeuticAlternative) => {
          const teeth = therapeuticAlternative?.act?.location.split(',') || [];
          return (
            exists ||
            (actesDirecteurs.includes(therapeuticAlternative?.ccam?.code) &&
              teeth.includes(tooth))
          );
        },
        false,
      );
    });
  }

  /**
   * ecoophp/application/Service/TherapeuticAlternativeService.php 241 - 280
   * @param quote : DentalQuotationEntity
   * @param therapeuticAlternatives : TherapeuticAlternatives0Res[]
   */
  indicatesIfMadeByPractitioner(
    quote: DentalQuotationEntity,
    therapeuticAlternatives: TherapeuticAlternatives0Res[],
  ) {
    const userMedical = quote?.user?.medical;

    therapeuticAlternatives.forEach((therapeuticAlternative, i) => {
      const checkTherapeuticAlternative =
        this.getTherapeuticAlternativeFamilies(userMedical).includes(
          therapeuticAlternative?.ccam?.family?.code,
        );
      if (checkTherapeuticAlternative) {
        therapeuticAlternative.madeByPractitioner = true;
        return;
      }
      const materialsMadeByPractitioners =
        this.getTherapeuticAlternativeMaterialsByPosition(
          userMedical,
          checkNumber(therapeuticAlternative.position),
        );
      const ccamCode = therapeuticAlternative?.ccam?.code;
      const actesDirecteurs = therapeuticAlternative?.actesDirecteurs;
      const tooth = therapeuticAlternative?.tooth;

      if (this.hasActesDirecteurs(actesDirecteurs, ccamCode)) {
        therapeuticAlternative.madeByPractitioner =
          therapeuticAlternatives.reduce((exits, therapeuticAlternative) => {
            return (
              exits ||
              (actesDirecteurs.includes(therapeuticAlternative?.ccam?.code) &&
                therapeuticAlternative?.act?.location.includes(tooth) &&
                materialsMadeByPractitioners.includes(
                  `${therapeuticAlternative?.materialCode}`,
                ))
            );
          }, false);
      } else {
        therapeuticAlternative.madeByPractitioner =
          materialsMadeByPractitioners?.includes(
            `${therapeuticAlternative?.materialCode}`,
          );
      }
    });
  }

  /**
   * ecoophp/application/Service/TherapeuticAlternativeService.php 289 - 292
   * @param actesDirecteurs : string[]
   * @param ccamCode : string
   * @returns boolean
   */
  hasActesDirecteurs(actesDirecteurs: string[], ccamCode: string): boolean {
    return !(
      !actesDirecteurs.length ||
      (actesDirecteurs.length === 1 && actesDirecteurs[0] === ccamCode)
    );
  }

  /**
   * ecoophp/application/Service/TherapeuticAlternativeService.php 299 304
   * @param quote : DentalQuotationEntity
   * @returns boolean
   */
  isAlwaysShowModerateAlternative(quote: DentalQuotationEntity) {
    const therapeuticAlternative =
      parseJson<MedicalTherapeuticAlternativeJsonRes>(
        quote?.user?.medical?.therapeuticAlternative,
      );
    return therapeuticAlternative?.moderate_alternative || false;
  }

  /**
   * ecoophp/application/Entity/UserMedical.php 230 - 263
   * @param medical : UserMedicalEntity
   * @param position : number
   * @returns MedicalTherapeuticAlternativeJsonRes
   */
  getTherapeuticAlternativeMaterialsByPosition(
    medical: UserMedicalEntity,
    position: number,
  ): string[] {
    const therapeuticAlternative =
      parseJson<MedicalTherapeuticAlternativeJsonRes>(
        medical?.therapeuticAlternative || '',
      );

    if (!therapeuticAlternative || !therapeuticAlternative?.materiaux) {
      return [];
    }

    const materiaux = therapeuticAlternative?.materiaux;
    if (position < 3) {
      return materiaux?.incisives ?? [];
    }
    if (position === 3) {
      return materiaux?.canines ?? [];
    }
    if (position === 4) {
      return materiaux?.premierePremolaire ?? [];
    }
    if (position === 5) {
      return materiaux?.deuxiemePremolaire ?? [];
    }
    return materiaux?.molaires ?? [];
  }

  getTherapeuticAlternativeFamilies(medical: UserMedicalEntity): string[] {
    const therapeuticAlternative =
      parseJson<MedicalTherapeuticAlternativeJsonRes>(
        medical?.therapeuticAlternative || '',
      );
    if (!therapeuticAlternative || !therapeuticAlternative?.families) {
      return [];
    }
    return therapeuticAlternative?.families;
  }
}
