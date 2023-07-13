import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { ContactEntity } from 'src/entities/contact.entity';
import { DataSource, Repository } from 'typeorm';
import { createPdf } from '@saemhco/nestjs-html-pdf';
import * as path from 'path';
import { ContactPdfDto } from '../dto/contact.pdf.dto';
import { HistoricalService } from './historical.service';
import { ContactHistoryFilter } from 'src/constants/contacts';
import { HistoricalRes } from '../response/historical.res';
import {
  addressFormatter,
  inseeFormatter,
  phoneNumberFormatter,
} from 'src/common/formatter';
import { PhoneEntity } from 'src/entities/phone.entity';

@Injectable()
export class ContactPdfService {
  constructor(
    private dataSource: DataSource,
    private historicalService: HistoricalService,
    @InjectRepository(ContactEntity)
    private contactRepository: Repository<ContactEntity>,
  ) {}

  /**
   * File php/contact/appointment/print.php
   * Line 13 -> 70
   */
  async getContactAppointmentPdf(
    contactId: number,
    nextEvent: number,
    identity: UserIdentity,
  ) {
    let timeMin = new Date();
    if (nextEvent) {
      timeMin = new Date();
    }
    const contact = await this.contactRepository.findOne({
      where: { id: contactId, organizationId: identity?.org },
      relations: ['gender', 'user'],
    });
    const contactUser = contact?.user;
    const doctorName = `Docteur ${contactUser?.firstname} ${contactUser?.lastname}`;
    const contactGender = contact?.gender;
    let contactFullName = `${contact?.lastname} ${contact?.firstname}`;
    if (contactGender) {
      contactFullName = `${contactGender.name}. ${contactFullName}`;
    }
    const inputParameters: string[] = [contactId.toString()];
    let query = `
    SELECT
			T_EVENT_EVT.EVT_NAME AS name,
			EVT_STATE AS status,
			CONCAT_WS(' ', event_occurrence_evo.evo_date, TIME(T_EVENT_EVT.EVT_START)) AS start
		FROM T_EVENT_EVT
		JOIN event_occurrence_evo
		WHERE T_EVENT_EVT.CON_ID = ?
		  AND T_EVENT_EVT.EVT_DELETE = 0
		  AND T_EVENT_EVT.EVT_STATE NOT IN (2,3)
		  AND T_EVENT_EVT.EVT_ID = event_occurrence_evo.evt_id
		  AND event_occurrence_evo.evo_exception = 0
    `;
    if (nextEvent) {
      inputParameters.push(format(timeMin, 'yyyy-MM-dd'));
      query = `${query}
        AND event_occurrence_evo.evo_date >= ?`;
    }
    query = `${query} ORDER BY start`;
    const appointmentCollection = await this.dataSource.query(
      query,
      inputParameters,
    );
    const filePath = path.join(
      process.cwd(),
      'templates/contact',
      'appointment.hbs',
    );
    const options = {
      format: 'A4',
      displayHeaderFooter: true,
      margin: {
        left: '10mm',
        top: '25mm',
        right: '10mm',
        bottom: '15mm',
      },
      headerTemplate: `<div style="width:100%;margin-right:10mm;text-align: right;"><span style="font-size: 10px;">${doctorName}</span></div>`,
      footerTemplate: `<div style="width: 100%;margin-right:10mm; text-align: right; font-size: 8px;">Document généré le ${format(
        new Date(),
        'dd/MM/yyyy',
      )} Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
      landscape: true,
    };
    const data = {
      contactName: contactFullName,
      appointmentCollection,
    };
    return await createPdf(filePath, options, data);
  }

  /**
   * File dental/fs/fs_verso_pdf.php
   * Line 16 -> 194
   */
  async getFsVersoPdf(id: number, identity: UserIdentity) {
    const person = await this.contactRepository.findOne({
      where: { id, organizationId: identity.org },
      relations: ['address'],
    });
    const personLastname = '';
    const personFirstname = '';
    const personBirthday = '';
    const personAddressStreet = '';
    const personAddressZipCode = '';
    const personAddressCity = '';
    const policyHolderLastname = person?.lastname ?? '';
    const policyHolderFirstname = person?.firstname ?? '';
    const policyHolderBirthday = person?.birthday
      ? format(new Date(person?.birthday), 'dd/MM/yyyy')
      : '';
    const address = person?.address;
    const addressStreet = address && address?.street ? address?.street : '';
    const addressZipCode = address && address?.zipCode ? address?.zipCode : '';
    const addressCity = address && address?.city ? address?.city : '';
    const policyHolderAddressCollection = [
      addressStreet,
      `${addressZipCode} ${addressCity}`,
    ];
    const policyHolderNumber = person?.insee ?? '';
    const policyHolderNumberKey = person?.inseeKey ?? '';
    const filePath = path.join(
      process.cwd(),
      'templates/contact',
      'fs_verso_pdf.hbs',
    );
    const options = {
      format: 'A4',
      displayHeaderFooter: false,
      margin: {
        left: '10mm',
        top: '25mm',
        right: '10mm',
        bottom: '15mm',
      },
      landscape: true,
    };
    const data = {
      personLastname,
      personFirstname,
      personBirthday,
      personAddressStreet,
      personAddressZipCode,
      personAddressCity,
      policyHolderNumber,
      policyHolderNumberKey,
      policyHolderBirthday,
      policyHolderLastname,
      policyHolderFirstname,
      policyHolderAddressCollection,
    };
    return await createPdf(filePath, options, data);
  }

  /**
   * File php/contact/print.php
   * Line 16 -> 194
   */
  async getContactPdf(param: ContactPdfDto) {
    const patient = await this.contactRepository.findOneOrFail({
      where: { id: param?.id },
      relations: ['gender', 'user', 'phones', 'address', 'medecinTraitant'],
    });
    let patientFullName = `${patient?.lastname} ${patient?.firstname}`;
    if (patient?.gender) {
      patientFullName = `${patient?.gender?.name}. ${patientFullName}`;
    }
    const patientLastName = patient?.lastname ?? '';
    const patientEmail = patient?.email ?? '';
    const patientFirstName = patient?.firstname ?? '';
    const contactUser = patient?.user;
    const phones = patient?.phones;
    let patientPhoneNumbers = [];
    if (phones && phones.length > 0) {
      patientPhoneNumbers = phones.map((value: PhoneEntity) => {
        return phoneNumberFormatter(value?.nbr);
      });
    }
    const patientInsee = inseeFormatter(
      `${patient?.insee}${patient?.inseeKey}`,
    );
    const address = patient?.address
      ? {
          street: patient?.address?.street ?? '',
          street2: patient?.address?.streetComp ?? '',
          zipCode: patient?.address?.zipCode ?? '',
          country: patient?.address?.country ?? '',
          city: patient?.address?.city ?? '',
        }
      : null;
    const patientBirthDate = patient?.birthday
      ? format(new Date(patient.birthday), 'dd/MM/yyyy')
      : '';
    const patientAddress = patient?.address ? addressFormatter(address) : '';
    const addressedBy = patient?.medecinTraitant;
    const patientAddressBy = addressedBy
      ? `${addressedBy?.lastName ?? ''} ${addressedBy?.firstName ?? ''} ${
          addressedBy?.email
            ? `<p style="margin: 0.5mm 0;">${addressedBy.email}</p>`
            : ''
        }`
      : '';
    const doctorName = `Docteur ${contactUser?.lastname} ${contactUser?.firstname}`;
    const observation = param?.observation_filter ? patient?.msg : '';
    const patientHistoryBill =
      param?.patient_history_filter &&
      param?.patient_history_filter.includes(ContactHistoryFilter.bill)
        ? await this.historicalService.getAllBill(patient?.id)
        : [];
    const patientHistoryContactNote =
      param?.patient_history_filter &&
      param?.patient_history_filter.includes(ContactHistoryFilter.contactNote)
        ? await this.historicalService.getAllContactNote(patient?.id)
        : [];
    const patientHistoryMedicalOrder =
      param?.patient_history_filter &&
      param?.patient_history_filter.includes(ContactHistoryFilter.medicalOrder)
        ? await this.historicalService.getALlMedicalOrder(patient?.id)
        : [];
    const patientHistoryDentalQuotation =
      param?.patient_history_filter &&
      param?.patient_history_filter.includes(
        ContactHistoryFilter.dentalQutation,
      )
        ? await this.historicalService.getAllDentalQuotation(patient?.id)
        : [];
    const patientHistoryEvent =
      param?.patient_history_filter &&
      param?.patient_history_filter.includes(ContactHistoryFilter.event)
        ? await this.historicalService.getAllEvent(patient?.id)
        : [];
    const patientHistoryPrestation =
      param?.patient_history_filter &&
      param?.patient_history_filter.includes(ContactHistoryFilter.presatation)
        ? await this.historicalService.getAllPrestation(patient?.id)
        : [];
    const patientHistoryCaresheet =
      param?.patient_history_filter &&
      param?.patient_history_filter.includes(ContactHistoryFilter.caresheet)
        ? await this.historicalService.getAllCaresheet(patient?.id)
        : [];
    const historyRes: HistoricalRes[] = [
      patientHistoryBill,
      patientHistoryContactNote,
      patientHistoryMedicalOrder,
      patientHistoryDentalQuotation,
      patientHistoryEvent,
      patientHistoryPrestation,
      patientHistoryCaresheet,
    ].flat();
    const patientHistory = historyRes.map((value: HistoricalRes) => {
      const date = value?.date
        ? format(new Date(value?.date), 'dd/MM/yyyy')
        : '';
      const teeth =
        value?.teeth && value?.teeth?.length > 0
          ? this._formatTeeth(value?.teeth)
          : '';
      const amount = value?.amount ? value?.amount : '';
      const cotation = value?.cotation ? value.cotation : '';
      const name = value?.name ? value.name : '';
      return { date, teeth, amount, cotation, name };
    });
    const filePath = path.join(
      process.cwd(),
      'templates/contact',
      'contact_pdf.hbs',
    );
    const data = {
      patient,
      patientEmail,
      patientFirstName,
      patientLastName,
      patientPhoneNumbers,
      patientInsee,
      patientFullName,
      patientBirthDate,
      patientAddress,
      patientAddressBy,
      observation,
      patientHistory,
    };
    const options = {
      format: 'A4',
      displayHeaderFooter: true,
      margin: {
        left: '10mm',
        top: '25mm',
        right: '10mm',
        bottom: '15mm',
      },
      headerTemplate: `<div style="width:100%;margin-right:10mm;text-align: right;"><span style="font-size: 10px;">${doctorName}</span></div>`,
      footerTemplate: `<div style="width: 100%;margin-right:10mm; text-align: right; font-size: 8px;">Document généré le ${format(
        new Date(),
        'dd/MM/yyyy',
      )} Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
      landscape: true,
    };
    return await createPdf(filePath, options, data);
  }

  _formatTeeth(teeth: string) {
    const res = Array.from(teeth).reduce((acc, val, index) => {
      if (index % 9 === 0 && index !== 0) {
        return `${acc} <br /> ${val}`;
      } else {
        return acc + val;
      }
    }, '');
    return res;
  }
}
