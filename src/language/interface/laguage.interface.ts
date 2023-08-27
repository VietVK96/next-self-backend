export interface LocaleConfigLang {
  isDefault?: boolean;
  name: string;
  localeName: string;
  sheetId: string;
  sheetName: string;
  messages?: Record<string, string>;
}
export interface LocaleConfig {
  lang: LocaleConfigLang[];
  sheetRootId: string;
}
