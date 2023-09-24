import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { DataSource } from 'typeorm';
import { BcbDto, BcbFindOneDto } from '../dto/bcb.dto';
import { ClaudeBernardService } from './claudeBernard.Service';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { FindOneBcbInfosRes } from '../res/FindOneBcbRes';
import { checkId } from 'src/common/util/number';
import { ContactEntity } from 'src/entities/contact.entity';
import { UserIdentity } from 'src/common/decorator/auth.decorator';

@Injectable()
export class BcbServices {
  constructor(
    private claudeBernardService: ClaudeBernardService,
    private dataSource: DataSource,
    @InjectRepository(ContactEntity)
    private readonly contactRepo: Repository<ContactEntity>,
  ) {}
  //ecoophp/php/bcb/findAll.php
  async findAll(payload: BcbDto) {
    try {
      this.claudeBernardService.setIdPS(payload?.license?.toString());
      const claudeBernardSearchResult = await this.claudeBernardService?.call();
      const key = {
        codeEditeur: this.claudeBernardService.codeEditeur,
        idPS: this.claudeBernardService.idPS,
        secretEditeur: this.claudeBernardService.generateKey(),
      };
      delete payload?.license;
      const result = new Promise((resolve, reject) => {
        claudeBernardSearchResult.rechercheBCB(
          {
            key,
            ...payload,
          },
          (error, res) => {
            if (error) {
              reject(error); // Handle the error appropriately
            } else {
              resolve(res); // Process the SOAP response
            }
          },
        );
      });
      // handle result has in frontend : bcbConvert()  function
      return await result;
    } catch (error) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
  }

  //php/bcb/prescription/find.php
  async findOne(payload: BcbFindOneDto, identity: UserIdentity) {
    try {
      this.claudeBernardService.setIdPS(payload?.license?.toString());
      const claudeBernardSearchResult = await this.claudeBernardService?.call();
      const key = {
        codeEditeur: this.claudeBernardService.codeEditeur,
        idPS: this.claudeBernardService.idPS,
        secretEditeur: this.claudeBernardService.generateKey(),
      };
      delete payload?.license;
      const infos: FindOneBcbInfosRes = await new Promise((resolve, reject) => {
        // Récupération des informations du produit.
        claudeBernardSearchResult.getInformationProduitParam(
          {
            key,
            idProduit: payload?.id,
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
          },
          (error, res) => {
            if (error) {
              reject(error); // Handle the error appropriately
            } else {
              resolve(res); // Process the SOAP response
            }
          },
        );
      });
      const posologieCompleteParamters = {
        idProduit: payload?.id,
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

      if (checkId(payload?.contactId)) {
        const queryBilder = this.dataSource.createQueryBuilder();
        const patient = await queryBilder
          ?.select(
            'TIMESTAMPDIFF(MONTH , con.birthday, DATE(CURRENT_TIMESTAMP())) as age',
          )
          .addSelect('con.breastfeeding as allaitement')
          .addSelect('con.birthday as birthday')
          .addSelect('con.pregnancy as grossesse')
          .addSelect('con.clearanceCreatinine as clairanceCreatinine')
          .addSelect('con.hepaticInsufficiency as insuffisanceHepatique')
          .addSelect('con.weight as poids')
          .addSelect('con.size as taille')
          .addSelect('gen.type as sexe')
          .from(ContactEntity, 'con')
          .leftJoin('con.gender', 'gen')
          .where('con.id = :id', { id: payload?.contactId })
          .andWhere('con.group = :group', {
            group: identity.org,
          })
          .getRawOne();

        if (patient) {
          const contact = await this.contactRepo.findOne({
            where: { id: payload?.contactId },
            relations: {
              contraindications: true,
            },
          });
          const contraindications = contact?.contraindications || [];
          contraindications.forEach((e) => {
            const type = Number(e?.bcbdextherType);
            switch (type) {
              case 4096:
                patient.lstIdComposantAllergie = e?.bcbdextherId;
                break;

              case 4096:
                patient.lstPathologiesAMM = e?.bcbdextherId;
                break;

              case 4096:
                patient.lstPathologiesCIM10 = e?.bcbdextherId;
                break;
            }
          });
        }

        patient.creatininemieMg = 0;
        patient.creatininemieMol = 0;
        posologieCompleteParamters.profilPatient = patient;

        const rechercheEquivalents: {
          lstEquivalentsStricts: any;
          lstEquivalentsProches: any;
          lstEquivalentsAutres: any;
        } = await new Promise((resolve, reject) => {
          // Récupération des informations du produit.
          claudeBernardSearchResult.rechercheEquivalents(
            {
              key,
              idProduit: payload?.id,
            },
            (error, res) => {
              if (error) {
                reject(error); // Handle the error appropriately
              } else {
                resolve(res?.searchResult); // Process the SOAP response
              }
            },
          );
        });

        if (
          rechercheEquivalents?.lstEquivalentsStricts ||
          rechercheEquivalents?.lstEquivalentsProches ||
          rechercheEquivalents?.lstEquivalentsAutres
        ) {
          infos.produitResult.substituable = true;
          infos.produitResult.substituableExcipient = [];
          if (infos?.produitResult?.lstExcipients) {
            infos.produitResult.lstExcipients.forEach((excipient) => {
              if (
                excipient.effetNotoire &&
                (patient?.lstIdComposantAllergie?.includes(excipient?.id) ||
                  patient?.lstPathologiesAMM?.includes(excipient?.id) ||
                  patient?.lstPathologiesCIM10?.includes(excipient?.id))
              ) {
                infos.produitResult.substituableExcipient.push(excipient);
              }
            });
          }
        }
      }
      infos.produitResult.lstPosologies = [];
      // Récupération de la posologie du produit, en fonction
      // du profil du patient si celui est renseigné.
      const posologieComplete: { lstPosologies: any[]; posologieUsuelle: any } =
        await new Promise((resolve, reject) => {
          claudeBernardSearchResult.getPosologieComplete(
            {
              key,
              ...posologieCompleteParamters,
            },
            (error, res) => {
              if (error) {
                reject(error); // Handle the error appropriately
              } else {
                resolve(res?.searchResult); // Process the SOAP response
              }
            },
          );
        });

      if (posologieComplete?.lstPosologies) {
        // Selection de la posologie la mieux adaptée au profil patient
        // ou de la première posologie si aucun profil n'a été envoyé.
        if (
          posologieComplete?.posologieUsuelle &&
          Object?.keys(posologieComplete?.posologieUsuelle)?.length
        ) {
          let idx = 0;

          for (
            let key = 0;
            key < posologieComplete.lstPosologies.length;
            key++
          ) {
            const posologie = posologieComplete.lstPosologies[key];
            if (
              posologieComplete.posologieUsuelle.noPosologie ===
              posologie.noPosologie
            ) {
              idx = key;
              break;
            }
          }

          // On déplace la posologie usuelle en première position.
          posologieComplete.lstPosologies.splice(
            0,
            0,
            ...posologieComplete.lstPosologies.splice(idx, 1),
          );
        }

        posologieComplete.lstPosologies[0].selected = true;
        infos.produitResult.lstPosologies = posologieComplete.lstPosologies;
      }
      console.log(
        '🚀 ~ file: bcb.services.ts:223 ~ BcbServices ~ posologieComplete ~ posologieComplete:',
        posologieComplete,
      );

      return infos.produitResult;

      // handle result has in frontend : bcbConvert()  function
    } catch (error) {
      console.log(
        '🚀 ~ file: bcb.services.ts:227 ~ BcbServices ~ findOne ~ error:',
        error,
      );
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
  }
}
