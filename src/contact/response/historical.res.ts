import { ApiProperty } from '@nestjs/swagger';

export class HistoricalRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  date?: string;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  createdOn?: string;

  @ApiProperty()
  practitionerId?: number;

  @ApiProperty()
  practitionerAbbr?: string;

  @ApiProperty()
  practitionerLastname?: string;

  @ApiProperty()
  practitionerFirstname?: string;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  type?: string;

  @ApiProperty()
  filter?: string;

  @ApiProperty()
  color?: number; // For contactNote

  @ApiProperty()
  dateAccept?: string; // For dentalQuotation

  @ApiProperty()
  template?: string; // For dentalQuotation

  @ApiProperty()
  library_act_id?: number; // For prestation

  @ApiProperty()
  msg?: string; // perstation

  @ApiProperty()
  status?: number; // perstation

  @ApiProperty()
  traceability_status?: number; // perstation

  @ApiProperty()
  caresheetId?: number; // perstation

  @ApiProperty()
  dental_material_id?: number; // perstation

  @ApiProperty()
  nomenclature?: string; // perstation

  @ApiProperty()
  teeth?: string; // perstation

  @ApiProperty()
  exceeding?: string; // perstation

  @ApiProperty()
  comp?: string; // perstation

  @ApiProperty()
  ccamCode?: string; // perstation

  @ApiProperty()
  exceptional_refund?: string; // perstation

  @ApiProperty()
  ccam_id?: number; // perstation

  @ApiProperty()
  ccam_code?: string; // perstation

  @ApiProperty()
  coef?: string; // perstation

  @ApiProperty()
  ccam_repayable_on_condition?: number; // perstation

  @ApiProperty()
  ccam_panier_id?: number; // perstation

  @ApiProperty()
  ccam_panier_code?: string; // perstation

  @ApiProperty()
  ccam_panier_label?: string; // perstation

  @ApiProperty()
  ccam_panier_color?: string; // perstation

  @ApiProperty()
  ccam_menu_paragraphe?: string; // perstation

  @ApiProperty()
  ngap_key_id?: number; // perstation

  @ApiProperty()
  cotation?: string; // perstation

  @ApiProperty()
  code?: string; // perstation

  @ApiProperty()
  deletedOn?: string; // caresheet

  @ApiProperty()
  nbr?: string; // caresheet

  @ApiProperty()
  caresheet_status_fse_id?: number; // caresheet

  @ApiProperty()
  caresheet_status_fse_label?: string; // caresheet

  @ApiProperty()
  caresheet_status_fse_description?: string; // caresheet

  @ApiProperty()
  caresheet_status_dre_id?: number; // caresheet

  @ApiProperty()
  caresheet_status_dre_value?: string; // caresheet

  @ApiProperty()
  caresheet_status_dre_label?: string; // caresheet

  @ApiProperty()
  caresheet_status_dre_description?: string; // caresheet
}
