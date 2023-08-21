export interface IInfomationSchemaColumn {
  TABLE_CATALOG?: string;

  TABLE_SCHEMA?: string;

  TABLE_NAME?: string;

  COLUMN_NAME?: string;

  ORDINAL_POSITION?: number;

  COLUMN_DEFAULT?: string;

  IS_NULLABLE?: string;

  DATA_TYPE?: string;

  CHARACTER_MAXIMUM_LENGTH?: string;

  CHARACTER_OCTET_LENGTH?: string;

  NUMERIC_PRECISION?: number;

  NUMERIC_SCALE?: number;

  DATETIME_PRECISION?: string;

  CHARACTER_SET_NAME?: string;

  COLLATION_NAME?: string;

  COLUMN_TYPE?: string;

  COLUMN_KEY?: string;

  EXTRA?: string;

  PRIVILEGES?: string;

  COLUMN_COMMENT?: string;

  GENERATION_EXPRESSION?: string;

  SRS_ID?: number;
}
