import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EnregistrerFactureDto } from '../dto/facture.dto';
import { BillEntity } from 'src/entities/bill.entity';
import { BillLineEntity } from 'src/entities/bill-line.entity';

@Injectable()
export class FactureServices {
  constructor(
    @InjectRepository(BillEntity)
    private billRepository: Repository<BillEntity>,
    @InjectRepository(BillLineEntity)
    private billLineRepository: Repository<BillLineEntity>,
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
    }
  }
}
