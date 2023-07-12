import { Injectable } from '@nestjs/common';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EnregistrerFactureDto } from '../dto/facture.dto';
import { BillEntity } from 'src/entities/bill.entity';
import { BillLineEntity } from 'src/entities/bill-line.entity';
import { MedicalHeaderEntity } from 'src/entities/medical-header.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
import { EventEntity } from 'src/entities/event.entity';
import { NgapKeyEntity } from 'src/entities/ngapKey.entity';
import { da } from 'date-fns/locale';

@Injectable()
export class FactureServices {
  constructor(
    @InjectRepository(BillEntity)
    private billRepository: Repository<BillEntity>,
    @InjectRepository(BillLineEntity)
    private billLineRepository: Repository<BillLineEntity>,
    @InjectRepository(MedicalHeaderEntity)
    private medicalHeaderRepository: Repository<MedicalHeaderEntity>,
    @InjectRepository(EventTaskEntity)
    private eventTaskRepository: Repository<EventTaskEntity>,
    @InjectRepository(DentalEventTaskEntity)
    private dentalEventTaskRepository: Repository<DentalEventTaskEntity>, //dental
    @InjectRepository(EventEntity)
    private eventRepository: Repository<EventEntity>, //event
    @InjectRepository(NgapKeyEntity)
    private ngapKeyRepository: Repository<NgapKeyEntity>, //ngap_key
  ) {}

  async update(payload: EnregistrerFactureDto) {
    switch (payload.operation) {
      case 'enregistrer': {
        try {
          const idBill = await this.billRepository.findOne({
            where: { id: payload?.id_facture },
          });
          if (idBill) {
            await this.billRepository.save({
              id: payload?.id_facture,
              date: payload?.dateFacture,
              name: payload?.titreFacture,
              identPrat: payload?.identPrat,
              identPat: payload?.identPat,
              modePaiement: payload?.modePaiement,
              infosCompl: payload?.infosCompl,
              amount: payload?.amount,
              secuAmount: payload?.secuAmount,
              signatureDoctor: payload?.signatureDoctor,
              template: payload?.template,
            });
            return 'Facture enregistrée correctement';
          } else {
            return 'Bill does not exist';
          }
        } catch {
          return 'Erreur -3 : Problème durant la sauvegarde de la facture ... ';
        }
      }

      case 'supprimerLigne': {
        try {
          const billlines = await this.billLineRepository.find({
            where: { id: payload?.id_facture_ligne },
          });
          if (billlines) {
            return await this.billLineRepository.delete(
              payload?.id_facture_ligne,
            );
          }
        } catch {
          return "Erreur -5 : Problème durant la suppression d'une ligne de la facture ... ";
        }
      }

      case 'enregistrerEnteteParDefaut': {
        try {
          const medicalHeader = await this.medicalHeaderRepository.findOne({
            where: { userId: payload?.user_id },
          });
          if (!medicalHeader) {
            await this.medicalHeaderRepository.create({
              userId: payload?.user_id,
              name: payload?.titreFacture,
              address: payload?.addrPrat,
              identPrat: payload?.identPrat,
            });
          }
          await this.medicalHeaderRepository.update(medicalHeader.id, {
            userId: payload?.user_id,
            name: payload?.titreFacture,
            address: payload?.addrPrat,
            identPrat: payload?.identPrat,
          });
        } catch {
          throw new CBadRequestException(ErrorCode.STATUS_NOT_FOUND);
        }
        break;
      }

      case 'enregistrerLigne': {
        try {
          let data;
          if (payload?.typeLigne === 'operation') {
            if (payload?.dateLigne !== null) {
              const dateLigne = new Date(payload?.dateLigne);
            }
            const billLine = await this.billLineRepository.findOne({
              where: { id: payload?.id_facture_ligne },
            });
            if (!billLine) {
              data = await this.billLineRepository.create({
                amount: payload?.prixLigne,
                teeth: payload?.dentsLigne,
                cotation: payload?.cotation,
                secuAmount: payload?.secuAmount,
                materials: payload?.materials,
                bilId: payload?.id_facture,
                date: payload?.dateLigne,
                msg: payload?.descriptionLigne,
                pos: payload?.noSequence,
                type: payload?.typeLigne,
              });
              return data.id;
            }
            data = await this.billLineRepository.update(
              payload?.id_facture_ligne,
              {
                amount: payload?.prixLigne,
                teeth: payload?.dentsLigne,
                cotation: payload?.cotation,
                secuAmount: payload?.secuAmount,
                materials: payload?.materials,
                bilId: payload?.id_facture,
                date: payload?.dateLigne,
                msg: payload?.descriptionLigne,
                pos: payload?.noSequence,
                type: payload?.typeLigne,
              },
            );
            return data.id;
          } else {
            const billLine = await this.billLineRepository.findOne({
              where: { id: payload?.id_facture },
            });
            if (!billLine) {
              data = await this.billLineRepository.create({
                bilId: payload?.id_facture_ligne,
                pos: payload?.noSequence,
                type: payload?.typeLigne,
              });
              return data.id;
            }
            data = await this.billLineRepository.update(
              payload?.id_facture_ligne,
              {
                bilId: payload?.id_facture_ligne,
                pos: payload?.noSequence,
                type: payload?.typeLigne,
              },
            );
            return data.id;
          }
        } catch {
          throw new CBadRequestException(ErrorCode.STATUS_NOT_FOUND);
        }
      }

      case 'seances':
        {
          if (payload?.displayOnlyActsRealized === 'on') {
            const dataEventTasks = await this.eventTaskRepository.find({
              where: {
                usrId: payload?.user_id,
                conId: payload?.patient_id,
                status: 0,
                amountSaved: null,
              },
              relations: ['event', 'dental'],
            });
            const dataFilDate = dataEventTasks?.filter((dataEventTask) => {
              return (
                new Date(dataEventTask?.date)?.getTime() >=
                  new Date(payload?.dateDeb).getTime() &&
                new Date(dataEventTask?.date)?.getTime() <=
                  new Date(payload?.dateFin).getTime()
              );
            });
            const ngap_keys = await this.ngapKeyRepository.find();
            const res: { date: string; data: any[] }[] = [];
            for (const data of dataFilDate) {
              const current_ngap_key = ngap_keys?.find((key) => {
                return key?.id === data?.dental?.ngapKeyId;
              });
              const exist = res.find((r) => r.date === data.date);
              const newData = {
                date: data?.date,
                name: data?.name,
                amount: data?.amount,
                ccamFamily: data?.ccamFamily,
                teeth: data?.dental?.teeth,
                secuAmount: data?.dental?.secuAmount,
                exceeding: data?.dental?.exceeding,
                type: data?.dental?.type,
                ccamCode: data?.dental?.ccamCode,
                coef: data?.dental?.coef,
                ngapKeyName: current_ngap_key?.name,
              };
              if (exist) {
                exist.data.push(newData);
              } else {
                res.push({
                  date: data.date,
                  data: [newData],
                });
              }
            }
            return res;
          }
          if (payload?.displayOnlyActsListed) {
            const dataEventTasks = await this.eventTaskRepository.find({
              where: {
                usrId: payload?.user_id,
                conId: payload?.patient_id,
                amountSaved: null,
              },
              relations: ['event', 'dental'],
            });
            const dataFilDate = dataEventTasks?.filter((dataEventTask) => {
              return (
                new Date(dataEventTask?.date)?.getTime() >=
                  new Date(payload?.dateDeb).getTime() &&
                new Date(dataEventTask?.date)?.getTime() <=
                  new Date(payload?.dateFin).getTime()
              );
            });
            const ngap_keys = await this.ngapKeyRepository.find();
            // const res: any = [];
            // return dataFilDate?.map((data) => {
            //   const current_ngap_key = ngap_keys?.find((key) => {
            //     return key?.id === data?.dental?.ngapKeyId;
            //   });
            //   return {
            //     date: data?.date,
            //     name: data?.name,
            //     amount: data?.amount,
            //     ccamFamily: data?.ccamFamily,
            //     teeth: data?.dental?.teeth,
            //     secuAmount: data?.dental?.secuAmount,
            //     exceeding: data?.dental?.exceeding,
            //     type: data?.dental?.type,
            //     ccamCode: data?.dental?.ccamCode,
            //     coef: data?.dental?.coef,
            //     ngapKeyName: current_ngap_key?.name,
            //   };
            // });
            const res: { date: string; data: any[] }[] = [];
            for (const data of dataFilDate) {
              const current_ngap_key = ngap_keys?.find((key) => {
                return key?.id === data?.dental?.ngapKeyId;
              });
              const exist = res.find((r) => r.date === data.date);
              const newData = {
                date: data?.date,
                name: data?.name,
                amount: data?.amount,
                ccamFamily: data?.ccamFamily,
                teeth: data?.dental?.teeth,
                secuAmount: data?.dental?.secuAmount,
                exceeding: data?.dental?.exceeding,
                type: data?.dental?.type,
                ccamCode: data?.dental?.ccamCode,
                coef: data?.dental?.coef,
                ngapKeyName: current_ngap_key?.name,
              };
              if (exist) {
                exist.data.push(newData);
              } else {
                res.push({
                  date: data.date,
                  data: [newData],
                });
              }
            }
            return res;
          }

          if (payload?.displayOnlyProsthesis) {
            const dataEventTasks = await this.eventTaskRepository.find({
              where: {
                usrId: payload?.user_id,
                conId: payload?.patient_id,
                amountSaved: null,
              },
              relations: ['event', 'dental'],
            });
            const dataFilDate = dataEventTasks?.filter((dataEventTask) => {
              return (
                new Date(dataEventTask?.date)?.getTime() >=
                  new Date(payload?.dateDeb).getTime() &&
                new Date(dataEventTask?.date)?.getTime() <=
                  new Date(payload?.dateFin).getTime()
              );
            });
            const ngap_keys = await this.ngapKeyRepository.find();
            const res: any = [];
            return dataFilDate?.map((data) => {
              const current_ngap_key = ngap_keys?.find((key) => {
                return key?.id === data?.dental?.ngapKeyId;
              });
              return {
                ccamFamily: data?.ccamFamily,
              };
            });
          }
        }
        break;
    }
  }
}
