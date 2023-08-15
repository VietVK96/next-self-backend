import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import * as soap from 'soap';
import { tabConversion } from 'src/constants/medicament-database';
import { UserEntity } from 'src/entities/user.entity';
import {
  FindDetailMedicamentDatabaseDto,
  FindMedicamentDatabaseDto,
} from '../dtos/medicament-database.dto';
import {
  FindMedicamentDatabaseContraindicationRes,
  FindMedicamentDatabaseRes,
} from '../res/medicament-database.res';
import { ContactEntity } from 'src/entities/contact.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ContraindicationEntity } from 'src/entities/contraindication.entity';

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

  async findDetailMedicamentDatabase(
    organizationId: number,
    userId: number,
    query: FindDetailMedicamentDatabaseDto,
  ) {
    const { produitId, patientId } = query;
    try {
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
      const infos = await claudeBernard?.getInformationProduitParamAsync({
        key: {
          codeEditeur: process.env.CLAUDE_BERNARD_CODE_EDITEUR,
          idPS: claudeBernardLicence,
          secretEditeur: this._generateKey(
            process.env.CLAUDE_BERNARD_CODE_EDITEUR,
            claudeBernardLicence,
          ),
        },
        idProduit: produitId,
        mode: 0,
        param: {
          activeGlossaire: false,
          loadClassesBCB: true,
          loadCompositionProduit: true,
          loadDonneesTechReg: true,
          loadFamillesBCB: true,
          loadFicheIdentiteInteroperable: true,
          loadFormePresentation: true,
          loadLaboratoires: true,
          loadMotsClefs: true,
          loadPharmacies: true,
          loadMonographie: false,
        },
      });

      const posologieCompleteParamters = {
        idProduit: produitId,
        profilPatient: {
          age: null,
          allaitement: null,
          clairanceCreatinine: null,
          creatininemieMg: null,
          creatininemieMol: null,
          grossesse: null,
          poids: null,
          taille: null,
        },
      };

      if (patientId) {
        const profilPatientQueryBuilder = this.dataSource
          .getRepository(ContactEntity)
          .createQueryBuilder('con');
        profilPatientQueryBuilder.select(
          'TIMESTAMPDIFF(MONTH , con.birthday, DATE(CURRENT_TIMESTAMP())) as age',
        );
        profilPatientQueryBuilder.addSelect('con.breastfeeding as allaitement');
        profilPatientQueryBuilder.addSelect('con.pregnancy as grossesse');
        profilPatientQueryBuilder.addSelect(
          'con.clearanceCreatinine as clairanceCreatinine',
        );
        profilPatientQueryBuilder.addSelect(
          'con.hepaticInsufficiency as insuffisanceHepatique',
        );
        profilPatientQueryBuilder.addSelect('con.weight as poids');
        profilPatientQueryBuilder.addSelect('con.size as taille');
        profilPatientQueryBuilder.addSelect('gen.type as sexe');
        profilPatientQueryBuilder.leftJoin('con.gender', 'gen');
        profilPatientQueryBuilder.where('con.id = :patientId', { patientId });
        profilPatientQueryBuilder.andWhere('con.group = :organizationId', {
          organizationId,
        });
        const profilPatients = await profilPatientQueryBuilder.getRawMany();
        const profilPatient = profilPatients[0];
        profilPatient['lstIdComposantAllergie'] = [];
        profilPatient['lstPathologiesAMM'] = [];
        profilPatient['lstPathologiesCIM10'] = [];
        const contactContraindication = await this.dataSource.query(`
          SELECT *
          FROM T_CONTACT_CONTRAINDICATION_COC
          WHERE T_CONTACT_CONTRAINDICATION_COC.CON_ID = ${patientId}
        `);
        const listContraindication = contactContraindication.map(
          (item) => item?.MLC_ID,
        );

        const contraindications = await this.dataSource
          .getRepository(ContraindicationEntity)
          .find({ where: { id: In(listContraindication) } });
        for (const contraindication of contraindications) {
          switch (contraindication?.bcbdextherType) {
            case 4096:
              profilPatient.lstIdComposantAllergie.push(
                contraindication?.bcbdextherId,
              );
              break;
            case 16384:
              profilPatient.lstPathologiesAMM.push(
                contraindication?.bcbdextherId,
              );
              break;
            case 32768:
              profilPatient.lstPathologiesCIM10.push(
                contraindication?.bcbdextherId,
              );
              break;
          }
        }

        profilPatient['creatininemieMg'] = 0;
        profilPatient['creatininemieMol'] = 0;

        posologieCompleteParamters['profilPatient'] = profilPatient;

        const rechercheEquivalentsRes =
          await claudeBernard?.rechercheEquivalentsAsync({
            key: {
              codeEditeur: process.env.CLAUDE_BERNARD_CODE_EDITEUR,
              idPS: claudeBernardLicence,
              secretEditeur: this._generateKey(
                process.env.CLAUDE_BERNARD_CODE_EDITEUR,
                claudeBernardLicence,
              ),
            },
            idProduit: produitId,
          });

        const rechercheEquivalents = rechercheEquivalentsRes[0].searchResult;

        if (
          rechercheEquivalents?.lstEquivalentsStricts ||
          rechercheEquivalents?.lstEquivalentsProches ||
          rechercheEquivalents?.lstEquivalentsAutres
        ) {
          infos[0].produitResult.substituable = true;
          infos[0].produitResult.substituableExcipient = [];

          if (infos[0]?.produitResult?.lstExcipients) {
            for (const excipient of infos[0]?.produitResult?.lstExcipients) {
              if (
                excipient?.effetNotoire &&
                (profilPatient?.lstIdComposantAllergie.include(excipient?.id) ||
                  profilPatient?.lstPathologiesAMM.include(excipient?.id) ||
                  profilPatient?.lstPathologiesCIM10.include(excipient?.id))
              ) {
                infos[0].produitResult.substituableExcipient.push(excipient);
              }
            }
          }
        }
      }

      infos[0].produitResult['lstPosologies'] = [];
      const posologieCompleteRes =
        await claudeBernard?.getPosologieCompleteAsync({
          key: {
            codeEditeur: process.env.CLAUDE_BERNARD_CODE_EDITEUR,
            idPS: claudeBernardLicence,
            secretEditeur: this._generateKey(
              process.env.CLAUDE_BERNARD_CODE_EDITEUR,
              claudeBernardLicence,
            ),
          },
          ...posologieCompleteParamters,
        });
      const posologieComplete = posologieCompleteRes[0]?.searchResult;

      if (posologieComplete?.lstPosologies) {
        let idx;
        if (posologieComplete?.posologieUsuelle) {
          for (const [key, posologie] of Object.entries(
            posologieComplete?.lstPosologies as object,
          )) {
            if (
              posologieComplete?.posologieUsuelle?.noPosologie ===
              posologie?.noPosologie
            ) {
              idx = key;
              break;
            }
          }
          posologieComplete?.lstPosologies.splice(
            0,
            0,
            posologieComplete?.lstPosologies.splice(idx, 1),
          );
        }
        posologieComplete.lstPosologies[0]['selected'] = true;
        infos[0].produitResult.lstPosologies = posologieComplete?.lstPosologies;
      }
      return infos[0]?.produitResult;
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }
}
