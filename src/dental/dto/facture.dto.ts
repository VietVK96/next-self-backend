import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';
import { EnumBillLineType } from 'src/entities/bill-line.entity';

@ApiExtraModels()
export class EnregistrerFactureDto {
  @ApiProperty({
    name: 'operation',
    required: false,
  })
  operation?: string;

  @ApiProperty({
    name: 'id_facture',
    required: false,
  })
  id_facture?: number;

  @ApiProperty({
    name: 'dateFacture',
    required: false,
  })
  dateFacture?: string;

  @ApiProperty({
    name: 'titreFacture',
    required: false,
  })
  titreFacture?: string;

  @ApiProperty({
    name: 'identPrat',
    required: false,
  })
  identPrat?: string;

  @ApiProperty({
    name: 'adeli',
    required: false,
  })
  adeli?: string;

  @ApiProperty({
    name: 'addrPrat',
    required: false,
  })
  addrPrat?: string;

  @ApiProperty({
    name: 'identPat',
    required: false,
  })
  identPat?: string;

  @ApiProperty({
    name: 'modePaiement',
    required: false,
  })
  modePaiement?: string;

  @ApiProperty({
    name: 'infosCompl',
    required: false,
  })
  infosCompl?: string;

  @ApiProperty({
    name: 'amount',
    required: false,
  })
  amount?: number;

  @ApiProperty({
    name: 'secuAmount',
    required: false,
  })
  secuAmount?: number;

  @ApiProperty({
    name: 'template',
    required: false,
  })
  template?: number;

  @ApiProperty({
    name: 'signature_doctor',
    required: false,
  })
  signature_doctor?: string;

  @ApiProperty({
    name: 'id_facture_ligne',
    required: false,
  })
  id_facture_ligne?: number;

  @ApiProperty({
    name: 'user_id',
    required: false,
  })
  user_id?: number;

  @ApiProperty({
    name: 'typeLigne',
    required: false,
  })
  typeLigne?: EnumBillLineType;

  @ApiProperty({
    name: 'dateLigne',
    required: false,
  })
  dateLigne?: string;

  @ApiProperty({
    name: 'prixLigne',
    required: false,
  })
  prixLigne?: number;

  @ApiProperty({
    name: 'dentsLigne',
    required: false,
  })
  dentsLigne?: string;

  @ApiProperty({
    name: 'cotation',
    required: false,
  })
  cotation?: string;

  @ApiProperty({
    name: 'materials',
    required: false,
  })
  materials?: string;

  @ApiProperty({
    name: 'descriptionLigne',
    required: false,
  })
  descriptionLigne?: string;

  @ApiProperty({
    name: 'noSequence',
    required: false,
  })
  noSequence?: number;

  @ApiProperty({
    name: 'patient_id',
    required: false,
  })
  patient_id?: number;

  @ApiProperty({
    name: 'dateDeb',
    required: false,
  })
  dateDeb?: Date;

  @ApiProperty({
    name: 'dateFin',
    required: false,
  })
  dateFin?: string;

  @ApiProperty({
    name: 'signatureDoctor',
    required: false,
  })
  signatureDoctor?: string;

  @ApiProperty({
    name: 'displayOnlyActsRealized',
    required: false,
  })
  displayOnlyActsRealized?: string;

  @ApiProperty({
    name: 'displayOnlyActsListed',
    required: false,
  })
  displayOnlyActsListed?: string;

  @ApiProperty({
    name: 'displayOnlyProsthesis',
    required: false,
  })
  displayOnlyProsthesis?: string;
}

@ApiExtraModels()
export class PrintPDFDto {
  @ApiProperty()
  id?: string;
  @ApiProperty()
  duplicate?: boolean;
}
