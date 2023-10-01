import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';
import { ClaudeBernardService } from 'src/bcb/services/claudeBernard.Service';
import { DEFAULT_LOCALE } from 'src/constants/default';
import { ContactEntity } from 'src/entities/contact.entity';
import { MedicalOrderEntity } from 'src/entities/medical-order.entity';
import { DataSource, Repository } from 'typeorm';
import { BaseClaudeBernardCheckDto } from '../dto/baseClaudeBernardCheck.medical.dto';
import { checkId } from 'src/common/util/number';

@Injectable()
export class MedicalService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(ContactEntity)
    private contactRepo: Repository<ContactEntity>,
    @InjectRepository(MedicalOrderEntity)
    private medicalOrderEntity: Repository<MedicalOrderEntity>,
    private claudeBernardService: ClaudeBernardService,
  ) {}

  async baseClaudeBernardCheck(
    payload: BaseClaudeBernardCheckDto,
    organizationId: number,
  ) {
    const patientId = checkId(payload?.contact);
    try {
      this.claudeBernardService.setIdPS(payload?.license?.toString());
      const claudeBernard = await this.claudeBernardService?.call();
      const key = {
        codeEditeur: this.claudeBernardService.codeEditeur,
        idPS: this.claudeBernardService.idPS,
        secretEditeur: this.claudeBernardService.generateKey(),
      };
      delete payload?.license;

      const claudeBernardVersion: {
        result?: { idVersionBase: string };
      } = await new Promise((resolve, reject) => {
        claudeBernard.getVersion({ key }, (error, res) => {
          if (error) {
            reject(error); // Handle the error appropriately
          } else {
            resolve(res); // Process the SOAP response
          }
        });
      });

      const profilPatientQueryBuilder =
        this.contactRepo.createQueryBuilder('con');
      profilPatientQueryBuilder.select(
        'TIMESTAMPDIFF(MONTH , con.birthday, CURRENT_TIMESTAMP()) as age',
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
      profilPatientQueryBuilder.where('con.id = :patientId', {
        patientId: patientId || 0,
      });
      profilPatientQueryBuilder.andWhere('con.group = :organizationId', {
        organizationId,
      });

      const profilPatient = await profilPatientQueryBuilder.getRawOne();

      const patient = await this.contactRepo.findOne({
        where: { id: patientId || 0 },
        relations: { contraindications: true },
      });
      const contraindications = patient.contraindications;

      for (const contraindication of contraindications) {
        const bcbdextherType = contraindication.bcbdextherType;
        switch (bcbdextherType) {
          case 4096:
            profilPatient['lstIdComposantAllergie'] = bcbdextherType;
            break;
          case 16384:
            profilPatient['lstPathologiesAMM'] = bcbdextherType;
            break;
          case 32768:
            profilPatient['lstPathologiesCIM10'] = bcbdextherType;
        }
      }
      profilPatient['creatininemieMg'] = 0;
      profilPatient['creatininemieMol'] = 0;

      // Contrôle de l'ordonnance en fonction du profil du patient et des produits.
      const claudeBernardControle = await new Promise((resolve, reject) => {
        claudeBernard.controleOrdonnance(
          {
            key,
            lstIdProduit: payload?.prescriptionIds,
            profilPatient: profilPatient,
            pays: 0,
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

      return { claudeBernardControle, claudeBernardVersion };
    } catch (e) {
      return {
        checking: true,
        version: 20000,
        errors: [
          {
            error: e?.response?.msg,
          },
        ],
      };
    }
  }

  async findAllInProgress(groupId: number, contactId: number, date: string) {
    const queryBuilder = this.medicalOrderEntity
      .createQueryBuilder('mdo')
      .select(['mdo.prescription', 'mdo.date', 'usr.lastname', 'usr.firstname'])
      .leftJoin('mdo.user', 'usr')
      .where('usr.group = :groupId', { groupId })
      .andWhere('mdo.contact = :contactId', { contactId })
      .andWhere('mdo.date BETWEEN :date AND mdo.endDate', { date })
      .andWhere('mdo.numberOfPrescription >= :minNumberOfPrescription', {
        minNumberOfPrescription: 1,
      })
      .orderBy('mdo.date');
    const medicalOrderCollection = await queryBuilder.getRawMany();

    for (let key = 0; key < medicalOrderCollection.length; key++) {
      const medicalOrderEntity = medicalOrderCollection[key];

      // Suppression des balises TEXTAREAs.
      medicalOrderCollection[key]['date'] = dayjs(medicalOrderEntity['date'])
        .locale(DEFAULT_LOCALE)
        .format('d/m/Y');
      medicalOrderCollection[key]['prescription'] = medicalOrderEntity[
        'prescription'
      ]
        .replace(/<textarea[^<>]*>/g, '')
        .replace(/<\/textarea>/g, '');
    }

    return medicalOrderCollection;
  }
}
