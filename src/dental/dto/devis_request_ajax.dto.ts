import { ApiProperty, ApiExtraModels, IntersectionType } from '@nestjs/swagger';

@ApiExtraModels()
export class DevisRequestAjaxDto {
  @ApiProperty({
    name: 'operation',
    required: true,
  })
  operation?: string;

  @ApiProperty({
    name: 'ident_prat',
    required: true,
    default: '',
  })
  ident_prat?: string;

  @ApiProperty({
    name: 'ident_pdt',
    required: true,
  })
  id_pdt?: number;

  @ApiProperty({
    name: 'ident_pat',
    required: true,
  })
  ident_pat?: number;

  @ApiProperty({
    name: 'details',
    required: false,
  })
  details?: string;

  @ApiProperty({
    name: 'nom_prenom_patient',
    required: false,
    default: '',
  })
  nom_prenom_patient?: string;

  @ApiProperty({
    name: 'duree_devis',
    required: false,
  })
  duree_devis?: string;

  @ApiProperty({
    name: 'adresse_pat',
    required: false,
  })
  adresse_pat?: string;

  @ApiProperty({
    name: 'tel',
    required: false,
  })
  tel?: string;

  @ApiProperty({
    name: 'organisme',
    required: false,
  })
  organisme?: string;

  @ApiProperty({
    name: 'contrat',
    required: false,
  })
  contrat?: string;

  @ApiProperty({
    name: 'ref',
    required: false,
  })
  ref?: string;

  @ApiProperty({
    name: 'dispo',
    required: false,
  })
  dispo?: number;

  @ApiProperty({
    name: 'dispo_desc',
    required: false,
  })
  dispo_desc?: string;

  @ApiProperty({
    name: 'description',
    required: false,
  })
  description?: string;

  @ApiProperty({
    name: 'id_devis',
    required: false,
  })
  id_devis?: number;

  @ApiProperty({
    name: 'placeOfManufacture',
    required: true,
  })
  placeOfManufacture?: number;

  @ApiProperty({
    name: 'placeOfManufactureLabel',
    required: false,
  })
  placeOfManufactureLabel?: string;

  @ApiProperty({
    name: 'withSubcontracting',
    required: false,
  })
  withSubcontracting?: number;

  @ApiProperty({
    name: 'placeOfSubcontracting',
    required: false,
  })
  placeOfSubcontracting?: number;

  @ApiProperty({
    name: 'placeOfSubcontractingLabel',
    required: false,
  })
  placeOfSubcontractingLabel?: string;

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
    name: 'date_devis',
    required: false,
  })
  date_devis?: string;

  @ApiProperty({
    name: 'date_de_naissance_patient',
    required: false,
  })
  date_de_naissance_patient?: string;

  @ApiProperty({
    name: 'title',
    required: false,
    default: '',
  })
  title?: string;

  @ApiProperty({
    name: 'date_acceptation',
    required: false,
  })
  date_acceptation?: string;

  @ApiProperty({
    name: 'insee',
    required: false,
  })
  insee?: string;

  @ApiProperty({
    name: 'id_devis_ligne',
    required: false,
    default: 0,
  })
  id_devis_ligne?: number;

  @ApiProperty({
    name: 'materiau',
    required: false,
  })
  materiau?: string;

  @ApiProperty()
  attachments?: [number];

  @ApiProperty({
    name: 'quotationPlaceOfManufacture',
    required: false,
  })
  quotationPlaceOfManufacture?: number;

  @ApiProperty({
    name: 'quotationPlaceOfManufactureLabel',
    required: false,
  })
  quotationPlaceOfManufactureLabel?: string;

  @ApiProperty({
    name: 'quotationWithSubcontracting',
    required: false,
  })
  quotationWithSubcontracting?: number;

  @ApiProperty({
    name: 'quotationPlaceOfSubcontracting',
    required: false,
  })
  quotationPlaceOfSubcontracting?: number;

  @ApiProperty({
    name: 'quotationPlaceOfSubcontractingLabel',
    required: false,
  })
  quotationPlaceOfSubcontractingLabel?: string;
}

export class QuotationDevisRequestAjaxDto extends IntersectionType(
  DevisRequestAjaxDto,
) {
  @ApiProperty({
    name: 'schemes',
    required: false,
  })
  schemes?: string;

  @ApiProperty({
    name: 'displayNotice',
    required: false,
  })
  displayNotice?: number;
}

export class Convention2020RequestAjaxDto {
  @ApiProperty({
    name: 'accepted_on',
    required: true,
  })
  accepted_on?: string;

  @ApiProperty({
    name: 'acts',
    required: true,
  })
  acts?: ActDto[];

  @ApiProperty({
    name: 'attachments',
    required: true,
  })
  attachments?: AttachmentDto[];

  @ApiProperty({
    name: 'date',
    required: true,
  })
  date?: string;

  @ApiProperty({
    name: 'description',
    required: true,
  })
  description?: string;

  @ApiProperty({
    name: 'operation',
    required: true,
  })
  operation?: string;

  @ApiProperty({
    name: 'place_of_manufacture',
    required: true,
  })
  place_of_manufacture?: number;

  @ApiProperty({
    name: 'place_of_subcontracting',
    required: true,
  })
  place_of_subcontracting?: number;

  @ApiProperty({
    name: 'print_explanatory_note',
    required: true,
  })
  print_explanatory_note?: boolean;

  @ApiProperty({
    name: 'valid_until',
    required: true,
  })
  valid_until?: string;

  @ApiProperty({
    name: 'patient_signature',
    required: true,
  })
  patient_signature?: string;

  @ApiProperty({
    name: 'user_signature',
    required: true,
  })
  user_signature?: string;
}

export class ActDto {
  @ApiProperty({
    name: 'id',
    required: true,
  })
  id?: number;

  @ApiProperty({
    name: 'materials',
    required: true,
  })
  materials?: string;
}

export class AttachmentDto {
  @ApiProperty({
    name: 'id',
    required: true,
  })
  id?: number;
}
