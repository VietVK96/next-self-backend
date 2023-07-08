import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

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
  idFacture?: number;

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
    name: 'N° ADELI',
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
  signatureDoctor?: string;

  @ApiProperty({
    name: 'id_facture_ligne',
    required: false,
  })
  idFactureLigne?: number;
}
