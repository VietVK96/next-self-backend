import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
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
  ) {}

  async update(payload: EnregistrerFactureDto) {
    switch (payload.operation) {
      case 'enregistrer': {
        try {
          const idBill = await this.billRepository.findOne({
            where: { id: payload?.idFacture },
          });
          if (idBill) {
            await this.billRepository.save({
              id: payload?.idFacture,
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
            where: { id: payload?.idFactureLigne },
          });
          if (billlines) {
            return await this.billLineRepository.delete(
              payload?.idFactureLigne,
            );
          }
        } catch {
          return "Erreur -5 : Problème durant la suppression d'une ligne de la facture ... ";
        }
      }

      case 'enregistrerEnteteParDefaut': {
        try {
          const medicalHeader = await this.medicalHeaderRepository.findOne({
            where: { userId: payload?.userId },
          });
          if (!medicalHeader) {
            await this.medicalHeaderRepository.create({
              userId: payload?.userId,
              name: payload?.titreFacture,
              address: payload?.addrPrat,
              identPrat: payload?.identPrat,
            });
          }
          await this.medicalHeaderRepository.update(medicalHeader.id, {
            userId: payload?.userId,
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
              where: { id: payload?.idFactureLigne },
            });
            if (!billLine) {
              data = await this.billLineRepository.create({
                amount: payload?.prixLigne,
                teeth: payload?.dentsLigne,
                cotation: payload?.cotation,
                secuAmount: payload?.secuAmount,
                materials: payload?.materials,
                bilId: payload?.idFacture,
                date: payload?.dateLigne,
                msg: payload?.descriptionLigne,
                pos: payload?.noSequence,
                type: payload?.typeLigne,
              });
              return data.id;
            }
            data = await this.billLineRepository.update(
              payload?.idFactureLigne,
              {
                amount: payload?.prixLigne,
                teeth: payload?.dentsLigne,
                cotation: payload?.cotation,
                secuAmount: payload?.secuAmount,
                materials: payload?.materials,
                bilId: payload?.idFacture,
                date: payload?.dateLigne,
                msg: payload?.descriptionLigne,
                pos: payload?.noSequence,
                type: payload?.typeLigne,
              },
            );
            return data.id;
          } else {
            const billLine = await this.billLineRepository.findOne({
              where: { id: payload?.idFactureLigne },
            });
            if (!billLine) {
              data = await this.billLineRepository.create({
                bilId: payload?.idFactureLigne,
                pos: payload?.noSequence,
                type: payload?.typeLigne,
              });
              return data.id;
            }
            data = await this.billLineRepository.update(
              payload?.idFactureLigne,
              {
                bilId: payload?.idFactureLigne,
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
    }
  }
}
