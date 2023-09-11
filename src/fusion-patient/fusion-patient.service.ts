import { ContactEntity } from 'src/entities/contact.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FindFusionPatientRes } from './response/find.fusion-patient.res';

@Injectable()
export class FusionPatientService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(ContactEntity)
    private contactRepo: Repository<ContactEntity>,
  ) {}

  // php/fusionPatient/find.php line 21-58
  // find contact patient by id
  async find(
    contactId: number,
    groupId: number,
  ): Promise<FindFusionPatientRes> {
    const queryBuilder = this.dataSource.createQueryBuilder();
    const select = `CON.CON_ID AS id,
                    CON.CON_NBR AS nbr,
                    CON.CON_LASTNAME AS lastname,
                    CON.CON_FIRSTNAME AS firstname,
                    CON.CON_BIRTHDAY AS birthday,
                    CON.CON_INSEE AS insee,
                    CON.CON_INSEE_KEY AS inseeKey`;
    const contact: FindFusionPatientRes = await queryBuilder
      .select(select)
      .from('T_CONTACT_CON', 'CON')
      .where(`CON.CON_ID = :contactId`, { contactId })
      .andWhere(`CON.organization_id = :groupId`, { groupId })
      .getRawOne();
    if (contact) {
      const listQr = {
        'Nombre de factures':
          'SELECT COUNT(*) AS cnt FROM T_BILL_BIL WHERE CON_ID = ?',
        'Nombre de recettes':
          'SELECT COUNT(*) AS cnt FROM T_CASHING_CONTACT_CSC WHERE CON_ID = ?',
        'Nombre de documents':
          'SELECT COUNT(*) AS cnt FROM T_CONTACT_DOCUMENT_COD WHERE CON_ID = ?',
        'Nombre de commentaires':
          'SELECT COUNT(*) AS cnt FROM T_CONTACT_NOTE_CNO WHERE CON_ID = ?',
        'Nombre de devis':
          'SELECT COUNT(*) AS cnt FROM T_DENTAL_QUOTATION_DQO WHERE CON_ID = ?',
        'Nombre de rendez-vous':
          'SELECT COUNT(*) AS cnt FROM T_EVENT_EVT WHERE CON_ID = ?',
        'Nombre de soins':
          'SELECT COUNT(*) AS cnt FROM T_EVENT_EVT EVT JOIN T_EVENT_TASK_ETK ETK ON ETK.EVT_ID = EVT.EVT_ID WHERE EVT.CON_ID = ?',
        'Nombre de feuilles de soins':
          'SELECT COUNT(*) AS cnt FROM T_FSE_FSE WHERE CON_ID = ?',
        'Nombre de courriers':
          'SELECT COUNT(*) AS cnt FROM T_LETTERS_LET WHERE CON_ID = ?',
        "Nombre d'ordonnances":
          'SELECT COUNT(*) AS cnt FROM T_MEDICAL_ORDER_MDO WHERE CON_ID = ?',
        'Nombre de post-its':
          'SELECT COUNT(*) AS cnt FROM T_POSTIT_PTT WHERE CON_ID = ?',
        'Nombre de schéma parodontal':
          'SELECT COUNT(*) AS cnt FROM periodontal_chart WHERE patient_id = ?',
      };
      const recordCount: { [key: string]: number } = await this.query(
        listQr,
        contactId,
      );
      contact.recordCount = recordCount;
    }
    return contact;
  }

  // php/fusionPatient.save/php line 24-136
  // merge contactRemoveId to contactSaveId
  async save(groupId: number, contactSaveId: number, contactRomveId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

      // Remplacement de l'identifiant du patient.
      const inputParameters = [contactSaveId, contactRomveId];
      await queryRunner.query(
        'UPDATE T_BILL_BIL SET CON_ID = ? WHERE CON_ID = ?',
        inputParameters,
      );
      await queryRunner.query(
        'UPDATE T_CASHING_CONTACT_CSC SET CON_ID = ? WHERE CON_ID = ?',
        inputParameters,
      );
      await queryRunner.query(
        'UPDATE T_CASHING_CSG SET CON_ID = ? WHERE CON_ID = ?',
        inputParameters,
      );
      await queryRunner.query(
        'UPDATE T_CONTACT_DOCUMENT_COD SET CON_ID = ? WHERE CON_ID = ?',
        inputParameters,
      );
      await queryRunner.query(
        'UPDATE T_CONTACT_NOTE_CNO SET CON_ID = ? WHERE CON_ID = ?',
        inputParameters,
      );
      await queryRunner.query(
        'UPDATE T_DENTAL_INITIAL_DIN SET CON_ID = ? WHERE CON_ID = ?',
        inputParameters,
      );
      await queryRunner.query(
        'UPDATE T_DENTAL_QUOTATION_DQO SET CON_ID = ? WHERE CON_ID = ?',
        inputParameters,
      );
      await queryRunner.query(
        'UPDATE T_EVENT_TASK_ETK SET CON_ID = ? WHERE CON_ID = ?',
        inputParameters,
      );
      await queryRunner.query(
        'UPDATE T_EVENT_EVT SET CON_ID = ? WHERE CON_ID = ?',
        inputParameters,
      );
      await queryRunner.query(
        'UPDATE T_FSE_FSE SET CON_ID = ? WHERE CON_ID = ?',
        inputParameters,
      );
      await queryRunner.query(
        'UPDATE T_LETTERS_LET SET CON_ID = ? WHERE CON_ID = ?',
        inputParameters,
      );
      await queryRunner.query(
        'UPDATE T_MEDICAL_ORDER_MDO SET CON_ID = ? WHERE CON_ID = ?',
        inputParameters,
      );
      await queryRunner.query(
        'UPDATE T_POSTIT_PTT SET CON_ID = ? WHERE CON_ID = ?',
        inputParameters,
      );
      await queryRunner.query(
        'UPDATE periodontal_chart SET patient_id = ? WHERE patient_id = ?',
        inputParameters,
      );

      /**
       * COMMENTAIRE DU PATIENT
       */
      const contactRemove = await this.contactRepo.findOneBy({
        id: contactRomveId,
      });
      await queryRunner.query(
        "UPDATE T_CONTACT_CON SET CON_MSG = CONCAT_WS('\n', CON_MSG, ?), odontogram_observation = CONCAT_WS('\n', odontogram_observation, ?) WHERE CON_ID = ?",
        [
          contactRemove?.msg,
          contactRemove?.odontogramObservation,
          contactSaveId,
        ],
      );

      /**
       * CONTRE-INDICATIONS DU PATIENT
       */
      const contraindicationStm = await queryRunner.query(
        'SELECT MLC_ID FROM T_CONTACT_CONTRAINDICATION_COC WHERE CON_ID = ?',
        [contactRomveId],
      );
      for (const mlc of contraindicationStm) {
        const existing = await queryRunner.query(
          'SELECT COUNT(*) AS cnt FROM T_CONTACT_CONTRAINDICATION_COC WHERE CON_ID = ? AND MLC_ID = ?',
          [contactSaveId, mlc['MLC_ID']],
        );
        if (Number(existing[0]['cnt']) !== 0) {
          await queryRunner.query(
            'INSERT INTO T_CONTACT_CONTRAINDICATION_COC (CON_ID, MLC_ID) VALUES (?, ?)',
            [contactSaveId, mlc['MLC_ID']],
          );
        }
      }

      // Mise en corbeille du patient
      await queryRunner.query('SET @TRIGGER_CHECKS = FALSE');
      await queryRunner.query(
        'UPDATE T_CONTACT_CON SET deleted_at = CURRENT_TIMESTAMP() WHERE CON_ID = ?',
        [contactRomveId],
      );
      await queryRunner.query('SET @TRIGGER_CHECKS = TRUE');

      const doctor: { id: number } = await this.dataSource
        .createQueryBuilder()
        .select('doctolib.id, doctolib.group_id_partner')
        .from('doctolib', 'doctolib')
        .where(`doctolib.group_id = :groupId`, { groupId })
        .andWhere('doctolib.deleted_at IS NULL')
        .getRawOne();
      if (doctor?.id) {
        const doctolibId = doctor.id;
        // const groupIdPartner = Number(doctor.group_id_partner);
        // @TODO Create url 3rd
        // $url = sprintf($configuration->doctolib->url, $groupIdPartner);

        const createQueryPatientId = (
          doctolibId: number,
          patientId: number,
        ) => {
          return this.dataSource
            .createQueryBuilder()
            .select('doctolib_patient.patient_id_partner')
            .from('doctolib_patient', 'doctolib_patient')
            .where(`doctolib_patient.doctolib_id = :doctolibId`, { doctolibId })
            .andWhere(`doctolib_patient.patient_id = :patientId`, {
              patientId,
            });
        };

        const patientIdPreservedPartner = await createQueryPatientId(
          doctolibId,
          contactSaveId,
        ).getRawOne();
        const patientIdDeletedPartner = await createQueryPatientId(
          doctolibId,
          contactRomveId,
        ).getRawOne();
        if (patientIdPreservedPartner && patientIdDeletedPartner) {
          // @TODO Send message to 3rd
          // $message = new Message($connection, $configuration->doctolib->processing_id);
          // $patient = new PatientService($connection);
          // $patient->selectPatient($numeroDossierAConserver);
          // $patient->setItemIdPartner($patientIdPreservedPartner);
          // cURL_POST::send_message($url, $message->createADT(40, $patient, $patientIdDeletedPartner));
        }
      }
      await queryRunner.commitTransaction();
      return;
    } catch (e) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  private async query(
    listQr: {
      [key: string]: string;
    },
    contactId: number,
  ) {
    const result = {};
    for (const key in listQr) {
      const qr = await this.dataSource.query(listQr[key], [Number(contactId)]);
      result[key] = Number(qr[0].cnt);
    }
    return result;
  }
}
