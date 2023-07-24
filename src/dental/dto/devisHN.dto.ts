import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';
@ApiExtraModels()
export class PrestationsRequestAjaxDto {
  @ApiProperty({
    name: 'id_devisHN_ligne',
    required: false,
  })
  id_devisHN_ligne?: string;

  @ApiProperty({
    name: 'library_act_id',
    required: false,
  })
  library_act_id?: string;

  @ApiProperty({
    name: 'library_act_quantity_id',
    required: false,
  })
  library_act_quantity_id?: string;

  @ApiProperty({
    name: 'dateLigne',
    required: false,
  })
  dateLigne?: Date;

  @ApiProperty({
    name: 'descriptionLigne',
    required: false,
  })
  descriptionLigne?: string;

  @ApiProperty({
    name: 'prixLigne',
    required: false,
  })
  prixLigne?: number;

  @ApiProperty({
    name: 'prixachat',
    required: false,
  })
  prixachat?: string;

  @ApiProperty({
    name: 'dentsLigne',
    required: false,
  })
  dentsLigne?: string;

  @ApiProperty({
    name: 'coef',
    required: false,
  })
  coef?: string;

  @ApiProperty({
    name: 'ngap_key_name',
    required: false,
  })
  ngap_key_name?: string;

  @ApiProperty({
    name: 'type',
    required: false,
  })
  type?: string;

  @ApiProperty({
    name: 'ccamCode',
    required: false,
  })
  ccamCode?: string;

  @ApiProperty({
    name: 'cotation',
    required: false,
  })
  cotation?: string;

  @ApiProperty({
    name: 'tarif_secu',
    required: false,
  })
  tarif_secu?: string;

  @ApiProperty({
    name: 'secuAmount',
    required: false,
  })
  secuAmount?: string;

  @ApiProperty({
    name: 'secuRepayment',
    required: false,
  })
  secuRepayment?: number;

  @ApiProperty({
    name: 'mutualRepaymentType',
    required: false,
  })
  mutualRepaymentType?: number;

  @ApiProperty({
    name: 'mutualRepaymentRate',
    required: false,
  })
  mutualRepaymentRate?: string;

  @ApiProperty({
    name: 'mutualRepayment',
    required: false,
  })
  mutualRepayment?: string;

  @ApiProperty({
    name: 'mutualComplement',
    required: false,
  })
  mutualComplement?: string;

  @ApiProperty({
    name: 'personRepayment',
    required: false,
  })
  personRepayment?: string;

  @ApiProperty({
    name: 'personAmount',
    required: false,
  })
  personAmount?: string;

  @ApiProperty({
    name: 'remboursable',
    required: false,
  })
  remboursable?: string;

  @ApiProperty({
    name: 'materiau',
    required: false,
  })
  materiau?: number;

  @ApiProperty({
    name: 'roc',
    required: false,
  })
  roc?: string;

  @ApiProperty({
    name: 'typeLigne',
    required: false,
  })
  typeLigne?: string;

  @ApiProperty({
    name: 'descriptive_text',
    required: false,
  })
  descriptive_text?: string;

  @ApiProperty({
    name: 'materiau',
    required: false,
  })
  rss?: number;

  @ApiProperty({
    name: 'estimatedMonthTreatment',
    required: false,
    description: '2023-07-01',
  })
  estimatedMonthTreatment?: string;

  @ApiProperty({
    name: 'descriptive_text',
    required: false,
  })
  nouveau?: boolean;

  @ApiProperty({
    name: 'descriptive_text',
    required: false,
  })
  prixvente?: number;

  @ApiProperty({
    name: 'prestation',
    required: false,
  })
  prestation?: number;

  @ApiProperty({
    name: 'charges',
    required: false,
  })
  charges?: string;

  @ApiProperty({
    name: 'nrss',
    required: false,
  })
  nrss?: string;
}

@ApiExtraModels()
export class DevisRequestAjaxDto {
  @ApiProperty({
    name: 'operation',
    required: false,
  })
  operation?: string;

  @ApiProperty({
    name: 'id_devisHN',
    required: false,
  })
  id_devisHN?: number;

  @ApiProperty({
    name: 'id_user',
    required: false,
  })
  id_user?: number;

  @ApiProperty({
    name: 'datedevisHN',
    required: false,
    // format: 'd/m/Y',\
    description: '17/07/2023',
  })
  datedevisHN?: Date;

  @ApiProperty({
    name: 'date_acceptation',
    required: false,
  })
  date_acceptation?: Date;

  @ApiProperty({
    name: 'duration',
    required: false,
  })
  duration?: string;

  @ApiProperty({
    name: 'titreDevisHN',
    required: false,
  })
  titreDevisHN?: string;

  @ApiProperty({
    name: 'identPrat',
    required: false,
  })
  identPrat?: string;

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
    name: 'infosCompl',
    required: false,
  })
  infosCompl?: string;

  @ApiProperty({
    name: 'couleur',
    required: false,
  })
  couleur?: string;

  @ApiProperty({
    name: 'schemas',
    required: false,
  })
  schemas?: string;

  @ApiProperty({
    name: 'amount',
    required: false,
  })
  amount?: number;

  @ApiProperty({
    name: 'personRepayment',
    required: false,
  })
  personRepayment?: number;

  @ApiProperty({
    name: 'signaturePatient',
    required: false,
  })
  signaturePatient?: string;

  @ApiProperty({
    name: 'signaturePraticien',
    required: false,
  })
  signaturePraticien?: string;

  @ApiProperty({
    name: 'prestations',
    required: false,
  })
  prestations?: PrestationsRequestAjaxDto[];

  @ApiProperty({
    name: 'attachments',
    required: false,
  })
  attachments?: number[];

  @ApiProperty({
    name: 'treatment_timeline',
    required: false,
  })
  treatment_timeline?: boolean;
}
