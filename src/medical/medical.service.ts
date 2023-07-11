import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ContactEntity } from 'src/entities/contact.entity';
import { MedicalOrderEntity } from 'src/entities/medical-order.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class MedicalService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(ContactEntity)
    private contactRepo: Repository<ContactEntity>,
    @InjectRepository(MedicalOrderEntity)
    private medicalOrderEntity: Repository<MedicalOrderEntity>,
  ) {}

  async baseClaudeBernardCheck(patientId: number, organizationId: number) {
    try {
      // @TODO
      // $claudeBernard = $container->get('medicament_database.claude_bernard');
      // $claudeBernard->setIdPS($request->query->get('license'));
      // $claudeBernardVersion = $claudeBernard->getVersion();
      // $claudeBernardInformation = $claudeBernard->testConnexion();

      //   if (1 > $claudeBernardInformation->result->statutConnexion) {

      //     throw new BadRequestHttpException($claudeBernardInformation->result->statutConnexionLibelle);

      // }

      const errors = {
        checking: true,
        version: 20000,
        errors: [],
      };

      const profilPatientQueryBuilder =
        this.contactRepo.createQueryBuilder('con');
      profilPatientQueryBuilder.select(
        'TIMESTAMPDIFF(MONTH , con.birthday, CURRENT_TIMESTAMP())',
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

      const profilPatient = await profilPatientQueryBuilder.getRawOne();

      const patient = await this.contactRepo.findOneBy({ id: patientId });
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

      // @TODO
      // // Contrôle de l'ordonnance en fonction du profil du patient et des produits.
      // $claudeBernardControle = $claudeBernard->controleOrdonnance([
      //     'lstIdProduit' => $prescriptionIds,
      //     'profilPatient' => $profilPatient,
      //     'pays' => 0
      // ]);

      // $templateNames = [
      //     'lstAllergies' => 'prescriptions/allergies.twig',
      //     'lstIPC' => 'prescriptions/ipc.twig',
      //     'lstInteractions' => 'prescriptions/interactions.twig',
      //     'lstPrecautionsEmploi' => 'prescriptions/precautions-of-use.twig',
      //     'lstSurdosage' => 'prescriptions/overdoses.twig'
      // ];

      // foreach ($claudeBernardControle->controleResult as $key => $results) {

      //     if (isset($templateNames[$key])) {

      //         if (is_object($results)) {

      //             $errors['errors'][] = ['error' => $twig->render($templateNames[$key], (array) $results)];

      //         } else {

      //             foreach ($results as & $result) {

      //                 $errors['errors'][] = ['error' => $twig->render($templateNames[$key], (array) $result)];

      //             }

      //         }

      //     }

      // }

      // return (new JsonResponse($errors))->send();
      throw new CBadRequestException(
        `Une erreur interne est survenue lors du contrôle de l'ordonnance. Veuillez réessayer ultérieurement ou continuer pour imprimer l'ordonnance.`,
      );
    } catch (e) {
      return {
        checking: true,
        version: 20000,
        errors: [
          {
            error: e.response.msg,
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
        .locale('fr-FR')
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
